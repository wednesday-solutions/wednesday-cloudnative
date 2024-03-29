import type { FastifyInstance, FastifyRegisterOptions } from 'fastify';
import type { JsonSchema } from 'fastify-zod';

/**
 * Options for FastifyBootstrapper
 */
export interface FastifyBootstrapperOptions {
  /**
   * Port the application should listen on, is required!
   */
  port?: number;

  /**
   * Host the application should run on, defaults to `localhost`
   */
  host?: string;

  /**
   * Option forwarded to `fastify.logger`, defaults to `false`
   * Pino as a logger is built into Fastify itself. Setting this will
   * allow you to do the following!
   *
   * @example
   * ```typescript
   * fastify.log('Foobar');
   *
   * // or in the route
   * request.log('Fizzbuzz');
   * ```
   */
  logging?: boolean;

  /**
   * Array containing all the routes defined in the application.
   * These will be registered by the bootstrapper. A Health-Check route
   * is automatically created at `/healthcheck`!
   */
  routes?: RouteConfig[];

  /**
   * An array of JSON Schemas that will be inserted into the application
   * before routes are registered.
   */
  schemas?: JsonSchema[][];
}

type RouteConfig = {
  /**
   * Handler that handles this route
   */
  handler(server: FastifyInstance): Promise<void>,

  /**
   * FastifyRegisterOptions taken in by route configurations
   */
  opts: FastifyRegisterOptions<{ prefix: string }>,
};
