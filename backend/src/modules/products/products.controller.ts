import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, ParseUUIDPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductListItemDto, ProductDetailDto } from './dto/product-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorator';

@ApiTags('Maestro de Productos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('productos')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Listar productos paginados con filtros' })
  @ApiResponse({ status: 200, description: 'Listado de productos', type: [ProductListItemDto] })
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Obtener detalle completo de un producto' })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiResponse({ status: 200, description: 'Detalle del producto', type: ProductDetailDto })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Crear un nuevo producto (ADMIN/GERENTE)' })
  create(@Body() dto: CreateProductDto, @Request() req: any) {
    return this.productsService.create(dto, req.user.userId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto, @Request() req: any) {
    return this.productsService.update(id, dto, req.user.userId);
  }

  @Patch(':id/estado')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Activar/Desactivar producto (ADMIN/GERENTE)' })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  toggleActive(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.productsService.toggleActive(id, req.user.userId);
  }
}
