import { Module } from '@nestjs/common';
import { AutomationsListener } from './automations.listener';

@Module({
  providers: [AutomationsListener],
})
export class AutomationsModule {}
