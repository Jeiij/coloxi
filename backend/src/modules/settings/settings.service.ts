import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.systemParameter.findMany({ orderBy: { clave: 'asc' } });
  }

  async update(clave: string, valor: string) {
    const param = await this.prisma.systemParameter.findUnique({ where: { clave } });
    if (!param) throw new NotFoundException(`Parámetro '${clave}' no encontrado`);
    return this.prisma.systemParameter.update({ where: { clave }, data: { valor } });
  }
}
