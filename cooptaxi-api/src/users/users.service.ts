import {
  Injectable, NotFoundException,
  ConflictException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRol, EstadoChofer } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existe = await this.repo.findOne({ where: { email: dto.email } });
    if (existe) throw new ConflictException('El email ya está registrado');

    const hash = await bcrypt.hash(dto.password, 12);
    const user = this.repo.create({
      ...dto,
      password_hash: hash,
      estado_chofer: dto.rol === UserRol.CHOFER
        ? EstadoChofer.INACTIVO
        : undefined,
    });
    return this.repo.save(user);
  }

  async findAll(filters: {
    rol?: UserRol;
    activo?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { rol, activo, page = 1, limit = 20 } = filters;
    const qb = this.repo.createQueryBuilder('u')
      .leftJoinAndSelect('u.vehiculo', 'v');

    if (rol) qb.andWhere('u.rol = :rol', { rol });
    if (activo !== undefined) qb.andWhere('u.activo = :activo', { activo });

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repo.findOne({
      where: { id },
      relations: ['vehiculo', 'documentos', 'cuotas'],
    });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.password) {
      (dto as any).password_hash = await bcrypt.hash(dto.password, 12);
      delete (dto as any).password;
    }

    Object.assign(user, dto);
    return this.repo.save(user);
  }

  async setEstado(id: string, activo: boolean): Promise<User> {
    const user = await this.findOne(id);
    user.activo = activo;
    return this.repo.save(user);
  }

  async setRefreshToken(id: string, token: string | null): Promise<void> {
    const hash = token ? await bcrypt.hash(token, 10) : null;
    `await this.repo.update(id, { refresh_token_hash: hash as any });`
  }

  async setEstadoChofer(id: string, estado: EstadoChofer): Promise<void> {
    await this.repo.update(id, { estado_chofer: estado });
  }

  // Verifica si el chofer tiene cuotas sin pagar (mora)
  async tieneMora(id: string): Promise<boolean> {
    const user = await this.repo.findOne({
      where: { id },
      relations: ['cuotas'],
    });
    if (!user) return false;
    return user.cuotas.some((c) => !c.pagada);
  }

  async actualizarRating(id: string, nuevaCalif: number): Promise<void> {
    const user = await this.findOne(id);
    // Promedio acumulado
    const total = user.total_carreras;
    user.rating_promedio = total === 0
      ? nuevaCalif
      : (user.rating_promedio * total + nuevaCalif) / (total + 1);
    user.total_carreras += 1;
    await this.repo.save(user);
  }
}
