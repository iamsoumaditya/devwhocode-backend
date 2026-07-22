import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';


export interface JwtPayload {
  sub: string;
  role: 'student' | 'lab_assistant';
  type: 'access' | 'refresh';
}

export interface RequestUser {
  id: string;
  role: 'student' | 'lab_assistant';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: (req: Request) => {
        const token: unknown =
          req.cookies?.access_token || ExtractJwt.fromAuthHeaderAsBearerToken();
        return typeof token === 'string' ? token : null;
      },
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET_KEY'),
    });
  }

  validate(payload: JwtPayload): RequestUser {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    return { id: payload.sub, role: payload.role };
  }
}
