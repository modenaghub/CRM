import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PlatformService } from './platform.service';

@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('modules')
  getModules(@CurrentOrg() orgId: string) {
    return this.platformService.getModules(orgId);
  }

  @Patch('modules/:key')
  @RequirePermission('settings', 'edit')
  toggleModule(@CurrentOrg() orgId: string, @Param('key') key: string, @Body('enabled') enabled: boolean) {
    return this.platformService.toggleModule(orgId, key, enabled);
  }

  @Get('feature-flags')
  getFeatureFlags(@CurrentOrg() orgId: string) {
    return this.platformService.getFeatureFlags(orgId);
  }

  @Get('plan')
  getPlan(@CurrentOrg() orgId: string) {
    return this.platformService.getPlan(orgId);
  }
}
