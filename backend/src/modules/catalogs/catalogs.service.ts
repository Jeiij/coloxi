import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CatalogsService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.category.delete({ where: { id } });
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
    return this.prisma.line.delete({ where: { id } });
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
    return this.prisma.brand.delete({ where: { id } });
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
    return this.prisma.color.delete({ where: { id } });
  }
}
