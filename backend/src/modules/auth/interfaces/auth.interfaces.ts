/**
 * Payload que se firma dentro del JWT al hacer login.
 */
export interface JwtPayload {
  sub: string;       // userId (UUID)
  email: string;
  role: string;      // nombre del rol
  iat?: number;      // issued at (inyectado por jsonwebtoken)
  exp?: number;      // expiration (inyectado por jsonwebtoken)
}

/**
 * Objeto que Passport inyecta en `req.user` tras validar el JWT.
 * Usado por el decorador @CurrentUser().
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}
