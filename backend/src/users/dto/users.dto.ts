import { IsEmail, IsEnum, IsOptional, IsString, MinLength, IsInt, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsString() fullName: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsEnum(['male','female','other']) gender: string;
  @IsOptional() @IsInt() roleId?: number;
  @IsOptional() @IsInt() departmentId?: number;
  @IsOptional() @IsString() school?: string;
  @IsOptional() @IsString() course?: string;
}

export class UpdateUserDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsInt() roleId?: number;
  @IsOptional() @IsInt() departmentId?: number;
  @IsOptional() @IsString() school?: string;
  @IsOptional() @IsString() course?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateOjtProfileDto {
  @IsOptional() @IsString() school?: string;
  @IsOptional() @IsString() course?: string;
}
