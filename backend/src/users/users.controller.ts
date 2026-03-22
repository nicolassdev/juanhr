import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { UsersService } from "./users.service";
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateOjtProfileDto,
} from "./dto/users.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

// Absolute path — fixes Windows relative path issues with multer
const avatarStorage = diskStorage({
  destination: (req, file, cb) =>
    cb(null, join(process.cwd(), "uploads", "avatars")),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}${extname(file.originalname)}`),
});

const imageFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
    return cb(new Error("Only JPG, PNG and GIF images are allowed"), false);
  }
  cb(null, true);
};

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles("admin", "supervisor")
  findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  @Get("dashboard")
  @Roles("admin")
  dashboard() {
    return this.usersService.getDashboardStats();
  }

  @Get(":id")
  @Roles("admin", "supervisor")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles("admin")
  create(@Body() dto: CreateUserDto, @CurrentUser("id") adminId: number) {
    return this.usersService.create(dto, adminId);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser("id") requesterId: number,
    @CurrentUser("role") requesterRole: string,
  ) {
    return this.usersService.update(id, dto, requesterId, requesterRole);
  }

  @Patch(":id/profile")
  updateOjtProfile(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateOjtProfileDto,
    @CurrentUser("id") requesterId: number,
  ) {
    return this.usersService.updateOjtProfile(id, dto, requesterId);
  }

  @Delete(":id")
  @Roles("admin")
  remove(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser("id") adminId: number,
  ) {
    return this.usersService.remove(id, adminId);
  }

  @Patch(":id/role")
  @Roles("admin")
  changeRole(
    @Param("id", ParseIntPipe) id: number,
    @Body("roleId", ParseIntPipe) roleId: number,
    @CurrentUser("id") adminId: number,
  ) {
    return this.usersService.changeRole(id, roleId, adminId);
  }

  @Patch(":id/lock")
  @Roles("admin")
  toggleLock(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser("id") adminId: number,
  ) {
    return this.usersService.toggleLock(id, adminId);
  }

  @Post(":id/avatar")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: avatarStorage,
      fileFilter: imageFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadAvatar(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new Error("No file uploaded or invalid file type");
    return this.usersService.updateAvatar(
      id,
      `/uploads/avatars/${file.filename}`,
    );
  }
}
