import { ApplyMiddlewareOptions, JoshProvider, Method, Middleware, MiddlewareStore, Payloads, PreProvider } from '@joshdb/middleware';
import { addExitCallback } from 'catch-exit';

@ApplyMiddlewareOptions({ name: 'cache' })
export class CacheMiddleware<StoredValue = unknown> extends Middleware<CacheMiddleware.ContextData, StoredValue> {
  public pollingInterval: NodeJS.Timer | undefined;

  public async init(store: MiddlewareStore<StoredValue>) {
    await super.init(store);
    await this.fetchCache();
    return this;
  }

  public async populateCache() {
    const { provider: cache } = this.context;
    await cache[Method.Clear]({ method: Method.Clear });

    const all = await this.provider[Method.Entries]({ method: Method.Entries, data: {} });

    if (!all.data) return;

    for (const [key, value] of Object.entries(all.data)) {
      await cache.set({ method: Method.Set, key, value, path: [] });
    }
  }

  @PreProvider()
  public async [Method.Clear](payload: Payloads.Clear): Promise<Payloads.Clear> {
    await this.context.provider[Method.Clear]({ method: Method.Clear });
    return payload;
  }

  @PreProvider()
  public async [Method.Get]<Value = StoredValue>(payload: Payloads.Get<Value>): Promise<Payloads.Get<Value>> {
    const { key, path } = payload;
    const { provider: cache } = this.context;
    const { data: hasData } = await cache[Method.Has]({ method: Method.Has, key, path });

    if (hasData) {
      const { data: cachedValue } = await cache[Method.Get]<Value>({ method: Method.Get, key, path });
      payload.data = cachedValue;
      return payload;
    }

    return payload;
  }

  @PreProvider()
  public async [Method.Set]<Value = StoredValue>(payload: Payloads.Set<Value>): Promise<Payloads.Set<Value>> {
    const { key, value, path } = payload;
    const { provider: cache } = this.context;

    await cache[Method.Set]<Value>({ method: Method.Set, key, path, value });

    return payload;
  }

  private async fetchCache() {
    await this.populateCache();

    if (this.context.polling && this.context.polling.enabled) {
      this.startPolling();
    }
  }

  private startPolling() {
    this.pollingInterval = setInterval(() => this.populateCache(), this.context.polling?.interval || 10000);
    addExitCallback(() => {
      clearInterval(this.pollingInterval);
    });
  }
}

export namespace CacheMiddleware {
  export interface ContextData {
    provider: JoshProvider;
    polling?: {
      enabled: boolean;
      interval?: number;
    };
  }
}
