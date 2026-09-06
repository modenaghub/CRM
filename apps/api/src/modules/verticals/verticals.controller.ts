import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { VerticalsService } from './verticals.service';

@Controller('verticals')
export class VerticalsController {
  constructor(private readonly verticalsService: VerticalsService) {}

  @Public()
  @Get()
  listAll() {
    return this.verticalsService.listAll();
  }

  @Public()
  @Get(':key/template')
  getTemplate(@Param('key') key: string) {
    return this.verticalsService.getTemplate(key);
  }
}
