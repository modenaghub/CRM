import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';

@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private readonly service: CustomFieldsService) {}

  @Get()
  @RequirePermission('settings', 'view')
  list(@CurrentOrg() orgId: string, @Query('entityType') entityType?: string) {
    return this.service.list(orgId, entityType);
  }

  @Post()
  @RequirePermission('settings', 'edit')
  create(@CurrentOrg() orgId: string, @Body() dto: CreateCustomFieldDto) {
    return this.service.create(orgId, dto);
  }

  @Delete(':id')
  @RequirePermission('settings', 'edit')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.remove(orgId, id);
  }

  @Get('values')
  getValues(@Query('entityType') entityType: any, @Query('entityId') entityId: string) {
    return this.service.getValues(entityType, entityId);
  }

  @Put('values')
  setValue(
    @Body('entityType') entityType: any,
    @Body('entityId') entityId: string,
    @Body('customFieldId') customFieldId: string,
    @Body('value') value: any,
  ) {
    return this.service.setValue(entityType, entityId, customFieldId, value);
  }
}
