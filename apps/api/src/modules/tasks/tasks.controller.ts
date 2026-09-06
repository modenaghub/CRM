import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @RequirePermission('tasks', 'view')
  list(@CurrentOrg() orgId: string, @Query('assigneeId') assigneeId?: string, @Query('status') status?: string) {
    return this.tasksService.list(orgId, assigneeId, status);
  }

  @Post()
  @RequirePermission('tasks', 'create')
  create(@CurrentOrg() orgId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(orgId, dto);
  }

  @Patch(':id')
  @RequirePermission('tasks', 'edit')
  update(@CurrentOrg() orgId: string, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(orgId, id, dto);
  }

  @Post(':id/complete')
  @RequirePermission('tasks', 'edit')
  complete(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.tasksService.complete(orgId, id);
  }

  @Delete(':id')
  @RequirePermission('tasks', 'delete')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.tasksService.remove(orgId, id);
  }
}
