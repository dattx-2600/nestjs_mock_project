import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import Redis from 'ioredis';


@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly i18n: I18nService,
    @Inject('REDIS_CLIENT')
    private redisClient: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token)
      throw new UnauthorizedException(this.i18n.t('auth.unauthorized'));

    // Kiểm tra xem token có nằm trong Blacklist của Redis không
    const isBlacklisted = await this.redisClient.get(`BL_${token}`);

    if (isBlacklisted) {
      throw new UnauthorizedException(
        this.i18n.t('auth.refresh_token_revoked'),
      );
    }

    try {
      // Xác thực giải mã chuỗi Token JWT
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      request['user'] = payload; // Gắn thông tin người dùng vào request
    } catch {
      throw new UnauthorizedException(
        this.i18n.t('auth.token_expired_or_invalid'),
      );
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}