import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { MongoDriver } from '@mikro-orm/mongodb';

const config: MikroOrmModuleOptions = {
    driver: MongoDriver,
    clientUrl: 'mongodb://dbadmin:Ad2ubCq8ScsF7crt@118.70.109.40:29017/?authSource=admin',
    dbName: 'sonni-db',
    entities: ['./dist/entities'],
    entitiesTs: ['./src/entities'],
    ensureIndexes: true,
    debug: true,
};

export default config;