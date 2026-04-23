import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'AMBOS', enum: ['COLOMBIA', 'VENEZUELA', 'AMBOS'] })
  @IsString()
  @IsIn(['COLOMBIA', 'VENEZUELA', 'AMBOS'])
  mercado: string;

  @ApiPropertyOptional({ example: 'Orden para restock de pinturas' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
