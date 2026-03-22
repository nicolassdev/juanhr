import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DepartmentsController {
  constructor(private service: DepartmentsService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Post() create(@Body() dto: any, @CurrentUser('id') uid: number) { return this.service.create(dto, uid); }
  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @CurrentUser('id') uid: number) { return this.service.update(id, dto, uid); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') uid: number) { return this.service.remove(id, uid); }
}
