// Tipos compartidos del frontend COLOXI

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface CatalogItem {
  id: number;
  nombre: string;
}

export interface Color {
  id: number;
  nombre: string;
  codigo_hex: string;
}

export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  presentacion: string;
  capacidad_gal: string;
  equivalencia_kg: string;
  costo_unitario_sin_iva: string;
  pvp_colombia: string;
  pvp_venezuela: string;
  factor_venezuela: string;
  activo: boolean;
  observaciones: string | null;
  categoria: CatalogItem | null;
  linea: CatalogItem | null;
  marca: CatalogItem | null;
  imagen_principal: string | null;
  colores?: Color[];
  imagenes?: { url_imagen: string }[];
}

export interface InventoryItem {
  id: string;
  producto_id: string;
  stock_actual: string;
  stock_minimo: string;
  created_at: string;
  updated_at: string;
  producto: Product;
}

export interface InventoryStats {
  total_items: number;
  stock_bajo: number;
  agotados: number;
  ok: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Order {
  id: string;
  codigo: string;
  fecha: string;
  estado: string;
  mercado: string;
  observaciones: string | null;
  iva_porcentaje: string;
  factor_venezuela: string;
  created_by: string;
  created_at: string;
  creator: { id: string; nombre_completo: string } | null;
  _count?: { detalles: number };
  detalles?: OrderDetail[];
}

export interface OrderDetail {
  id: string;
  producto_codigo: string;
  producto_nombre: string;
  presentacion: string;
  color_nombre: string;
  cantidad: string;
  total_galones: string;
  total_kgs: string;
  costo_unitario_sin_iva: string;
  costo_total_sin_iva: string;
  costo_unitario_con_iva: string;
  costo_total_con_iva: string;
  pvp_colombia_unitario: string;
  pvp_colombia_total: string;
  ganancia_colombia_unitaria?: string;
  ganancia_colombia_total?: string;
  ganancia_colombia_neta_unitaria?: string;
  ganancia_colombia_neta_total?: string;
  margen_colombia_porcentaje?: string;
  costo_ajustado_venezuela?: string;
  pvp_venezuela_unitario: string;
  pvp_venezuela_total: string;
  ganancia_venezuela_unitaria?: string;
  ganancia_venezuela_total?: string;
  foto_url: string | null;
}

