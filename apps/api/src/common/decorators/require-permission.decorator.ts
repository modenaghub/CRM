import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'requiredPermission';

// Uso: @RequirePermission('customers', 'edit')
// Seção 21/58 do prompt-mestre: permissões granulares por módulo + ação.
export const RequirePermission = (module: string, action: string) =>
  SetMetadata(PERMISSION_KEY, `${module}:${action}`);
