import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryOrdersDto {
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

  @ApiPropertyOptional({ enum: ['BORRADOR', 'ENVIADA', 'FINALIZADA', 'RECHAZADA'] })
  @IsOptional()
  @IsString()
  @IsIn(['BORRADOR', 'ENVIADA', 'FINALIZADA', 'RECHAZADA'])
  estado?: string;

  @ApiPropertyOptional({ enum: ['COLOMBIA', 'VENEZUELA'] })
  @IsOptional()
  @IsString()
  @IsIn(['COLOMBIA', 'VENEZUELA'])
  mercado?: string;

  @ApiPropertyOptional({ description: 'Buscar por código de orden' })
  @IsOptional()
  @IsString()
  search?: string;
}
