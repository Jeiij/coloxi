import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorator';

@ApiTags('Configuración')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('parametros')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar parámetros del sistema (ADMIN)' })
  findAll() {
    return this.settingsService.findAll();
  }

  @Patch(':clave')
  @ApiOperation({ summary: 'Actualizar un parámetro del sistema (ADMIN)' })
  update(@Param('clave') clave: string, @Body('valor') valor: string) {
    return this.settingsService.update(clave, valor);
  }
}
