import { Controller, Get } from '@nestjs/common';
import { CurrentOrg, CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary(@CurrentOrg() orgId: string) {
    return this.dashboardService.summary(orgId);
  }

  @Get('funnel')
  funnel(@CurrentOrg() orgId: string) {
    return this.dashboardService.funnel(orgId);
  }

  @Get('my-agenda')
  myAgenda(@CurrentOrg() orgId: string, @CurrentUser() user: AuthUser) {
    return this.dashboardService.myAgenda(orgId, user.sub);
  }
}
