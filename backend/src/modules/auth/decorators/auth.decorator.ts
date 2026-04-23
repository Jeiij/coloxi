import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

// Decorador para definir roles requeridos en un endpoint
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Decorador para obtener el usuario actual desde la petición (req.user)
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
