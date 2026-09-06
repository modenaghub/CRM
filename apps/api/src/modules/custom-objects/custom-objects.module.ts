import { Module } from '@nestjs/common';
import { CustomObjectsController } from './custom-objects.controller';
import { CustomObjectsService } from './custom-objects.service';

@Module({
  controllers: [CustomObjectsController],
  providers: [CustomObjectsService],
})
export class CustomObjectsModule {}
