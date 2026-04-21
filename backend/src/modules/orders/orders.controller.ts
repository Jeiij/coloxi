import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interfaces';

@ApiTags('Órdenes de Compra')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ordenes')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Crear una nueva orden de compra en BORRADOR' })
  @ApiResponse({ status: 201, description: 'Orden creada exitosamente' })
  create(@Body() dto: CreateOrderDto, @Request() req: { user: AuthenticatedUser }) {
    return this.ordersService.create(dto, req.user.userId);
  }

  @Get()
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Listar órdenes paginadas con filtros' })
  @ApiResponse({ status: 200, description: 'Listado de órdenes' })
  findAll(@Query() query: QueryOrdersDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Detalle de orden con ítems (oculta ganancias si JEFE_COMPRA)' })
  @ApiParam({ name: 'id', description: 'UUID de la orden' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: AuthenticatedUser }) {
    return this.ordersService.findOne(id, req.user.role);
  }

  @Post(':id/items')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Agregar ítem a una orden (snapshot del producto)' })
  @ApiParam({ name: 'id', description: 'UUID de la orden' })
  @ApiResponse({ status: 400, description: 'La orden no está en BORRADOR' })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddOrderItemDto,
  ) {
    return this.ordersService.addItem(id, dto);
  }

  @Delete(':id/items/:itemId')
  @Roles('ADMIN', 'GERENTE', 'JEFE_COMPRA')
  @ApiOperation({ summary: 'Eliminar ítem de una orden (solo en BORRADOR)' })
  @ApiParam({ name: 'id', description: 'UUID de la orden' })
  @ApiParam({ name: 'itemId', description: 'UUID del ítem' })
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.ordersService.removeItem(id, itemId);
  }

  @Patch(':id/estado')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Aprobar/finalizar orden (solo ADMIN y GERENTE)' })
  @ApiParam({ name: 'id', description: 'UUID de la orden' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN y GERENTE pueden cambiar estado' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.ordersService.updateStatus(id, dto, req.user.userId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Eliminar una orden completa (solo BORRADOR, solo ADMIN/GERENTE)' })
  @ApiParam({ name: 'id', description: 'UUID de la orden a eliminar' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.remove(id);
  }
}
