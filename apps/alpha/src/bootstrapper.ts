import path from 'node:path';
import autoload from '@fastify/autoload';
import fastifyCors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import fastify from 'fastify';
import { CustomError } from 'fastify-custom-errors';
import { MainCacheInstance } from './cache';
import { MainDBInstance } from './db';
import type { FastifyBootstrapperOptions } from './types/bootstrapper.types';

/**
 * Quickly instantiate a Fastify Server. This class will quickly generate a
 * fastify server that will setup all the necessary logic required for the application
 * to work.
 */
export class FastifyServer {
  /**
   * Instance of fastify server!
   */
  readonly instance: FastifyInstance;

  /**
   * Setup the fastify server!
   *
   * @example
   * ```typescript
   * // Without host and logging, logging defaults to `false` and host to `localhost`
   * const server = new FastifyServer({ port: 5000 });
   *
   * // With host and logging
   * const server = new FastifyServer({ port: 5000, logging: true, host: '0.0.0.0' });
   * ```
   *
   * @param [options] - options for FastifyBootstrapper
   * @param [options.port] - the port on which the application should listen, defaults to 5000
   * @param [options.host] - the host on which the application should run, defaults to `localhost`
   * @param [options.logging] - should log output, defaults to `false`
   * @param [options.routes] - array containing object specifying a route and its prefix
   * @param [options.schemas] - array containing schemas to register
   */
  constructor(public options: FastifyBootstrapperOptions) {
    this.instance = fastify({ logger: options.logging ?? false });
    void this.instance.register(fastifyCors, {
      origin: ['http://localhost:3000', /\.localhost:3000$/],
    });

    this.init()
      .then(() => {
        console.info('Bootstrapped the application successfully!');
      })
      .catch(error => {
        throw error;
      });
  }

  /**
   * Initialize the application
   */
  async init() {
    this.#registerSchemas();
    this.#registerRoutes();
    this.#setupErrorHandler();
    await this.#authenticateMainDB();
    await this.#initializeMainCache();
  }

  /**
   * Don't call this function in the constructor. Rather this is here for extensability
   * which means the server doesn't start automatically! Rather its upto the user to start it.
   *
   * If you want to extend functionality its not recommended to directly modify this class rather
   * recommended to extend this function and use that to extend functionality. Post that call the
   * `startServer` method!
   *
   * @example
   * ```typescript
   * class ExtendedFastifyServer extends FastifyServer {
   *  constructor() {
   *    super({ fastifyServerOptions });
   *  }
   *
   *  yourExtraMethod() {
   *    // Logic
   *  }
   * }
   *
   * const server = new ExtendedFastifyServer();
   * void server.startServer();
   * ```
   */
  async startServer() {
    await this.instance.listen({
      port: this.options.port ?? 5000,
      host: this.options.host ?? 'localhost',
    });
  }

  /**
   * Register schemas provided by the user, warn the user if no schemas were provided.
   */
  #registerSchemas() {
    if (!this.options.schemas || this.options.schemas.length === 0) {
      this.instance.log.warn(
        'No schemas were provided, you may not have type checking for schema dependent things.',
      );

      return;
    }

    for (const schemaDef of this.options.schemas) {
      for (const _schema of schemaDef) {
        this.instance.addSchema(_schema);
      }
    }
  }

  /**
   * Authenticates connection to the main database
   */
  async #authenticateMainDB() {
    await MainDBInstance.getInstance().verify();
  }

  /**
   * Registers routes provided to the bootstrapper and auto-register if present.
   * HealthCheck route is created by default at `/healthcheck` by the bootstrapper.
   */
  #registerRoutes() {
    const routes = this.options.routes ?? [];

    // Register Health Check
    this.instance.get('/alpha/health-check', async () => {
      return { status: 'Ok!', message: 'Fastify just being fast!' };
    });

    // Autoload all the `*.routes.ts` file that exist inside the `modules` dir
    void this.instance.register(autoload, {
      dir: path.join(__dirname, 'modules'),
      indexPattern: /.*routes.ts$/,
    });

    for (const _route of routes) {
      void this.instance.register(_route.handler, _route.opts);
    }
  }

  /**
   * Try and connect to the main cache, throw if any error occurs!
   */
  async #initializeMainCache() {
    await MainCacheInstance.getInstance().connection.connect();
    console.debug('Connection to main cache succeeded!');
  }

  /**
   * Setup global Error Handler.
   */
  #setupErrorHandler() {
    this.instance.setErrorHandler((error, _request, reply) => {
      if (error instanceof CustomError) {
        // These are errors that we know we have handled through our
        // own error handling logic!
        void reply.status(error.statusCode).send({
          ok: false,
          errCode: error.errorCode,
          errors: error.serializeErrors(),
        });
      } else if (error.validation) {
        void reply.status(400).send({
          ok: false,
          errCode: error.code,
          errors: error.validation,
          field: error.validationContext,
        });
      } else {
        // Handle all the errors that are unexpected and unforeseen
        // the error should be logged here!
        this.instance.log.error(error);

        void reply.status(500).send({
          ok: false,
          errCode: 500,
          errors: [{ message: 'Something went wrong!' }],
        });
      }
    });
  }
}

export default FastifyServer;
