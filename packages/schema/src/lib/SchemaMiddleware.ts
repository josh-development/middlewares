import { ApplyMiddlewareOptions, Middleware } from '@joshdb/middleware';

@ApplyMiddlewareOptions({ name: 'schema' })
export class SchemaMiddleware<StoredValue = unknown> extends Middleware<SchemaMiddleware.ContextData, StoredValue> {}

export namespace SchemaMiddleware {
  export interface ContextData {}
}
