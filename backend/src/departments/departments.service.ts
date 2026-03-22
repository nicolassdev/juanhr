import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}
  findAll() { return this.prisma.department.findMany({ where: { deletedAt: null } }); }
  findOne(id: number) { return this.prisma.department.findFirst({ where: { id, deletedAt: null } }); }
  async create(dto: any, userId: number) {
    const dept = await this.prisma.department.create({ data: dto });
    await this.prisma.auditLog.create({ data: { userId, action: 'CREATE_DEPT', module: 'departments', targetId: dept.id } });
    return dept;
  }
  async update(id: number, dto: any, userId: number) {
    const dept = await this.prisma.department.findFirst({ where: { id, deletedAt: null } });
    if (!dept) throw new NotFoundException();
    return this.prisma.department.update({ where: { id }, data: dto });
  }
  async remove(id: number, userId: number) {
    await this.prisma.department.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Department deleted' };
  }
}
