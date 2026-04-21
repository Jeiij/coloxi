import { Controller, Request, Post, UseGuards, Body, Get, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/auth.decorator';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '⚠️ SOLO DESARROLLO: Crear roles y usuario admin por defecto',
    description: 'Requiere JWT de ADMIN. Crea los roles del sistema y el usuario admin@coloxi.com. Es seguro ejecutarlo múltiples veces. Bloqueado en producción.',
  })
  @ApiResponse({ status: 200, description: 'Seed ejecutado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'No disponible en producción o rol insuficiente.' })
  async seed() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Seed no disponible en producción');
    }
    return this.authService.seedDatabase();
  }
}
