import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermission('products', 'view')
  list(@CurrentOrg() orgId: string, @Query() query: PaginationQueryDto) {
    return this.productsService.list(orgId, query);
  }

  @Post()
  @RequirePermission('products', 'create')
  create(@CurrentOrg() orgId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(orgId, dto);
  }

  @Patch(':id')
  @RequirePermission('products', 'edit')
  update(@CurrentOrg() orgId: string, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('products', 'delete')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.productsService.remove(orgId, id);
  }
}
