import { ApplyMiddlewareOptions, Middleware } from '@joshdb/middleware';
import type { BaseValidator } from '@sapphire/shapeshift';

@ApplyMiddlewareOptions({ name: 'schema' })
export class SchemaMiddleware<StoredValue = unknown> extends Middleware<SchemaMiddleware.ContextData<StoredValue>, StoredValue> {}

export namespace SchemaMiddleware {
  export interface ContextData<StoredValue = unknown> {
    schema: BaseValidator<StoredValue>;
  }
}
