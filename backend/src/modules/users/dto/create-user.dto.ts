import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ example: 'nuevo@coloxi.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MinLength(2)
  nombre_completo: string;

  @ApiProperty({ example: 1, description: 'ID del rol (1=ADMIN, 2=GERENTE, 3=JEFE_COMPRA)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rol_id: number;
}
