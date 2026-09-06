import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentOrg, CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CustomObjectsService } from './custom-objects.service';
import { CreateCustomObjectDto } from './dto/create-custom-object.dto';

@Controller('custom-objects')
export class CustomObjectsController {
  constructor(private readonly service: CustomObjectsService) {}

  @Get()
  @RequirePermission('custom_objects', 'view')
  list(@CurrentOrg() orgId: string) {
    return this.service.list(orgId);
  }

  @Post()
  @RequirePermission('custom_objects', 'create')
  create(@CurrentOrg() orgId: string, @Body() dto: CreateCustomObjectDto) {
    return this.service.create(orgId, dto);
  }

  @Get(':key/records')
  @RequirePermission('custom_objects', 'view')
  listRecords(@CurrentOrg() orgId: string, @Param('key') key: string) {
    return this.service.listRecords(orgId, key);
  }

  @Post(':key/records')
  @RequirePermission('custom_objects', 'create')
  createRecord(
    @CurrentOrg() orgId: string,
    @Param('key') key: string,
    @Body('data') data: Record<string, any>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.createRecord(orgId, key, data, user.sub);
  }

  @Patch(':key/records/:id')
  @RequirePermission('custom_objects', 'edit')
  updateRecord(
    @CurrentOrg() orgId: string,
    @Param('key') key: string,
    @Param('id') id: string,
    @Body('data') data: Record<string, any>,
  ) {
    return this.service.updateRecord(orgId, key, id, data);
  }

  @Delete(':key/records/:id')
  @RequirePermission('custom_objects', 'delete')
  removeRecord(@CurrentOrg() orgId: string, @Param('key') key: string, @Param('id') id: string) {
    return this.service.removeRecord(orgId, key, id);
  }
}
