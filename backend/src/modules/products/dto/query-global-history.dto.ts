import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryGlobalHistoryDto {
  @ApiPropertyOptional({ description: 'Mes a filtrar (1-12)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @ApiPropertyOptional({ description: 'Año a filtrar', example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio?: number;

  @ApiPropertyOptional({ description: 'ID del producto a filtrar' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  productoId?: number;

  @ApiPropertyOptional({ description: 'UUID del usuario que realizó el cambio' })
  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @ApiPropertyOptional({ description: 'Página para paginación' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Límite por página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
