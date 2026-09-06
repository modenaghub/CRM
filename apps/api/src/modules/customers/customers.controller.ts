import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermission('customers', 'view')
  list(@CurrentOrg() orgId: string, @Query() query: PaginationQueryDto) {
    return this.customersService.list(orgId, query);
  }

  @Get(':id')
  @RequirePermission('customers', 'view')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.customersService.findOne360(orgId, id);
  }

  @Post()
  @RequirePermission('customers', 'create')
  create(@CurrentOrg() orgId: string, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(orgId, dto);
  }

  @Patch(':id')
  @RequirePermission('customers', 'edit')
  update(@CurrentOrg() orgId: string, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(orgId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('customers', 'delete')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.customersService.remove(orgId, id);
  }
}
