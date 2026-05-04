import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequestUser } from '../strategies/jwt.strategy';

@Injectable()
export class StudentGuard extends AuthGuard('jwt') implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser;

    if (!user) {
      throw new UnauthorizedException('Access token is missing or invalid');
    }

    if (user.role !== 'student') {
      throw new ForbiddenException('Access restricted to students only');
    }

    return true;
  }

  handleRequest<TUser>(err: Error, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException(
        err?.message ?? 'Access token is missing or invalid',
      );
    }
    return user;
  }
}
