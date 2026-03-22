import {
  Injectable, ConflictException, UnauthorizedException, BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 12);
    const userCount = await this.prisma.user.count({ where: { deletedAt: null } });
    const roleName = userCount === 0 ? 'admin' : 'ojt';
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash: hash,
        gender: dto.gender,
        school: dto.school,
        course: dto.course,
        roleId: role.id,
      },
    });

    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'REGISTER', module: 'auth', targetId: user.id, targetType: 'user' },
    });

    return { message: 'Registered successfully', userId: user.id };
  }

  async login(dto: LoginDto, ip: string, ua: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true, userPermissions: { include: { permission: true } } },
    });
    if (!user || user.deletedAt) throw new UnauthorizedException('Invalid credentials');
    if (user.isLocked) throw new UnauthorizedException('Account is locked. Contact admin.');
    if (!user.isActive) throw new UnauthorizedException('Account is inactive.');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const permissions = user.userPermissions.filter(p => p.granted).map(p => p.permission.key);
    const tokens = await this.generateTokens(user.id, user.role.name, permissions);

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN', module: 'auth', ipAddress: ip, userAgent: ua },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id, fullName: user.fullName, email: user.email,
        role: user.role.name, profileImage: user.profileImage,
      },
    };
  }

  async refresh(token: string) {
    if (!token) throw new UnauthorizedException('No refresh token');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } },
      include: { user: { include: { role: true, userPermissions: { include: { permission: true } } } } },
    });
    if (!stored) throw new UnauthorizedException('Invalid refresh token');

    // Revoke old
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    const perms = stored.user.userPermissions.filter(p => p.granted).map(p => p.permission.key);
    return this.generateTokens(stored.user.id, stored.user.role.name, perms);
  }

  async logout(userId: number) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'LOGOUT', module: 'auth' },
    });
    return { message: 'Logged out' };
  }

  private async generateTokens(userId: number, role: string, permissions: string[]) {
    const payload = { sub: userId, role, permissions };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });
    const refreshToken = randomBytes(40).toString('hex');
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
    return { accessToken, refreshToken };
  }
}
