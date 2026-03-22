import { Controller, Get, Param, Query, Res, UseGuards } from "@nestjs/common";
import { ExportService } from "./export.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Response } from "express";

@Controller("dtr/export")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportController {
  constructor(private exportService: ExportService) {}

  // OJT exports their own DTR using "me"
  @Get("excel/me")
  @Roles("ojt", "admin", "supervisor")
  excelMe(
    @CurrentUser("id") userId: number,
    @Query("month") month: string,
    @Query("year") year: string,
    @Res() res: Response,
  ) {
    return this.exportService.exportExcel(userId, month, year, res);
  }

  @Get("pdf/me")
  @Roles("ojt", "admin", "supervisor")
  pdfMe(
    @CurrentUser("id") userId: number,
    @Query("month") month: string,
    @Query("year") year: string,
    @Res() res: Response,
  ) {
    return this.exportService.exportPdf(userId, month, year, res);
  }

  // Admin/Supervisor exports any user's DTR by ID
  @Get("excel/:userId")
  @Roles("admin", "supervisor")
  excel(
    @Param("userId") userId: string,
    @Query("month") month: string,
    @Query("year") year: string,
    @Res() res: Response,
  ) {
    return this.exportService.exportExcel(+userId, month, year, res);
  }

  @Get("pdf/:userId")
  @Roles("admin", "supervisor")
  pdf(
    @Param("userId") userId: string,
    @Query("month") month: string,
    @Query("year") year: string,
    @Res() res: Response,
  ) {
    return this.exportService.exportPdf(+userId, month, year, res);
  }
}
