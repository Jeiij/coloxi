import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';

export class QueryInventoryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Buscar por código o nombre del producto' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar solo los que tienen stock bajo' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  stock_bajo?: boolean;

  @ApiPropertyOptional({ enum: ['stock_actual', 'producto_nombre', 'created_at'], default: 'producto_nombre' })
  @IsOptional()
  @IsIn(['stock_actual', 'producto_nombre', 'created_at'])
  orderBy?: string = 'producto_nombre';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  orderDir?: string = 'asc';
}
