import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { Task } from 'src/entities/task.entity';

@Injectable()
export class TaskService {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: EntityRepository<Task>,
        private readonly em: EntityManager
    ) { }

    async createTask(title: string): Promise<CommonResponse<Task>> {
        const task = this.taskRepository.create({ title, completed: false });
        this.em.persist(task);
        await this.em.flush();
        return {
            data: task,
            message: 'Task created successfully',
            success: true
        };
    }
    async getTasks(filterComplete: boolean): Promise<CommonResponse<Task[]>> {
        const tasks: Task[] = await this.taskRepository.find(filterComplete != null ? { completed: filterComplete } : {}, { orderBy: { _id: 'DESC' } });
        return {
            data: tasks,
            message: 'Tasks retrieved successfully',
            success: true
        }
    }

    async updateStatus(id: string): Promise<CommonResponse<Task>> {
        const task = await this.taskRepository.findOneOrFail(id);

        task.completed = true;
        this.em.persist(task);
        await this.em.flush();
        return {
            data: task,
            message: 'Task status updated successfully',
            success: true
        };
    }
    async deleteTask(id: string): Promise<CommonResponse<void>> {
        const task = await this.taskRepository.findOneOrFail(id);
        this.em.remove(task);
        await this.em.flush();
        return {
            data: null,
            message: 'Task deleted successfully',
            success: true
        };
    }
}

