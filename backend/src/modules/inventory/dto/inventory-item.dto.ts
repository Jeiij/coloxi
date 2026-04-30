import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInventoryItemDto {
  @ApiProperty({ description: 'ID autoincremental del producto del maestro a integrar al inventario' })
  @IsNumber()
  @Type(() => Number)
  producto_id: number;

  @ApiPropertyOptional({ example: 0, description: 'Stock actual inicial' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock_actual?: number = 0;

  @ApiPropertyOptional({ example: 10, description: 'Stock mínimo de alerta' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock_minimo?: number = 0;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock_actual?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock_minimo?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  activo?: boolean;
}
