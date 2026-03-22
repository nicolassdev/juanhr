import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DtrModule } from './dtr/dtr.module';
import { SchedulesModule } from './schedules/schedules.module';
import { DepartmentsModule } from './departments/departments.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ExportModule } from './export/export.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DtrModule,
    SchedulesModule,
    DepartmentsModule,
    AssignmentsModule,
    NotificationsModule,
    AuditModule,
    PermissionsModule,
    ExportModule,
    UploadsModule,
  ],
})
export class AppModule {}
