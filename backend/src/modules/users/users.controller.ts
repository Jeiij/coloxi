import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios paginados (ADMIN)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.usersService.findAll(page, limit);
  }

  @Get('roles')
  @ApiOperation({ summary: 'Listar roles disponibles (ADMIN)' })
  findAllRoles() {
    return this.usersService.findAllRoles();
  }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo usuario (ADMIN)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario (ADMIN)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
