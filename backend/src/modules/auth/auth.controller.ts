import { Controller, Request, Post, UseGuards, Body, Get, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna el token.', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  async login(@Request() req, @Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(req.user);
  }

  @Get('seed')
  @ApiOperation({
    summary: '⚠️ SOLO DESARROLLO: Crear roles y usuario admin por defecto',
    description: 'Crea los roles del sistema (Admin, Jefe de Compras, Vendedor) y el usuario admin@coloxi.com con contraseña Admin123!. Es seguro ejecutarlo múltiples veces. Bloqueado en producción.',
  })
  @ApiResponse({ status: 200, description: 'Seed ejecutado exitosamente.' })
  @ApiResponse({ status: 403, description: 'No disponible en producción.' })
  async seed() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Seed no disponible en producción');
    }
    return this.authService.seedDatabase();
  }
}
