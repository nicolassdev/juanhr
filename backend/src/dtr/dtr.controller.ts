import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { DtrService } from "./dtr.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

const selfieStorage = diskStorage({
  destination: (req, file, cb) =>
    cb(null, join(process.cwd(), "uploads", "selfies")),
  filename: (req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.random().toString(36).slice(2)}${extname(file.originalname)}`,
    ),
});
const selfieFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png)$/))
    return cb(new Error("Images only"), false);
  cb(null, true);
};

@Controller("dtr")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DtrController {
  constructor(private dtrService: DtrService) {}

  @Post("clock-in")
  @Roles("ojt")
  @UseInterceptors(
    FileInterceptor("selfie", {
      storage: selfieStorage,
      fileFilter: selfieFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  clockIn(
    @CurrentUser("id") userId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body("notes") notes: string,
  ) {
    return this.dtrService.clockIn(userId, file, notes);
  }

  @Post("clock-out")
  @Roles("ojt")
  @UseInterceptors(
    FileInterceptor("selfie", {
      storage: selfieStorage,
      fileFilter: selfieFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  clockOut(
    @CurrentUser("id") userId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body("notes") notes: string,
  ) {
    return this.dtrService.clockOut(userId, file, notes);
  }

  @Get("me/schedule")
  @Roles("ojt", "supervisor", "admin")
  getMySchedule(@CurrentUser("id") userId: number) {
    return this.dtrService.getMySchedule(userId);
  }

  @Get("me")
  @Roles("ojt", "supervisor", "admin")
  getMyDtr(
    @CurrentUser("id") userId: number,
    @Query("month") month: string,
    @Query("year") year: string,
  ) {
    return this.dtrService.getMyDtr(userId, month, year);
  }

  @Get("me/summary")
  @Roles("ojt", "supervisor", "admin")
  getSummary(@CurrentUser("id") userId: number) {
    return this.dtrService.getSummary(userId);
  }

  @Get()
  @Roles("admin", "supervisor")
  getAll(@Query() query: any) {
    return this.dtrService.getAllDtr(query);
  }

  @Get("ojt/:id")
  @Roles("admin", "supervisor")
  getOjtDtr(
    @Param("id", ParseIntPipe) ojtId: number,
    @CurrentUser("id") requesterId: number,
    @CurrentUser("role") requesterRole: string,
    @Query() query: any,
  ) {
    return this.dtrService.getOjtDtr(ojtId, requesterId, requesterRole, query);
  }

  @Get("ojt/:id/summary")
  @Roles("admin", "supervisor")
  getOjtSummary(@Param("id", ParseIntPipe) ojtId: number) {
    return this.dtrService.getSummary(ojtId);
  }
}
