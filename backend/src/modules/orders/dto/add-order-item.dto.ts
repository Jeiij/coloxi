import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class AddOrderItemDto {
  @ApiProperty({ description: 'ID numérico del producto a agregar', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  producto_id: number;

  @ApiProperty({ description: 'ID del color seleccionado', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  color_id?: number;

  @ApiProperty({ description: 'Cantidad de unidades', example: 10, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiProperty({ description: 'PVP Venezuela (Manual)', example: 14.90, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pvp_venezuela?: number;
}
