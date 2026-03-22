import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('admin', 'supervisor')
  async findAll(@Query() q: any, @CurrentUser() user: any) {
    const where: any = {};
    if (user.role === 'supervisor') where.userId = user.id;
    if (q.module) where.module = q.module;
    if (q.userId) where.userId = +q.userId;
    const page = q.page ? +q.page : 1;
    const limit = q.limit ? +q.limit : 50;
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where, include: { user: { select: { id: true, fullName: true } } },
        skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, total };
  }
}
