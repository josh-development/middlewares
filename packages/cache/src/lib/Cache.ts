import { ApplyMiddlewareOptions, Middleware } from '@joshdb/core';

@ApplyMiddlewareOptions({ name: 'cache' })
export class Cache<StoredValue = unknown> extends Middleware<Cache.ContextData, StoredValue> {}

export namespace Cache {
  export interface ContextData {}
}
