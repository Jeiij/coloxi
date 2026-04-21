import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogsService } from './catalogs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorator';

@ApiTags('Catálogos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('catalogos')
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  // ===== CATEGORÍAS =====
  @Get('categorias')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Listar categorías' })
  findAllCategories() { return this.catalogsService.findAllCategories(); }

  @Post('categorias')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Crear categoría (ADMIN/GERENTE)' })
  createCategory(@Body('nombre') nombre: string) { return this.catalogsService.createCategory(nombre); }

  @Patch('categorias/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Editar categoría (ADMIN/GERENTE)' })
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body('nombre') nombre: string) { return this.catalogsService.updateCategory(id, nombre); }

  @Delete('categorias/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Eliminar categoría (ADMIN/GERENTE)' })
  deleteCategory(@Param('id', ParseIntPipe) id: number) { return this.catalogsService.deleteCategory(id); }

  // ===== LÍNEAS =====
  @Get('lineas')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Listar líneas' })
  findAllLines() { return this.catalogsService.findAllLines(); }

  @Post('lineas')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Crear línea (ADMIN/GERENTE)' })
  createLine(@Body('nombre') nombre: string) { return this.catalogsService.createLine(nombre); }

  @Patch('lineas/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Editar línea (ADMIN/GERENTE)' })
  updateLine(@Param('id', ParseIntPipe) id: number, @Body('nombre') nombre: string) { return this.catalogsService.updateLine(id, nombre); }

  @Delete('lineas/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Eliminar línea (ADMIN/GERENTE)' })
  deleteLine(@Param('id', ParseIntPipe) id: number) { return this.catalogsService.deleteLine(id); }

  // ===== MARCAS =====
  @Get('marcas')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Listar marcas' })
  findAllBrands() { return this.catalogsService.findAllBrands(); }

  @Post('marcas')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Crear marca (ADMIN/GERENTE)' })
  createBrand(@Body('nombre') nombre: string) { return this.catalogsService.createBrand(nombre); }

  @Patch('marcas/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Editar marca (ADMIN/GERENTE)' })
  updateBrand(@Param('id', ParseIntPipe) id: number, @Body('nombre') nombre: string) { return this.catalogsService.updateBrand(id, nombre); }

  @Delete('marcas/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Eliminar marca (ADMIN/GERENTE)' })
  deleteBrand(@Param('id', ParseIntPipe) id: number) { return this.catalogsService.deleteBrand(id); }

  // ===== COLORES =====
  @Get('colores')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Listar colores' })
  findAllColors() { return this.catalogsService.findAllColors(); }

  @Post('colores')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Crear color (ADMIN/GERENTE)' })
  createColor(@Body() body: { nombre: string; codigo_hex: string }) { return this.catalogsService.createColor(body.nombre, body.codigo_hex); }

  @Patch('colores/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Editar color (ADMIN/GERENTE)' })
  updateColor(@Param('id', ParseIntPipe) id: number, @Body() body: { nombre: string; codigo_hex: string }) { return this.catalogsService.updateColor(id, body.nombre, body.codigo_hex); }

  @Delete('colores/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Eliminar color (ADMIN/GERENTE)' })
  deleteColor(@Param('id', ParseIntPipe) id: number) { return this.catalogsService.deleteColor(id); }
}
