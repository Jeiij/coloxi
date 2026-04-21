import { Injectable, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.activo && (await bcrypt.compare(pass, user.password_hash))) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role?.nombre };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre_completo,
        rol: user.role?.nombre,
      },
    };
  }

  async seedDatabase(): Promise<{ message: string; details: any }> {
    // 1. Roles Homologados
    const rolesDefaults = [
      { nombre: 'ADMIN', descripcion: 'Acceso total al sistema' },
      { nombre: 'GERENTE', descripcion: 'Gestión completa, ve márgenes y ganancias' },
      { nombre: 'JEFE_COMPRA', descripcion: 'Gestión de órdenes de compra. Sin acceso a márgenes de ganancia.' },
    ];

    for (const rol of rolesDefaults) {
      await this.prisma.role.upsert({
        where: { nombre: rol.nombre },
        update: { descripcion: rol.descripcion },
        create: rol,
      });
    }

    const adminRole = await this.prisma.role.findUnique({ where: { nombre: 'ADMIN' } });
    const gerenteRole = await this.prisma.role.findUnique({ where: { nombre: 'GERENTE' } });
    const comprasRole = await this.prisma.role.findUnique({ where: { nombre: 'JEFE_COMPRA' } });

    // 2. Parámetros del Sistema
    const paramsDefaults = [
      { clave: 'IVA_PORCENTAJE', valor: '19.00', descripcion: 'Porcentaje de IVA aplicado en Colombia' },
      { clave: 'FACTOR_VENEZUELA', valor: '1.40', descripcion: 'Factor dinámico para calcular PVP Venezuela' },
    ];

    for (const param of paramsDefaults) {
      await this.prisma.systemParameter.upsert({
        where: { clave: param.clave },
        update: { valor: param.valor },
        create: param,
      });
    }

    // 3. Usuarios de Prueba
    const users = [
      { email: 'admin@coloxi.com', pass: 'Admin123!', nombre: 'Admin COLOXI', rolId: adminRole!.id },
      { email: 'gerente@coloxi.com', pass: 'Gerente123!', nombre: 'Gerente COLOXI', rolId: gerenteRole!.id },
      { email: 'compras@coloxi.com', pass: 'Compras123!', nombre: 'Jefe Compras COLOXI', rolId: comprasRole!.id },
    ];

    for (const u of users) {
      const exists = await this.usersService.findByEmail(u.email);
      if (!exists) {
        await this.usersService.create({
          rol_id: u.rolId,
          email: u.email,
          password: u.pass,
          nombre_completo: u.nombre,
        });
      }
    }

    // 4. Catálogos Paramétricos
    const catData = {
      categorias: ['Pinturas', 'Esmaltes', 'Barnices'],
      lineas: ['Arquitectónica', 'Industrial', 'Decorativa'],
      marcas: ['Pintuco', 'Sherwin-Williams', 'Internacional'],
    };

    // Mapeo manual para evitar errores de tipado con 'as any'
    for (const cat of catData.categorias) {
      await this.prisma.category.upsert({ where: { nombre: cat }, update: {}, create: { nombre: cat } });
    }
    for (const lin of catData.lineas) {
      await this.prisma.line.upsert({ where: { nombre: lin }, update: {}, create: { nombre: lin } });
    }
    for (const mar of catData.marcas) {
      await this.prisma.brand.upsert({ where: { nombre: mar }, update: {}, create: { nombre: mar } });
    }

    // Colores
    const colores = [
      { nombre: 'Blanco', codigo_hex: '#FFFFFF' },
      { nombre: 'Negro', codigo_hex: '#000000' },
      { nombre: 'Gris', codigo_hex: '#808080' },
      { nombre: 'Beige', codigo_hex: '#F5F5DC' },
      { nombre: 'Azul', codigo_hex: '#0000FF' },
    ];
    for (const c of colores) {
      await this.prisma.color.upsert({
        where: { nombre: c.nombre },
        update: { codigo_hex: c.codigo_hex },
        create: c,
      });
    }

    // 5. Producto de Ejemplo
    const catPinturas = await this.prisma.category.findUnique({ where: { nombre: 'Pinturas' } });
    const linArq = await this.prisma.line.findUnique({ where: { nombre: 'Arquitectónica' } });
    const marPintuco = await this.prisma.brand.findUnique({ where: { nombre: 'Pintuco' } });
    const colorBlanco = await this.prisma.color.findUnique({ where: { nombre: 'Blanco' } });

    const prodCode = 'SUPER5-GAL-BL';
    const existingProd = await this.prisma.product.findUnique({ where: { codigo: prodCode } });

    if (!existingProd) {
      const adminUser = await this.usersService.findByEmail('admin@coloxi.com');
      const product = await this.prisma.product.create({
        data: {
          codigo: prodCode,
          nombre: 'Pintura Super5 Galón Blanco',
          nombre_corto: 'Super5 1G Blanco',
          categoria_id: catPinturas!.id,
          linea_id: linArq!.id,
          marca_id: marPintuco!.id,
          presentacion: 'Galón',
          capacidad_gal: 1.00,
          equivalencia_kg: 4.50,
          costo_unitario_sin_iva: 25000.0000,
          pvp_colombia: 45000.0000,
          factor_venezuela: 1.4000,
          created_by: adminUser!.id,
          colores: {
            create: { color_id: colorBlanco!.id }
          }
        },
      });

      await this.prisma.productImage.create({
        data: {
          producto_id: product.id,
          url_imagen: '/uploads/products/placeholder.jpg',
          es_principal: true,
          orden_visual: 1
        }
      });
    }

    return {
      message: 'Seed COLOXI Fase 1.3 ejecutado correctamente',
      details: 'Roles (ADMIN, GERENTE, JEFE_COMPRA), Usuarios, Catálogos, Parámetros y Producto listos.',
    };
  }
}

