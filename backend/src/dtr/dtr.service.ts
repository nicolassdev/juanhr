import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DtrService {
  constructor(private prisma: PrismaService) {}

  private computeMinutes(start: Date, end: Date): number {
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
  }

  private parseTimeToday(timeStr: string): Date {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  private getDayName(date: Date): string {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
  }

  /**
   * FIX: Build today's date as a UTC midnight value that matches
   * what the local calendar day IS — avoids the UTC-offset bug where
   * Mar 22 08:00 PH time becomes Mar 21 in the DB.
   *
   * We use Date.UTC with LOCAL year/month/day values so the stored
   * date is always the correct calendar day regardless of timezone.
   */
  private getTodayUTC(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  async clockIn(
    userId: number,
    selfieFile: Express.Multer.File,
    notes: string,
  ) {
    const now = new Date();
    const dateOnly = this.getTodayUTC(); // FIX: correct local-day date stored as UTC
    const dayName = this.getDayName(now);

    // REQUIRE schedule — no schedule = clock-in disabled
    const ojtSchedule = await this.prisma.ojtSchedule.findUnique({
      where: { ojtId: userId },
      include: { schedule: true },
    });

    if (!ojtSchedule || !ojtSchedule.schedule) {
      throw new BadRequestException(
        "No schedule assigned. You cannot clock in until your supervisor assigns a schedule to you.",
      );
    }

    const schedule = ojtSchedule.schedule;
    const periodType = schedule.periodType; // 'one_period' | 'two_period'
    const workDays: string[] = JSON.parse(schedule.workDays);

    // Validate work day
    if (!workDays.includes(dayName)) {
      throw new BadRequestException(
        `Today (${dayName}) is not a work day. Your schedule: ${workDays.join(", ")}.`,
      );
    }

    // Determine late/present status
    const amInTime = this.parseTimeToday(schedule.amIn);
    const graceCutoff = new Date(
      amInTime.getTime() + schedule.graceMinutes * 60000,
    );
    const status = now > graceCutoff ? "late" : "present";

    const selfiePath = selfieFile
      ? `/uploads/selfies/${selfieFile.filename}`
      : null;

    // Check existing DTR for today
    const existing = await this.prisma.dtr.findUnique({
      where: { userId_date: { userId, date: dateOnly } },
    });

    // ── FIRST CLOCK-IN (AM In) ──────────────────────────────────
    if (!existing) {
      const dtr = await this.prisma.dtr.create({
        data: {
          userId,
          scheduleId: schedule.id,
          date: dateOnly,
          amIn: now,
          amInSelfie: selfiePath,
          status,
          notes: notes || null,
        },
      });
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: "DTR_AM_IN",
          module: "dtr",
          targetId: dtr.id,
          targetType: "dtr",
        },
      });
      return {
        message: "Clock-in (AM) recorded",
        status,
        time: now,
        periodType,
        nextAction: "clock-out",
      };
    }

    // ── SECOND CLOCK-IN (PM In) — two_period only ───────────────
    if (periodType === "two_period") {
      if (!existing.amOut) {
        throw new BadRequestException(
          "Please clock out AM first before PM clock-in.",
        );
      }
      if (existing.pmIn) {
        throw new BadRequestException(
          "Already clocked in for PM. Please clock out.",
        );
      }
      await this.prisma.dtr.update({
        where: { id: existing.id },
        data: { pmIn: now, pmInSelfie: selfiePath },
      });
      return {
        message: "Clock-in (PM) recorded",
        time: now,
        periodType,
        nextAction: "clock-out",
      };
    }

    // ── ONE PERIOD: already clocked in ──────────────────────────
    throw new BadRequestException(
      existing.amOut
        ? "Already completed your time record for today (1-period schedule)."
        : "Already clocked in. Please clock out first.",
    );
  }

  async clockOut(
    userId: number,
    selfieFile: Express.Multer.File,
    notes: string,
  ) {
    const now = new Date();
    const dateOnly = this.getTodayUTC(); // FIX: same UTC-normalized date

    // REQUIRE schedule
    const ojtSchedule = await this.prisma.ojtSchedule.findUnique({
      where: { ojtId: userId },
      include: { schedule: true },
    });

    if (!ojtSchedule || !ojtSchedule.schedule) {
      throw new BadRequestException(
        "No schedule assigned. You cannot clock out until your supervisor assigns a schedule.",
      );
    }

    const schedule = ojtSchedule.schedule;
    const periodType = schedule.periodType;

    const existing = await this.prisma.dtr.findUnique({
      where: { userId_date: { userId, date: dateOnly } },
    });

    if (!existing) {
      throw new BadRequestException(
        "No clock-in found for today. Please clock in first.",
      );
    }

    const selfiePath = selfieFile
      ? `/uploads/selfies/${selfieFile.filename}`
      : null;

    // ── AM CLOCK OUT ─────────────────────────────────────────────
    if (!existing.amOut) {
      const amMinutes = this.computeMinutes(existing.amIn, now);
      // For one_period, this completes the day
      const isDayComplete = periodType === "one_period";
      await this.prisma.dtr.update({
        where: { id: existing.id },
        data: {
          amOut: now,
          amOutSelfie: selfiePath,
          totalMinutes: isDayComplete ? amMinutes : null,
          notes: notes || existing.notes,
        },
      });
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: "DTR_AM_OUT",
          module: "dtr",
          targetId: existing.id,
          targetType: "dtr",
        },
      });
      return {
        message: isDayComplete
          ? "Clock-out recorded. Day complete! (1-period)"
          : "AM Clock-out recorded",
        minutesWorked: amMinutes,
        isDayComplete,
        periodType,
        nextAction: isDayComplete ? "done" : "clock-in-pm",
      };
    }

    // ── ONE PERIOD: already clocked out ─────────────────────────
    if (periodType === "one_period") {
      throw new BadRequestException(
        "Already completed your time record today (1-period schedule).",
      );
    }

    // ── PM CLOCK OUT (two_period only) ───────────────────────────
    if (!existing.pmIn) {
      throw new BadRequestException(
        "Please clock in for PM before clocking out.",
      );
    }
    if (existing.pmOut) {
      throw new BadRequestException("Already clocked out PM. Day is complete.");
    }

    const pmMinutes = this.computeMinutes(existing.pmIn, now);
    const amMinutes = existing.amOut
      ? this.computeMinutes(existing.amIn, existing.amOut)
      : 0;
    const total = amMinutes + pmMinutes;

    await this.prisma.dtr.update({
      where: { id: existing.id },
      data: {
        pmOut: now,
        pmOutSelfie: selfiePath,
        totalMinutes: total,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "DTR_PM_OUT",
        module: "dtr",
        targetId: existing.id,
        targetType: "dtr",
      },
    });
    return {
      message: "PM Clock-out recorded. Day complete!",
      totalMinutes: total,
      isDayComplete: true,
      periodType,
      nextAction: "done",
    };
  }

  async getMyDtr(userId: number, month?: string, year?: string) {
    const y = year ? +year : new Date().getFullYear();
    const m = month ? +month - 1 : new Date().getMonth();
    // Use UTC dates for range query to match stored values
    const from = new Date(Date.UTC(y, m, 1));
    const to = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));

    const records = await this.prisma.dtr.findMany({
      where: { userId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    });
    const totalMinutes = records.reduce((s, r) => s + (r.totalMinutes || 0), 0);
    return {
      records,
      totalMinutes,
      totalHours: +(totalMinutes / 60).toFixed(2),
    };
  }

  async getOjtDtr(
    ojtId: number,
    requesterId: number,
    requesterRole: string,
    query: any,
  ) {
    if (requesterRole === "supervisor") {
      const assignment = await this.prisma.supervisorAssignment.findFirst({
        where: { supervisorId: requesterId, ojtId },
      });
      if (!assignment) throw new ForbiddenException("Not your assigned OJT");
    }
    return this.getMyDtr(ojtId, query.month, query.year);
  }

  async getAllDtr(query: any) {
    const { userId, dateFrom, dateTo, status, page = 1, limit = 30 } = query;
    const where: any = {};
    if (userId) where.userId = +userId;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }
    const [data, total] = await Promise.all([
      this.prisma.dtr.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        skip: (+page - 1) * +limit,
        take: +limit,
        orderBy: { date: "desc" },
      }),
      this.prisma.dtr.count({ where }),
    ]);
    return { data, total };
  }

  async getSummary(userId: number) {
    const records = await this.prisma.dtr.findMany({ where: { userId } });
    const totalMinutes = records.reduce((s, r) => s + (r.totalMinutes || 0), 0);
    const present = records.filter((r) => r.status === "present").length;
    const late = records.filter((r) => r.status === "late").length;
    const halfDay = records.filter((r) => r.status === "half_day").length;
    return {
      totalDays: records.length,
      totalMinutes,
      totalHours: +(totalMinutes / 60).toFixed(2),
      present,
      late,
      halfDay,
    };
  }

  // Return the OJT's current schedule info (used by frontend to know period type)
  async getMySchedule(userId: number) {
    const ojtSchedule = await this.prisma.ojtSchedule.findUnique({
      where: { ojtId: userId },
      include: { schedule: true },
    });
    if (!ojtSchedule) return null;
    return {
      ...ojtSchedule.schedule,
      workDays: JSON.parse(ojtSchedule.schedule.workDays),
    };
  }
}
