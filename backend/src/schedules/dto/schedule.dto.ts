import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsArray,
  Min,
  Max,
} from "class-validator";

export class CreateScheduleDto {
  @IsString() name: string;
  @IsEnum(["one_period", "two_period"]) periodType: string;
  @IsString() amIn: string;
  @IsString() amOut: string;
  @IsOptional() @IsString() pmIn?: string;
  @IsOptional() @IsString() pmOut?: string;
  @IsArray() workDays: string[];
  @IsOptional() @IsInt() @Min(0) @Max(120) graceMinutes?: number;
  @IsOptional() @IsString() lateRule?: string; // "HH:MM" — if set, overrides grace period for late detection
}

export class AssignScheduleDto {
  @IsInt() ojtId: number;
  @IsInt() scheduleId: number;
  @IsOptional() @IsString() effectiveAt?: string;
}
