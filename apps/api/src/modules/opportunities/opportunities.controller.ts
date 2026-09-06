import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentOrg, CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { MoveStageDto } from './dto/move-stage.dto';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  @RequirePermission('opportunities', 'view')
  list(@CurrentOrg() orgId: string, @Query('pipelineId') pipelineId?: string, @Query('status') status?: string) {
    return this.opportunitiesService.list(orgId, pipelineId, status);
  }

  @Get('kanban')
  @RequirePermission('opportunities', 'view')
  kanban(@CurrentOrg() orgId: string, @Query('pipelineId') pipelineId: string) {
    return this.opportunitiesService.kanban(orgId, pipelineId);
  }

  @Post()
  @RequirePermission('opportunities', 'create')
  create(@CurrentOrg() orgId: string, @Body() dto: CreateOpportunityDto) {
    return this.opportunitiesService.create(orgId, dto);
  }

  @Patch(':id')
  @RequirePermission('opportunities', 'edit')
  update(@CurrentOrg() orgId: string, @Param('id') id: string, @Body() dto: UpdateOpportunityDto) {
    return this.opportunitiesService.update(orgId, id, dto);
  }

  @Post(':id/move-stage')
  @RequirePermission('opportunities', 'edit')
  moveStage(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: MoveStageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.opportunitiesService.moveStage(orgId, id, dto, user.sub);
  }

  @Delete(':id')
  @RequirePermission('opportunities', 'delete')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.opportunitiesService.remove(orgId, id);
  }
}
