import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'COLOMBIA', enum: ['COLOMBIA', 'VENEZUELA'] })
  @IsString()
  @IsIn(['COLOMBIA', 'VENEZUELA'])
  mercado: string;

  @ApiPropertyOptional({ example: 'Orden para restock de pinturas' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
