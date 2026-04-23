import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';

export class QueryProductsDto {
  @ApiPropertyOptional({ example: 1, description: 'Número de página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Registros por página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'SUPER5', description: 'Buscar por código o nombre' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, description: 'Filtrar por categoría ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoria_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filtrar por línea ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  linea_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filtrar por marca ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  marca_id?: number;

  @ApiPropertyOptional({ example: true, description: 'Filtrar por activo/inactivo. Si no se envía muestra solo activos.' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  activo?: boolean = true;


  @ApiPropertyOptional({ enum: ['nombre', 'codigo', 'created_at'], default: 'nombre' })
  @IsOptional()
  @IsIn(['nombre', 'codigo', 'created_at'])
  orderBy?: string = 'nombre';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  orderDir?: string = 'asc';
}
