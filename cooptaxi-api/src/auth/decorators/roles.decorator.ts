// decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRol } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRol[]) => SetMetadata(ROLES_KEY, roles);
