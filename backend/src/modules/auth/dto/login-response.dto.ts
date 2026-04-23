import { ApiProperty } from '@nestjs/swagger';

class LoginUserResponseDto {
  @ApiProperty({ example: 'f4b8908b-c792-417e-9a9b-131eff8ddbc0' })
  id: string;

  @ApiProperty({ example: 'admin@coloxi.com' })
  email: string;

  @ApiProperty({ example: 'Administrador COLOXI' })
  nombre: string;

  @ApiProperty({ example: 'Admin' })
  rol: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...' })
  access_token: string;

  @ApiProperty({ type: LoginUserResponseDto })
  user: LoginUserResponseDto;
}
