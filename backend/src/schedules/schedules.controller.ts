import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { SchedulesService } from "./schedules.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("schedules")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private service: SchedulesService) {}

  @Get()
  @Roles("admin", "supervisor")
  findAll() {
    return this.service.findAll();
  }

  @Get("ojt/:ojtId")
  @Roles("admin", "supervisor")
  getOjtSchedule(@Param("ojtId", ParseIntPipe) ojtId: number) {
    return this.service.getOjtSchedule(ojtId);
  }

  @Get(":id")
  @Roles("admin", "supervisor")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles("admin")
  create(@Body() dto: any, @CurrentUser("id") userId: number) {
    return this.service.create(dto, userId);
  }

  @Put(":id")
  @Roles("admin")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser("id") userId: number,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Delete(":id")
  @Roles("admin")
  remove(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser("id") userId: number,
  ) {
    return this.service.remove(id, userId);
  }

  @Post("assign")
  @Roles("admin", "supervisor")
  assign(
    @Body() dto: { ojtId: number; scheduleId: number },
    @CurrentUser("id") userId: number,
  ) {
    // Always cast — body JSON may deliver strings for numeric fields
    return this.service.assignToOjt(
      Number(dto.ojtId),
      Number(dto.scheduleId),
      Number(userId),
    );
  }
}
