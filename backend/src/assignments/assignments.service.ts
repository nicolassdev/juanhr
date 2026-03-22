import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.supervisorAssignment.findMany({
      include: {
        supervisor: { select: { id: true, fullName: true, email: true } },
        ojt: { select: { id: true, fullName: true, email: true, school: true, course: true } },
      },
    });
  }

  async assign(supervisorId: number, ojtId: number, adminId: number) {
    const result = await this.prisma.supervisorAssignment.upsert({
      where: { ojtId },
      create: { supervisorId, ojtId, assignedBy: adminId },
      update: { supervisorId, assignedBy: adminId },
    });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'ASSIGN_SUPERVISOR', module: 'assignments', targetId: ojtId },
    });
    // Notify
    await this.prisma.notification.create({
      data: { userId: ojtId, type: 'SUPERVISOR_ASSIGNED', title: 'Supervisor Assigned', body: 'A supervisor has been assigned to you.' },
    });
    return result;
  }

  getMySupervisedOjts(supervisorId: number) {
    return this.prisma.supervisorAssignment.findMany({
      where: { supervisorId },
      include: { ojt: { select: { id: true, fullName: true, email: true, school: true, course: true, profileImage: true } } },
    });
  }
}
