import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, ParseIntPipe, Request, UseInterceptors, UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryGlobalHistoryDto } from './dto/query-global-history.dto';
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
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get('auditoria/historial-global')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Obtener historial global de precios con filtros' })
  getGlobalPriceHistory(@Query() query: QueryGlobalHistoryDto) {
    return this.productsService.getGlobalPriceHistory(query);
  }

  @Get(':id/historial-precios')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Obtener historial de cambios de precio de un producto' })
  @ApiParam({ name: 'id', description: 'ID numérico del producto' })
  getPriceHistory(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getPriceHistory(id);
  }

  @Get(':id')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Obtener detalle completo de un producto' })
  @ApiParam({ name: 'id', description: 'ID numérico del producto' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Crear un nuevo producto (ADMIN/GERENTE)' })
  create(@Body() dto: CreateProductDto, @Request() req: any) {
    return this.productsService.create(dto, req.user.userId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiParam({ name: 'id', description: 'ID numérico del producto' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto, @Request() req: any) {
    return this.productsService.update(id, dto, req.user.userId);
  }

  @Patch(':id/estado')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Activar/Desactivar producto (ADMIN/GERENTE)' })
  @ApiParam({ name: 'id', description: 'ID numérico del producto' })
  toggleActive(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.productsService.toggleActive(id, req.user.userId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Desactivar producto (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID numérico del producto' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.productsService.remove(id, req.user.userId);
  }

  // ─── Gestión de Imagen ────────────────────────────────────────────────────

  @Post(':id/imagen')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Subir imagen principal del producto' })
  @ApiParam({ name: 'id', description: 'ID numérico del producto' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { imagen: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('imagen'))
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo de imagen.');
    return this.productsService.uploadImage(id, file);
  }

  @Delete(':id/imagen/:imagenId')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Eliminar imagen de un producto' })
  @ApiParam({ name: 'id', description: 'ID numérico del producto' })
  @ApiParam({ name: 'imagenId', description: 'UUID de la imagen a eliminar' })
  deleteImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imagenId') imagenId: string,
  ) {
    return this.productsService.deleteImage(id, imagenId);
  }
}
