import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private service: AssignmentsService) {}
  @Get() @Roles('admin') findAll() { return this.service.findAll(); }
  @Post() @Roles('admin') assign(@Body() dto: { supervisorId: number; ojtId: number }, @CurrentUser('id') uid: number) {
    return this.service.assign(dto.supervisorId, dto.ojtId, uid);
  }
  @Get('my-ojt') @Roles('supervisor') myOjt(@CurrentUser('id') uid: number) { return this.service.getMySupervisedOjts(uid); }
}
