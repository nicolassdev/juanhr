import { IsEmail, IsEnum, IsOptional, IsString, MinLength, IsInt, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsString() fullName: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsEnum(['male','female','other']) gender: string;
  @IsOptional() @IsString() school?: string;
  @IsOptional() @IsString() course?: string;
  @IsOptional() @IsInt() roleId?: number;
  @IsOptional() @IsInt() departmentId?: number;
}

export class UpdateUserDto {
  @IsOptional() @IsString() school?: string;
  @IsOptional() @IsString() course?: string;
  @IsOptional() @IsInt() departmentId?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateRoleDto {
  @IsInt() roleId: number;
}
