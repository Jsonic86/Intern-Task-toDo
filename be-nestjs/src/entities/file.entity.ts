import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { ObjectId } from "mongodb";

@Entity()
export class FileEntity {
    @PrimaryKey()
    _id!: ObjectId;

    @Property()
    filename!: string;

    @Property()
    createdAt: Date = new Date();

    @Property()
    taskId!: string; // Optional field to associate with a task
}