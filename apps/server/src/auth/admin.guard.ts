import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const token = req.headers['x-admin-token'];
    const expected = process.env.ADMIN_TOKEN;
    if (!expected || token !== expected) throw new UnauthorizedException();
    return true;
  }
}
