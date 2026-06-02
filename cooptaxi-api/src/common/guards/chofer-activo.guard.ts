import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class ChoferActivoGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    if (!user) return false;

    const mora = await this.usersService.tieneMora(user.id);
    if (mora) {
      throw new ForbiddenException(
        'No puedes operar mientras tengas cuotas pendientes. Regulariza tu situación con la cooperativa.',
      );
    }

    return true;
  }
}
