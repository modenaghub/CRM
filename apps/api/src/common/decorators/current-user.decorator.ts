import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  sub: string; // userId
  orgId: string;
  branchId?: string | null;
  roleKey: string;
  isOwner: boolean;
  permissions: string[]; // ["customers:view", "customers:create", ...]
  name: string;
  email: string;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

// Atalho para pegar só o organizationId (contexto multi-tenant da requisição)
export const CurrentOrg = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.orgId;
});
