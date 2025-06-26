import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { ObjectId } from "mongodb";

@Entity()
export class Task {
    @PrimaryKey()
    _id!: ObjectId;

    @Property()
    title!: string;

    @Property()
    completed!: boolean;
}