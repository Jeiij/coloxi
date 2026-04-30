import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateCatalogItemDto {
  @ApiProperty({ example: 'Pinturas', description: 'Nombre del ítem del catálogo' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100)
  nombre: string;
}

export class CreateColorDto {
  @ApiProperty({ example: 'Blanco Titanio', description: 'Nombre del color' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(60)
  nombre: string;

  @ApiPropertyOptional({ example: '#FFFFFF', description: 'Código hexadecimal del color' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  codigo_hex?: string;
}
