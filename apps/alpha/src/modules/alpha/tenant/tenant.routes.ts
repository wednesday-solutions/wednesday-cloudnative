import type { CreateTenantBody } from 'entities-schemas';
import { TenantSchema } from 'entities-schemas';
import type { FastifyInstance } from 'fastify';
import { buildJsonSchemas } from 'fastify-zod';
import { registerTenant } from './tenant.controller';

const { schemas: tenantSchemas, $ref } = buildJsonSchemas({
  registerTenantResponse: TenantSchema.createTenantResponse,
  createTenantSchema: TenantSchema.createTenantSchema,
}, { $id: 'tenant-schemas' });

async function tenantRoutes(server: FastifyInstance) {
  server.post<{ Body: CreateTenantBody }>('/', {
    schema: {
      body: $ref('createTenantSchema'),
      response: {
        200: { data: $ref('registerTenantResponse') },
      },
    },
  }, registerTenant);
}

export { tenantSchemas };
export default tenantRoutes;
