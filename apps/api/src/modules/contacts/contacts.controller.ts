import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @RequirePermission('contacts', 'view')
  list(
    @CurrentOrg() orgId: string,
    @Query('customerId') customerId?: string,
    @Query('prospectId') prospectId?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.contactsService.list(orgId, { customerId, prospectId, supplierId });
  }

  @Post()
  @RequirePermission('contacts', 'create')
  create(@CurrentOrg() orgId: string, @Body() dto: CreateContactDto) {
    return this.contactsService.create(orgId, dto);
  }

  @Patch(':id')
  @RequirePermission('contacts', 'edit')
  update(@CurrentOrg() orgId: string, @Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.contactsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('contacts', 'delete')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.contactsService.remove(orgId, id);
  }
}
