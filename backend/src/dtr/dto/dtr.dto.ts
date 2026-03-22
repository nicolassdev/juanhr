import { IsDateString, IsOptional, IsString, IsInt } from 'class-validator';

export class ClockInDto {
  @IsOptional() @IsString() notes?: string;
}

export class ClockOutDto {
  @IsOptional() @IsString() notes?: string;
}

export class DtrFilterDto {
  @IsOptional() @IsInt() userId?: number;
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
}
