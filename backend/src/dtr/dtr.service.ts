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
        data: {
          userId: assignment.supervisorId,
          type,
          title,
          body,
        },
      });
    } catch {
      /* non-critical — don't throw */
    }
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

    if (!ojtSchedule || !ojtSchedule.schedule) {
      throw new BadRequestException(
        "No schedule assigned. Contact your supervisor.",
      );
    }

    const schedule = ojtSchedule.schedule;
    const periodType = schedule.periodType;
    const workDays: string[] = JSON.parse(schedule.workDays);

    if (!workDays.includes(dayName)) {
      throw new BadRequestException(
        `Today (${dayName}) is not a work day. Schedule: ${workDays.join(", ")}.`,
      );
    }

    const amInTime = this.parseTimeToday(schedule.amIn);
    const graceCutoff = new Date(
      amInTime.getTime() + schedule.graceMinutes * 60000,
    );
    const status = now > graceCutoff ? "late" : "present";

    const selfiePath = selfieFile
      ? `/uploads/selfies/${selfieFile.filename}`
      : null;

    const existing = await this.prisma.dtr.findUnique({
      where: { userId_date: { userId, date: dateOnly } },
    });

    // Get OJT name for notification
    const ojtUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const timeStr = now.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
    });

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
      // Notify supervisor
      await this.notifySupervisor(
        userId,
        `${ojtUser?.fullName} clocked in`,
        `${status === "late" ? "⚠️ Late clock-in" : "✅ On time"} at ${timeStr}`,
        "DTR_IN",
      );
      return {
        message: "Clock-in (AM) recorded",
        status,
        time: now,
        periodType,
        nextAction: "clock-out",
      };
    }

    if (periodType === "two_period") {
      if (!existing.amOut)
        throw new BadRequestException("Please clock out AM first.");
      if (existing.pmIn)
        throw new BadRequestException("Already clocked in for PM.");
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
        periodType,
        nextAction: "clock-out",
      };
    }

    throw new BadRequestException(
      existing.amOut
        ? "Already completed your record today."
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

    if (!ojtSchedule || !ojtSchedule.schedule) {
      throw new BadRequestException(
        "No schedule assigned. Contact your supervisor.",
      );
    }

    const schedule = ojtSchedule.schedule;
    const periodType = schedule.periodType;

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

    if (!existing.amOut) {
      const amMinutes = this.computeMinutes(existing.amIn, now);
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
          `AM clock-out at ${timeStr}`,
          "DTR_OUT",
        );
      }
      return {
        message: isDayComplete
          ? "Clock-out recorded. Day complete!"
          : "AM Clock-out recorded",
        minutesWorked: amMinutes,
        isDayComplete,
        periodType,
      };
    }

    if (periodType === "one_period")
      throw new BadRequestException("Already completed today.");

    if (!existing.pmIn)
      throw new BadRequestException("Please clock in for PM first.");
    if (existing.pmOut)
      throw new BadRequestException("Already clocked out PM.");

    const pmMinutes = this.computeMinutes(existing.pmIn, now);
    const amMinutes = existing.amOut
      ? this.computeMinutes(existing.amIn, existing.amOut)
      : 0;
    const total = amMinutes + pmMinutes;

    await this.prisma.dtr.update({
      where: { id: existing.id },
      data: { pmOut: now, pmOutSelfie: selfiePath, totalMinutes: total },
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
      `✅ Day complete at ${timeStr} — ${this.fmt(total)} total rendered`,
      "DTR_OUT",
    );
    return {
      message: "PM Clock-out. Day complete!",
      totalMinutes: total,
      isDayComplete: true,
      periodType,
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
    return {
      totalDays: records.length,
      totalMinutes,
      totalHours: +(totalMinutes / 60).toFixed(2),
      present: records.filter((r) => r.status === "present").length,
      late: records.filter((r) => r.status === "late").length,
      halfDay: records.filter((r) => r.status === "half_day").length,
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
