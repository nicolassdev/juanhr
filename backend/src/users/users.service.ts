import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateOjtProfileDto,
} from "./dto/users.dto";
import * as bcrypt from "bcrypt";

const USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  gender: true,
  school: true,
  course: true,
  profileImage: true,
  isActive: true,
  isLocked: true,
  lastLoginAt: true,
  createdAt: true,
  role: { select: { id: true, name: true, label: true } },
  department: { select: { id: true, name: true } },
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { role, departmentId, search, page = 1, limit = 20 } = query;
    const where: any = { deletedAt: null };
    if (role) where.role = { name: role };
    if (departmentId) where.departmentId = +departmentId;
    if (search)
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
      ];
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip: (+page - 1) * +limit,
        take: +limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total, page: +page, limit: +limit };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...USER_SELECT,
        supervisorAssignment: {
          include: {
            supervisor: { select: { id: true, fullName: true, email: true } },
          },
        },
        supervisedOjts: {
          include: {
            ojt: { select: { id: true, fullName: true, email: true } },
          },
        },
        ojtSchedule: { include: { schedule: true } },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async create(dto: CreateUserDto, adminId: number) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException("Email already in use");
    const roleId =
      dto.roleId ||
      (await this.prisma.role.findUnique({ where: { name: "ojt" } })).id;
    const hash = await bcrypt.hash(dto.password, 12);
    const { password, roleId: _rid, ...rest } = dto;
    const user = await this.prisma.user.create({
      data: { ...rest, passwordHash: hash, roleId },
      select: USER_SELECT,
    });
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "CREATE_USER",
        module: "users",
        targetId: user.id,
        targetType: "user",
      },
    });
    return user;
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    requesterId: number,
    requesterRole: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException("User not found");
    if (requesterRole === "ojt" && requesterId !== id)
      throw new ForbiddenException();
    const { password: _pw, ...updateData } = dto as any;
    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });
    await this.prisma.auditLog.create({
      data: {
        userId: requesterId,
        action: "UPDATE_USER",
        module: "users",
        targetId: id,
        targetType: "user",
        newValues: JSON.stringify(dto),
      },
    });
    return updated;
  }

  async updateOjtProfile(
    id: number,
    dto: UpdateOjtProfileDto,
    requesterId: number,
  ) {
    if (requesterId !== id)
      throw new ForbiddenException("Cannot edit another user profile");
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SELECT,
    });
  }

  async remove(id: number, adminId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException("User not found");
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "DELETE_USER",
        module: "users",
        targetId: id,
        targetType: "user",
      },
    });
    return { message: "User deleted" };
  }

  async changeRole(id: number, roleId: number, adminId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException();
    const updated = await this.prisma.user.update({
      where: { id },
      data: { roleId },
      select: USER_SELECT,
    });
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "CHANGE_ROLE",
        module: "users",
        targetId: id,
        targetType: "user",
        newValues: JSON.stringify({ roleId }),
      },
    });
    return updated;
  }

  async toggleLock(id: number, adminId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException();
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isLocked: !user.isLocked },
      select: USER_SELECT,
    });
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: user.isLocked ? "UNLOCK_USER" : "LOCK_USER",
        module: "users",
        targetId: id,
        targetType: "user",
      },
    });
    return updated;
  }

  async updateAvatar(id: number, imagePath: string) {
    return this.prisma.user.update({
      where: { id },
      data: { profileImage: imagePath },
      select: USER_SELECT,
    });
  }

  async getDashboardStats() {
    const [totalOjt, totalSupervisors, totalDepartments, totalUsers] =
      await Promise.all([
        this.prisma.user.count({
          where: { role: { name: "ojt" }, deletedAt: null },
        }),
        this.prisma.user.count({
          where: { role: { name: "supervisor" }, deletedAt: null },
        }),
        this.prisma.department.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { deletedAt: null } }),
      ]);
    const recentUsers = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: USER_SELECT,
    });
    return {
      totalOjt,
      totalSupervisors,
      totalDepartments,
      totalUsers,
      recentUsers,
    };
  }

  async changePassword(id: number, newPassword: string, adminId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException("User not found");
    const hash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: hash },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "CHANGE_PASSWORD",
        module: "users",
        targetId: id,
        targetType: "user",
      },
    });
    return { message: "Password updated successfully" };
  }
}
