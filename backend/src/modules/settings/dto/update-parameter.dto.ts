import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateParameterDto {
  @ApiProperty({ example: '19.00', description: 'Nuevo valor del parámetro' })
  @IsString()
  @IsNotEmpty({ message: 'El valor es obligatorio' })
  @MaxLength(255)
  valor: string;
}
