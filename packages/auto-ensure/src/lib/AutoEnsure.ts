import { ApplyMiddlewareOptions, Middleware } from '@joshdb/core';

@ApplyMiddlewareOptions({ name: 'AutoEnsure' })
export class AutoEnsure<StoredValue = unknown> extends Middleware<AutoEnsure.ContextData, StoredValue> {}

export namespace AutoEnsure {
  export interface ContextData {}
}
