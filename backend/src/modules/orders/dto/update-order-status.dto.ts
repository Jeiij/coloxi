import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la orden',
    enum: ['ENVIADA', 'FINALIZADA'],
    example: 'ENVIADA',
  })
  @IsString()
  @IsIn(['ENVIADA', 'FINALIZADA'])
  estado: string;
}
