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

  private getTodayUTC(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  /**
   * Determine the DTR status for a record.
   * Priority: missing_logs → late → present
   */
  private computeStatus(
    dtr: {
      amIn: Date | null;
      amOut: Date | null;
      pmIn: Date | null;
      pmOut: Date | null;
    },
    schedule: {
      periodType: string;
      amIn: string;
      amOut: string;
      pmIn?: string | null;
      pmOut?: string | null;
      graceMinutes: number;
      lateRule?: string | null;
    },
  ): string {
    const isTwo = schedule.periodType === "two_period";

    // ── MISSING LOGS DETECTION ──────────────────────────────
    // AM in but no AM out
    if (dtr.amIn && !dtr.amOut) return "missing_logs";
    // AM out but no AM in (should not happen but guard it)
    if (!dtr.amIn && dtr.amOut) return "missing_logs";
    // 2-period: PM in but no PM out
    if (isTwo && dtr.pmIn && !dtr.pmOut) return "missing_logs";
    // 2-period: PM out but no PM in
    if (isTwo && !dtr.pmIn && dtr.pmOut) return "missing_logs";

    // ── LATE DETECTION ──────────────────────────────────────
    if (dtr.amIn) {
      let cutoff: Date;
      if (schedule.lateRule) {
        // Use explicit lateRule time (e.g. "08:05")
        const [lh, lm] = schedule.lateRule.split(":").map(Number);
        cutoff = new Date(dtr.amIn);
        cutoff.setHours(lh, lm, 0, 0);
      } else {
        // Fall back to grace-period-based cutoff
        const [ah, am] = schedule.amIn.split(":").map(Number);
        cutoff = new Date(dtr.amIn);
        cutoff.setHours(ah, am + schedule.graceMinutes, 0, 0);
      }
      if (dtr.amIn > cutoff) return "late";
    }

    return "present";
  }

  /** Notify the supervisor assigned to this OJT */
  private async notifySupervisor(
    ojtUserId: number,
    title: string,
    body: string,
    type: string,
  ) {
    try {
      const assignment = await this.prisma.supervisorAssignment.findUnique({
        where: { ojtId: ojtUserId },
      });
      if (!assignment) return;
      await this.prisma.notification.create({
        data: { userId: assignment.supervisorId, type, title, body },
      });
    } catch {}
  }

  async clockIn(
    userId: number,
    selfieFile: Express.Multer.File,
    notes: string,
  ) {
    const now = new Date();
    const dateOnly = this.getTodayUTC();
    const dayName = this.getDayName(now);

    const ojtSchedule = await this.prisma.ojtSchedule.findUnique({
      where: { ojtId: userId },
      include: { schedule: true },
    });
    if (!ojtSchedule?.schedule)
      throw new BadRequestException(
        "No schedule assigned. Contact your supervisor.",
      );

    const schedule = ojtSchedule.schedule;
    const workDays: string[] = JSON.parse(schedule.workDays);
    if (!workDays.includes(dayName))
      throw new BadRequestException(`Today (${dayName}) is not a work day.`);

    // Late rule: explicit time OR grace period
    let cutoff: Date;
    if (schedule.lateRule) {
      const [lh, lm] = (schedule.lateRule as string).split(":").map(Number);
      cutoff = new Date();
      cutoff.setHours(lh, lm, 0, 0);
    } else {
      const amInTime = this.parseTimeToday(schedule.amIn);
      cutoff = new Date(amInTime.getTime() + schedule.graceMinutes * 60000);
    }
    const amStatus = now > cutoff ? "late" : "present";

    const selfiePath = selfieFile
      ? `/uploads/selfies/${selfieFile.filename}`
      : null;
    const existing = await this.prisma.dtr.findUnique({
      where: { userId_date: { userId, date: dateOnly } },
    });
    const ojtUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const timeStr = now.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // ── FIRST CLOCK-IN (AM In) ────────────────────────────────
    if (!existing) {
      const dtr = await this.prisma.dtr.create({
        data: {
          userId,
          scheduleId: schedule.id,
          date: dateOnly,
          amIn: now,
          amInSelfie: selfiePath,
          status: amStatus,
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
      await this.notifySupervisor(
        userId,
        `${ojtUser?.fullName} clocked in`,
        `${amStatus === "late" ? "⚠️ Late" : "✅ On time"} at ${timeStr}`,
        "DTR_IN",
      );
      return {
        message: "Clock-in (AM) recorded",
        status: amStatus,
        time: now,
        periodType: schedule.periodType,
        nextAction: "clock-out",
      };
    }

    // ── SECOND CLOCK-IN (PM In) — two_period only ─────────────
    if (schedule.periodType === "two_period") {
      if (!existing.amOut && existing.amIn) {
        // Employee clocking in PM without clocking out AM → mark AM as missing_logs first
        await this.prisma.dtr.update({
          where: { id: existing.id },
          data: { status: "missing_logs", pmIn: now, pmInSelfie: selfiePath },
        });
        await this.notifySupervisor(
          userId,
          `${ojtUser?.fullName} clocked in (PM)`,
          `PM clock-in at ${timeStr} — AM clock-out missing`,
          "DTR_IN",
        );
        return {
          message: "Clock-in (PM) recorded. Warning: AM clock-out was missing.",
          time: now,
          periodType: schedule.periodType,
          nextAction: "clock-out",
        };
      }
      if (existing.pmIn)
        throw new BadRequestException(
          "Already clocked in for PM. Please clock out.",
        );
      await this.prisma.dtr.update({
        where: { id: existing.id },
        data: { pmIn: now, pmInSelfie: selfiePath },
      });
      await this.notifySupervisor(
        userId,
        `${ojtUser?.fullName} clocked in (PM)`,
        `PM clock-in at ${timeStr}`,
        "DTR_IN",
      );
      return {
        message: "Clock-in (PM) recorded",
        time: now,
        periodType: schedule.periodType,
        nextAction: "clock-out",
      };
    }

    throw new BadRequestException(
      existing.amOut
        ? "Day complete."
        : "Already clocked in. Please clock out first.",
    );
  }

  async clockOut(
    userId: number,
    selfieFile: Express.Multer.File,
    notes: string,
  ) {
    const now = new Date();
    const dateOnly = this.getTodayUTC();

    const ojtSchedule = await this.prisma.ojtSchedule.findUnique({
      where: { ojtId: userId },
      include: { schedule: true },
    });
    if (!ojtSchedule?.schedule)
      throw new BadRequestException("No schedule assigned.");

    const schedule = ojtSchedule.schedule;
    const existing = await this.prisma.dtr.findUnique({
      where: { userId_date: { userId, date: dateOnly } },
    });
    if (!existing)
      throw new BadRequestException("No clock-in found for today.");

    const selfiePath = selfieFile
      ? `/uploads/selfies/${selfieFile.filename}`
      : null;
    const ojtUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const timeStr = now.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // ── AM CLOCK OUT ──────────────────────────────────────────
    if (!existing.amOut) {
      const amMinutes = this.computeMinutes(existing.amIn!, now);
      const isDayComplete = schedule.periodType === "one_period";

      const updatedDtr = { ...existing, amOut: now };
      const finalStatus = isDayComplete
        ? this.computeStatus(
            { amIn: existing.amIn, amOut: now, pmIn: null, pmOut: null },
            schedule as any,
          )
        : "present"; // partial — will be re-evaluated at PM out

      await this.prisma.dtr.update({
        where: { id: existing.id },
        data: {
          amOut: now,
          amOutSelfie: selfiePath,
          totalMinutes: isDayComplete ? amMinutes : null,
          status: finalStatus,
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

      if (isDayComplete) {
        await this.notifySupervisor(
          userId,
          `${ojtUser?.fullName} clocked out`,
          `✅ Day complete at ${timeStr} — ${this.fmt(amMinutes)} rendered`,
          "DTR_OUT",
        );
      } else {
        await this.notifySupervisor(
          userId,
          `${ojtUser?.fullName} clocked out (AM)`,
          `AM out at ${timeStr}`,
          "DTR_OUT",
        );
      }
      return {
        message: isDayComplete ? "Day complete!" : "AM out recorded",
        minutesWorked: amMinutes,
        isDayComplete,
        status: finalStatus,
      };
    }

    if (schedule.periodType === "one_period")
      throw new BadRequestException("Already completed today.");
    if (!existing.pmIn)
      throw new BadRequestException("Please clock in for PM first.");
    if (existing.pmOut) throw new BadRequestException("Day already complete.");

    // ── PM CLOCK OUT ──────────────────────────────────────────
    const pmMinutes = this.computeMinutes(existing.pmIn!, now);
    const amMinutes = existing.amOut
      ? this.computeMinutes(existing.amIn!, existing.amOut)
      : 0;
    const total = amMinutes + pmMinutes;

    // Re-evaluate full-day status
    const finalStatus = this.computeStatus(
      {
        amIn: existing.amIn,
        amOut: existing.amOut,
        pmIn: existing.pmIn,
        pmOut: now,
      },
      schedule as any,
    );

    await this.prisma.dtr.update({
      where: { id: existing.id },
      data: {
        pmOut: now,
        pmOutSelfie: selfiePath,
        totalMinutes: total,
        status: finalStatus,
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
    await this.notifySupervisor(
      userId,
      `${ojtUser?.fullName} clocked out (PM)`,
      `✅ Day complete at ${timeStr} — ${this.fmt(total)} total`,
      "DTR_OUT",
    );
    return {
      message: "Day complete!",
      totalMinutes: total,
      isDayComplete: true,
      status: finalStatus,
    };
  }

  private fmt(min: number) {
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  }

  async getMyDtr(userId: number, month?: string, year?: string) {
    const y = year ? +year : new Date().getFullYear();
    const m = month ? +month - 1 : new Date().getMonth();
    const from = new Date(Date.UTC(y, m, 1));
    const to = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));
    const records = await this.prisma.dtr.findMany({
      where: { userId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    });
    // Compute totalMinutes only for complete records — ignore missing_logs
    const totalMinutes = records.reduce((s, r) => {
      if (r.status === "missing_logs") return s;
      return s + (r.totalMinutes || 0);
    }, 0);
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
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImage: true,
              school: true,
              course: true,
            },
          },
        },
        skip: (+page - 1) * +limit,
        take: +limit,
        orderBy: { date: "desc" },
      }),
      this.prisma.dtr.count({ where }),
    ]);
    return { data, total };
  }

  /** Get all OJT users with their DTR summary for the admin card view */
  async getOjtUsersSummary() {
    const ojtUsers = await this.prisma.user.findMany({
      where: { role: { name: "ojt" }, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        profileImage: true,
        school: true,
        course: true,
        ojtSchedule: { include: { schedule: true } },
      },
    });

    const results = await Promise.all(
      ojtUsers.map(async (u) => {
        const records = await this.prisma.dtr.findMany({
          where: { userId: u.id },
        });
        const totalMinutes = records
          .filter((r) => r.status !== "missing_logs")
          .reduce((s, r) => s + (r.totalMinutes || 0), 0);
        const todayUTC = this.getTodayUTC();
        const todayRecord = records.find(
          (r) =>
            new Date(r.date).toISOString().split("T")[0] ===
            todayUTC.toISOString().split("T")[0],
        );
        return {
          ...u,
          totalDays: records.length,
          totalMinutes,
          present: records.filter((r) => r.status === "present").length,
          late: records.filter((r) => r.status === "late").length,
          missingLogs: records.filter((r) => r.status === "missing_logs")
            .length,
          todayRecord: todayRecord || null,
        };
      }),
    );
    return results;
  }

  async getSummary(userId: number) {
    const records = await this.prisma.dtr.findMany({ where: { userId } });
    const validRecords = records.filter((r) => r.status !== "missing_logs");
    const totalMinutes = validRecords.reduce(
      (s, r) => s + (r.totalMinutes || 0),
      0,
    );
    return {
      totalDays: records.length,
      totalMinutes,
      totalHours: +(totalMinutes / 60).toFixed(2),
      present: records.filter((r) => r.status === "present").length,
      late: records.filter((r) => r.status === "late").length,
      missingLogs: records.filter((r) => r.status === "missing_logs").length,
    };
  }

  async getMySchedule(userId: number) {
    const s = await this.prisma.ojtSchedule.findUnique({
      where: { ojtId: userId },
      include: { schedule: true },
    });
    if (!s) return null;
    return { ...s.schedule, workDays: JSON.parse(s.schedule.workDays) };
  }
}
