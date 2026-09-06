import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';

@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Get()
  @RequirePermission('pipelines', 'view')
  list(@CurrentOrg() orgId: string) {
    return this.pipelinesService.list(orgId);
  }

  @Post()
  @RequirePermission('pipelines', 'create')
  create(@CurrentOrg() orgId: string, @Body() dto: CreatePipelineDto) {
    return this.pipelinesService.create(orgId, dto);
  }

  @Delete(':id')
  @RequirePermission('pipelines', 'delete')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.pipelinesService.remove(orgId, id);
  }
}
