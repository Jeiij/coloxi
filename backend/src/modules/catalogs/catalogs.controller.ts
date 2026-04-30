import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogsService } from './catalogs.service';
import { CreateCatalogItemDto, CreateColorDto } from './dto/catalog.dto';
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
  findAllCategories(@Query('activo') activo?: string) { 
    return this.catalogsService.findAllCategories(activo); 
  }

  @Post('categorias')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Crear categoría (ADMIN/GERENTE)' })
  createCategory(@Body() dto: CreateCatalogItemDto) { return this.catalogsService.createCategory(dto.nombre); }

  @Patch('categorias/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Editar categoría (ADMIN/GERENTE)' })
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateCatalogItemDto) { return this.catalogsService.updateCategory(id, dto.nombre); }

  @Delete('categorias/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Desactivar categoría (soft delete)' })
  deleteCategory(@Param('id', ParseIntPipe) id: number) { return this.catalogsService.deleteCategory(id); }

  // ===== LÍNEAS =====
  @Get('lineas')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Listar líneas' })
  findAllLines(@Query('activo') activo?: string) { 
    return this.catalogsService.findAllLines(activo); 
  }

  @Post('lineas')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Crear línea (ADMIN/GERENTE)' })
  createLine(@Body() dto: CreateCatalogItemDto) { return this.catalogsService.createLine(dto.nombre); }

  @Patch('lineas/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Editar línea (ADMIN/GERENTE)' })
  updateLine(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateCatalogItemDto) { return this.catalogsService.updateLine(id, dto.nombre); }

  @Delete('lineas/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Desactivar línea (soft delete)' })
  deleteLine(@Param('id', ParseIntPipe) id: number) { return this.catalogsService.deleteLine(id); }

  // ===== MARCAS =====
  @Get('marcas')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Listar marcas' })
  findAllBrands(@Query('activo') activo?: string) { 
    return this.catalogsService.findAllBrands(activo); 
  }

  @Post('marcas')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Crear marca (ADMIN/GERENTE)' })
  createBrand(@Body() dto: CreateCatalogItemDto) { return this.catalogsService.createBrand(dto.nombre); }

  @Patch('marcas/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Editar marca (ADMIN/GERENTE)' })
  updateBrand(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateCatalogItemDto) { return this.catalogsService.updateBrand(id, dto.nombre); }

  @Delete('marcas/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Desactivar marca (soft delete)' })
  deleteBrand(@Param('id', ParseIntPipe) id: number) { return this.catalogsService.deleteBrand(id); }

  // ===== COLORES =====
  @Get('colores')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Listar colores' })
  findAllColors() { 
    return this.catalogsService.findAllColors(); 
  }

  @Post('colores')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Crear color (ADMIN/GERENTE)' })
  createColor(@Body() dto: CreateColorDto) { return this.catalogsService.createColor(dto.nombre, dto.codigo_hex ?? '#FFFFFF'); }

  @Patch('colores/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Editar color (ADMIN/GERENTE)' })
  updateColor(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateColorDto) { return this.catalogsService.updateColor(id, dto.nombre, dto.codigo_hex ?? '#FFFFFF'); }

  @Delete('colores/:id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Desactivar color (soft delete)' })
  deleteColor(@Param('id', ParseIntPipe) id: number) { return this.catalogsService.deleteColor(id); }
}
