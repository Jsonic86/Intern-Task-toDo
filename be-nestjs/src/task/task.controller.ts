import { Body, Controller, Delete, Get, Param, ParseBoolPipe, Post, Put, Query } from '@nestjs/common';
import { TaskService } from './task.service';

@Controller('task')
export class TaskController {
    constructor(private readonly taskService: TaskService) { }

    @Post()
    async createTask(@Body('title') title: string) {
        return this.taskService.createTask(title);
    }

    @Get()
    async getTasks(@Query('filterComplete', new ParseBoolPipe({ optional: true })) filterComplete?: boolean) {
        return this.taskService.getTasks(filterComplete);
    }
    @Put(':id')
    async updateStatus(@Param('id') id: string) {
        return this.taskService.updateStatus(id);
    }
    @Delete(':id')
    async deleteTask(@Param('id') id: string) {
        return this.taskService.deleteTask(id);
    }
}
