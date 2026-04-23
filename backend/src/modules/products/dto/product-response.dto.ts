import { ApiProperty } from '@nestjs/swagger';

class CatalogItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Nombre' })
  nombre: string;
}

class ProductImageDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: '/uploads/products/placeholder.jpg' })
  url_imagen: string;

  @ApiProperty({ example: true })
  es_principal: boolean;

  @ApiProperty({ example: 1 })
  orden_visual: number;
}

class ColorDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Blanco' })
  nombre: string;

  @ApiProperty({ example: '#FFFFFF' })
  codigo_hex: string;
}

class AuditUserDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Admin COLOXI' })
  nombre_completo: string;
}

export class ProductListItemDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'SUPER5-GAL-BL' })
  codigo: string;

  @ApiProperty({ example: 'Pintura Super5 Galón Blanco' })
  nombre: string;

  @ApiProperty({ example: 'Super5 1G Blanco', nullable: true })
  nombre_corto: string;

  @ApiProperty({ example: 'Galón' })
  presentacion: string;

  @ApiProperty({ example: '1.00' })
  capacidad_gal: string;

  @ApiProperty({ example: '45000.0000' })
  pvp_colombia: string;


  @ApiProperty({ type: CatalogItemDto })
  categoria: CatalogItemDto;

  @ApiProperty({ type: CatalogItemDto })
  linea: CatalogItemDto;

  @ApiProperty({ type: CatalogItemDto })
  marca: CatalogItemDto;

  @ApiProperty({ example: '/uploads/products/placeholder.jpg', nullable: true })
  imagen_principal: string;
}

export class ProductDetailDto extends ProductListItemDto {
  @ApiProperty({ example: '4.50' })
  equivalencia_kg: string;

  @ApiProperty({ example: '25000.0000' })
  costo_unitario_sin_iva: string;

  @ApiProperty({ example: '1.4000' })
  factor_venezuela: string;

  @ApiProperty({ example: 'Notas sobre el producto', nullable: true })
  observaciones: string;

  @ApiProperty({ type: [ColorDto] })
  colores: ColorDto[];

  @ApiProperty({ type: [ProductImageDto] })
  imagenes: ProductImageDto[];

  @ApiProperty({ type: AuditUserDto })
  creator: AuditUserDto;

  @ApiProperty({ type: AuditUserDto, nullable: true })
  updater: AuditUserDto;

  @ApiProperty({ example: '2026-04-20T14:15:17.694Z' })
  created_at: string;

  @ApiProperty({ example: '2026-04-20T14:15:17.694Z' })
  updated_at: string;
}
