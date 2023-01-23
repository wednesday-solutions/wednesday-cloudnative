import fs from 'node:fs';
import path from 'node:path';
import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';

const command = process.argv[2];

// TODO: Move these to ENVs
const sequelize = new Sequelize({
  dialect: 'postgres',
  database: 'procedures',
  host: '127.0.0.1',
  port: 5432,
  password: 'postgres',
  username: 'postgres',
});

/**
 * Migrator will be used to look for `migrations` dir and run them one by one.
 * Will use the `SequelizeMeta` table to track the migrations.
 */
const migrator = new Umzug({
  migrations: {
    glob: ['./migrations/*.sql', { cwd: __dirname }],
    resolve(params) {
      const downPath = path.join(
        path.dirname(params.path!),
        'down',
        path.basename(params.path!),
      );

      return {
        name: params.name,
        path: params.path,
        up: async () => params.context.query(fs.readFileSync(params.path!).toString()),
        down: async () => params.context.query(fs.readFileSync(downPath).toString()),
      };
    },
  },
  storage: new SequelizeStorage({ sequelize }),
  context: sequelize,
  logger: console,
});

/**
 * Seeder will be used to look for `seeders` dir and run them one by one.
 * Will use the `SeedersMeta` table to track the seeders.
 */
const seeder = new Umzug({
  migrations: {
    glob: ['./seeders/*.ts', { cwd: __dirname }],
  },
  storage: new SequelizeStorage({ sequelize, modelName: 'SeedersMeta' }),
  context: sequelize,
  logger: console,
});

export type Seeder = typeof seeder._types.migration;
export type Migration = typeof migrator._types.migration;

async function migrate() {
  if (command === 'up') {
    await migrator.up();
  }

  if (command === 'down') {
    await migrator.down();
  }

  if (command === 'purge') {
    await migrator.down({ to: 0 });
  }

  if (command === 'seed:up') {
    await seeder.up();
  }

  if (command === 'seed:down') {
    await seeder.down();
  }
}

void migrate().then(() => {
  console.info(
    `Successfully ${
      command === 'seed:up' || command === 'seed:down' ? 'seeded' : 'migrated'
    }!`,
  );
});