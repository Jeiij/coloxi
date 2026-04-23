import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsInt, IsBoolean, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Juan Pérez Actualizado' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre_completo?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rol_id?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
