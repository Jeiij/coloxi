import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsInt, IsOptional, IsArray, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {

  @ApiProperty({ example: 'Pintura Super5 Galón Blanco' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 'Super5 GL Blanco' })
  @IsOptional()
  @IsString()
  nombre_corto?: string;

  @ApiProperty({ example: 'Galón' })
  @IsString()
  presentacion: string;

  @ApiProperty({ example: 1.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  capacidad_gal: number;

  @ApiProperty({ example: 4.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  equivalencia_kg: number;

  @ApiPropertyOptional({ example: 25000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costo_unitario_sin_iva?: number;

  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pvp_colombia?: number;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pvp_venezuela: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoria_id?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  linea_id?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  marca_id?: number;

  @ApiPropertyOptional({ example: [1, 2, 3], description: 'IDs de colores disponibles' })
  @IsOptional()
  @IsArray()
  colores_ids?: number[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}
