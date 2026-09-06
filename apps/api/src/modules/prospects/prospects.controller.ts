import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ProspectsService } from './prospects.service';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';

@Controller('prospects')
export class ProspectsController {
  constructor(private readonly prospectsService: ProspectsService) {}

  @Get()
  @RequirePermission('prospects', 'view')
  list(@CurrentOrg() orgId: string, @Query() query: PaginationQueryDto) {
    return this.prospectsService.list(orgId, query);
  }

  @Get(':id')
  @RequirePermission('prospects', 'view')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.prospectsService.findOne(orgId, id);
  }

  @Post()
  @RequirePermission('prospects', 'create')
  create(@CurrentOrg() orgId: string, @Body() dto: CreateProspectDto) {
    return this.prospectsService.create(orgId, dto);
  }

  @Patch(':id')
  @RequirePermission('prospects', 'edit')
  update(@CurrentOrg() orgId: string, @Param('id') id: string, @Body() dto: UpdateProspectDto) {
    return this.prospectsService.update(orgId, id, dto);
  }

  @Post(':id/convert-to-customer')
  @RequirePermission('prospects', 'edit')
  convert(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.prospectsService.convertToCustomer(orgId, id);
  }

  @Delete(':id')
  @RequirePermission('prospects', 'delete')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.prospectsService.remove(orgId, id);
  }
}
