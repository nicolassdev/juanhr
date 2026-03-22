import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.schedule.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  findOne(id: number) {
    return this.prisma.schedule.findFirst({ where: { id, deletedAt: null } });
  }

  async create(dto: any, userId: number) {
    const schedule = await this.prisma.schedule.create({
      data: {
        ...dto,
        workDays: JSON.stringify(dto.workDays),
        createdBy: userId,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE_SCHEDULE",
        module: "schedules",
        targetId: schedule.id,
      },
    });
    return schedule;
  }

  async update(id: number, dto: any, userId: number) {
    const s = await this.prisma.schedule.findFirst({
      where: { id, deletedAt: null },
    });
    if (!s) throw new NotFoundException();
    const updated = await this.prisma.schedule.update({
      where: { id },
      data: {
        ...dto,
        workDays: dto.workDays ? JSON.stringify(dto.workDays) : undefined,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE_SCHEDULE",
        module: "schedules",
        targetId: id,
      },
    });
    return updated;
  }

  async remove(id: number, userId: number) {
    await this.prisma.schedule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE_SCHEDULE",
        module: "schedules",
        targetId: id,
      },
    });
    return { message: "Schedule deleted" };
  }

  // FIX: always cast ojtId + scheduleId to Int — string IDs from JSON body cause upsert to always resolve id=1
  async assignToOjt(ojtId: number, scheduleId: number, assignedBy: number) {
    const ojtIdInt = Number(ojtId);
    const scheduleIdInt = Number(scheduleId);
    const assignedByInt = Number(assignedBy);

    // Verify schedule exists
    const schedule = await this.prisma.schedule.findFirst({
      where: { id: scheduleIdInt, deletedAt: null },
    });
    if (!schedule)
      throw new NotFoundException(`Schedule ID ${scheduleIdInt} not found`);

    const result = await this.prisma.ojtSchedule.upsert({
      where: { ojtId: ojtIdInt },
      create: {
        ojtId: ojtIdInt,
        scheduleId: scheduleIdInt,
        assignedBy: assignedByInt,
        effectiveAt: new Date(),
      },
      update: {
        scheduleId: scheduleIdInt,
        assignedBy: assignedByInt,
        effectiveAt: new Date(),
      },
      include: { schedule: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: assignedByInt,
        action: "ASSIGN_SCHEDULE",
        module: "schedules",
        targetId: ojtIdInt,
        newValues: JSON.stringify({
          scheduleId: scheduleIdInt,
          scheduleName: schedule.name,
        }),
      },
    });

    return result;
  }

  // Get current schedule for an OJT
  async getOjtSchedule(ojtId: number) {
    return this.prisma.ojtSchedule.findUnique({
      where: { ojtId: Number(ojtId) },
      include: { schedule: true },
    });
  }
}
