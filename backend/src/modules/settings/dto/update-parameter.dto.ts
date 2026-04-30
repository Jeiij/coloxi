import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength, IsNumberString } from 'class-validator';

export class UpdateParameterDto {
  @ApiProperty({ example: '19.00', description: 'Nuevo valor del parámetro' })
  @IsNumberString({}, { message: 'El valor debe ser numérico' })
  @IsNotEmpty({ message: 'El valor es obligatorio' })
  @MaxLength(255)
  valor: string;
}
