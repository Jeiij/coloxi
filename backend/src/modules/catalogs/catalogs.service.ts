import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CatalogsService {
  constructor(private prisma: PrismaService) {}

  private handleDeleteError(error: unknown, entity: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      throw new BadRequestException(
        `No se puede eliminar ${entity} porque está siendo referenciado por otros registros del sistema`,
      );
    }
    throw error;
  }

  // ===== CATEGORÍAS =====
  async findAllCategories() {
    return this.prisma.category.findMany({ orderBy: { nombre: 'asc' } });
  }
  async createCategory(nombre: string) {
    return this.prisma.category.create({ data: { nombre } });
  }
  async updateCategory(id: number, nombre: string) {
    return this.prisma.category.update({ where: { id }, data: { nombre } });
  }
  async deleteCategory(id: number) {
    try {
      return await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      this.handleDeleteError(error, 'la categoría');
    }
  }

  // ===== LÍNEAS =====
  async findAllLines() {
    return this.prisma.line.findMany({ orderBy: { nombre: 'asc' } });
  }
  async createLine(nombre: string) {
    return this.prisma.line.create({ data: { nombre } });
  }
  async updateLine(id: number, nombre: string) {
    return this.prisma.line.update({ where: { id }, data: { nombre } });
  }
  async deleteLine(id: number) {
    try {
      return await this.prisma.line.delete({ where: { id } });
    } catch (error) {
      this.handleDeleteError(error, 'la línea');
    }
  }

  // ===== MARCAS =====
  async findAllBrands() {
    return this.prisma.brand.findMany({ orderBy: { nombre: 'asc' } });
  }
  async createBrand(nombre: string) {
    return this.prisma.brand.create({ data: { nombre } });
  }
  async updateBrand(id: number, nombre: string) {
    return this.prisma.brand.update({ where: { id }, data: { nombre } });
  }
  async deleteBrand(id: number) {
    try {
      return await this.prisma.brand.delete({ where: { id } });
    } catch (error) {
      this.handleDeleteError(error, 'la marca');
    }
  }

  // ===== COLORES =====
  async findAllColors() {
    return this.prisma.color.findMany({ orderBy: { nombre: 'asc' } });
  }
  async createColor(nombre: string, codigo_hex: string) {
    return this.prisma.color.create({ data: { nombre, codigo_hex } });
  }
  async updateColor(id: number, nombre: string, codigo_hex: string) {
    return this.prisma.color.update({ where: { id }, data: { nombre, codigo_hex } });
  }
  async deleteColor(id: number) {
    try {
      return await this.prisma.color.delete({ where: { id } });
    } catch (error) {
      this.handleDeleteError(error, 'el color');
    }
  }
}
