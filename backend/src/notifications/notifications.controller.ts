import { Controller, Get, Patch, Param, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@CurrentUser("id") userId: number) {
    const notifs = await this.prisma.notification.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    // Convert BigInt ids to string for JSON serialization
    return notifs.map((n) => ({ ...n, id: n.id.toString() }));
  }

  @Get("unread-count")
  async unreadCount(@CurrentUser("id") userId: number) {
    const count = await this.prisma.notification.count({
      where: { userId: Number(userId), isRead: false },
    });
    return { count };
  }

  @Patch(":id/read")
  async markRead(@Param("id") id: string) {
    // Use BigInt for id — notifications table uses BigInt primary key
    const updated = await this.prisma.notification.update({
      where: { id: BigInt(id) },
      data: { isRead: true, readAt: new Date() },
    });
    return { ...updated, id: updated.id.toString() };
  }

  @Patch("read-all")
  async markAllRead(@CurrentUser("id") userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: Number(userId), isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }
}
