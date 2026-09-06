import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { Db } from '../../db/client';
import * as schema from '../../db/schema';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(orgId: string, query: PaginationQueryDto) {
    const conditions = [eq(schema.products.organizationId, orgId)];
    if (query.status) conditions.push(eq(schema.products.status, query.status));
    if (query.search) {
      conditions.push(
        or(ilike(schema.products.name, `%${query.search}%`), ilike(schema.products.sku, `%${query.search}%`))!,
      );
    }
    const where = and(...conditions);
    const [{ total }] = await this.db.select({ total: count() }).from(schema.products).where(where);
    const rows = await this.db
      .select()
      .from(schema.products)
      .where(where)
      .orderBy(desc(schema.products.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    return { data: rows, total: Number(total), page: query.page, pageSize: query.pageSize };
  }

  async create(orgId: string, dto: CreateProductDto) {
    const values: any = { organizationId: orgId, ...dto };
    if (values.cost !== undefined) values.cost = String(values.cost);
    if (values.price !== undefined) values.price = String(values.price);
    if (values.stock !== undefined) values.stock = String(values.stock);
    if (values.minStock !== undefined) values.minStock = String(values.minStock);
    const [row] = await this.db.insert(schema.products).values(values).returning();
    return row;
  }

  async update(orgId: string, id: string, dto: UpdateProductDto) {
    const existing = await this.db.query.products.findFirst({
      where: and(eq(schema.products.id, id), eq(schema.products.organizationId, orgId)),
    });
    if (!existing) throw new NotFoundException('Produto não encontrado.');
    const values: any = { ...dto, updatedAt: new Date() };
    if (values.cost !== undefined) values.cost = String(values.cost);
    if (values.price !== undefined) values.price = String(values.price);
    if (values.stock !== undefined) values.stock = String(values.stock);
    if (values.minStock !== undefined) values.minStock = String(values.minStock);
    const [row] = await this.db.update(schema.products).set(values).where(eq(schema.products.id, id)).returning();
    return row;
  }

  async remove(orgId: string, id: string) {
    const existing = await this.db.query.products.findFirst({
      where: and(eq(schema.products.id, id), eq(schema.products.organizationId, orgId)),
    });
    if (!existing) throw new NotFoundException('Produto não encontrado.');
    await this.db.delete(schema.products).where(eq(schema.products.id, id));
    return { success: true };
  }
}
