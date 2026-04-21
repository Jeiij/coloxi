import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: { role: { select: { id: true, nombre: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async findAllRoles() {
    return this.prisma.role.findMany({ orderBy: { id: 'asc' } });
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException(`El email ${dto.email} ya está registrado`);

    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash: hashed,
        nombre_completo: dto.nombre_completo,
        rol_id: dto.rol_id,
      },
      include: { role: { select: { id: true, nombre: true } } },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.nombre_completo && { nombre_completo: dto.nombre_completo }),
        ...(dto.rol_id && { rol_id: dto.rol_id }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
      include: { role: { select: { id: true, nombre: true } } },
    });
  }
}
