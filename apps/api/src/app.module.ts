import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DbModule } from './db/db.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

import { AuthModule } from './modules/auth/auth.module';
import { VerticalsModule } from './modules/verticals/verticals.module';
import { PlatformModule } from './modules/platform/platform.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProspectsModule } from './modules/prospects/prospects.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ProductsModule } from './modules/products/products.module';
import { PipelinesModule } from './modules/pipelines/pipelines.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CustomObjectsModule } from './modules/custom-objects/custom-objects.module';
import { CustomFieldsModule } from './modules/custom-fields/custom-fields.module';
import { AutomationsModule } from './modules/automations/automations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    DbModule,
    AuthModule,
    VerticalsModule,
    PlatformModule,
    CustomersModule,
    ProspectsModule,
    SuppliersModule,
    ContactsModule,
    ProductsModule,
    PipelinesModule,
    OpportunitiesModule,
    TasksModule,
    DashboardModule,
    CustomObjectsModule,
    CustomFieldsModule,
    AutomationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
