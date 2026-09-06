import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermission('suppliers', 'view')
  list(@CurrentOrg() orgId: string, @Query() query: PaginationQueryDto) {
    return this.suppliersService.list(orgId, query);
  }

  @Get(':id')
  @RequirePermission('suppliers', 'view')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.suppliersService.findOne360(orgId, id);
  }

  @Post()
  @RequirePermission('suppliers', 'create')
  create(@CurrentOrg() orgId: string, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(orgId, dto);
  }

  @Patch(':id')
  @RequirePermission('suppliers', 'edit')
  update(@CurrentOrg() orgId: string, @Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(orgId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('suppliers', 'delete')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.suppliersService.remove(orgId, id);
  }
}
