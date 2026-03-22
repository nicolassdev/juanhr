import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PermissionsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() { return this.prisma.permission.findMany(); }

  @Post('assign')
  async assign(@Body() dto: { userId: number; permissionId: number; granted: boolean }, @CurrentUser('id') adminId: number) {
    const result = await this.prisma.userPermission.upsert({
      where: { userId_permissionId: { userId: dto.userId, permissionId: dto.permissionId } },
      create: { userId: dto.userId, permissionId: dto.permissionId, granted: dto.granted, grantedBy: adminId },
      update: { granted: dto.granted, grantedBy: adminId },
    });
    return result;
  }

  @Get('user/:id')
  getUserPermissions(@Body() dto: any) {
    return this.prisma.userPermission.findMany({
      where: { userId: dto.id }, include: { permission: true },
    });
  }
}
