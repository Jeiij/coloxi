import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from './dto/inventory-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorator';

@ApiTags('Inventario Interno')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventario')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Listar inventario interno paginado' })
  findAll(@Query() query: QueryInventoryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('stats')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Obtener KPIs del inventario interno' })
  getStats() {
    return this.inventoryService.getStats();
  }

  @Post()
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Agregar un producto del maestro al inventario interno' })
  create(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Actualizar stock de un ítem del inventario' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.update(id, dto);
  }

  @Patch(':id/estado')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Inhabilitar/Rehabilitar un ítem del inventario (soft delete)' })
  toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.toggleActive(id);
  }
}
