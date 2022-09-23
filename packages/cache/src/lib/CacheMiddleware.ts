import {
  ApplyMiddlewareOptions,
  isEveryByHookPayload,
  isFilterByHookPayload,
  isFindByHookPayload,
  isMapByHookPayload,
  isRemoveByHookPayload,
  JoshMiddleware,
  JoshMiddlewareStore,
  JoshProvider,
  Method,
  Payload,
  Payloads,
  PostProvider,
  PreProvider
} from '@joshdb/provider';
import { addExitCallback } from 'catch-exit';
import { getProperty } from 'property-helpers';

/* 
[-] - Payload.AutoKey
[x] - Payload.Clear
[x] - Payload.Dec
[x] - Payload.Delete
[x] - Payload.DeleteMany
[x] - Payload.Each
[-] - Payload.Ensure
[x] - Payload.Entries
[x] - Payload.Every
[x] - Payload.Filter
[x] - Payload.Find
[x] - Payload.Get
[x] - Payload.GetMany
[-] - Payload.Has
[x] - Payload.Inc
[x] - Payload.Keys - force fetches cache first
[x] - Payload.Map
[x] - Payload.Math
[ ] - Payload.Partition
[x] - Payload.Push
[-] - Payload.Random
[-] - Payload.RandomKey
[?] - Payload.Remove
[x] - Payload.Set
[x] - Payload.SetMany
[-] - Payload.Size
[ ] - Payload.Some
[x] - Payload.Update
[x] - Payload.Values - force fetches cache first
[ ] - Add errors collection everywhere and check skipProvider
*/

@ApplyMiddlewareOptions({ name: 'cache' })
export class CacheMiddleware<StoredValue = unknown> extends JoshMiddleware<CacheMiddleware.ContextData<StoredValue>, StoredValue> {
  public pollingInterval: NodeJS.Timer | undefined;

  public async init(store: JoshMiddlewareStore<StoredValue>) {
    await super.init(store);
    await this.fetchCache();
    return this;
  }

  @PreProvider()
  public async [Method.Get]<Value = StoredValue>(payload: Payloads.Get<Value>): Promise<Payloads.Get<Value>> {
    const { key, path } = payload;
    const { provider: cache } = this.context;
    const { data, errors } = await cache[Method.Get]<CacheMiddleware.Document<Value>>({ method: Method.Get, key, path, errors: [] });

    payload.errors = [...payload.errors, ...errors];

    if (data && (await this.checkNotExpired(data, key))) {
      payload.data = data.value;
    }

    return payload;
  }

  @PreProvider()
  public async [Method.Each](payload: Payloads.Each<StoredValue>): Promise<Payloads.Each<StoredValue>> {
    const { hook } = payload;
    const { provider: cache } = this.context;
    const cacheHook = async (value: CacheMiddleware.Document<StoredValue>, key: string) => {
      if (await this.checkNotExpired(value, key)) {
        return hook(value.value, key);
      }

      const { data: bypassCacheData } = await this.provider[Method.Get]({ method: Method.Get, key, path: [], errors: [] });

      if (bypassCacheData) return hook(bypassCacheData, key);
    };

    await cache[Method.Each]({ method: Method.Each, hook: cacheHook, errors: [] });

    payload.metadata ??= {};
    payload.metadata.skipProvider = true;

    return payload;
  }

  @PreProvider()
  public async [Method.Has](payload: Payloads.Has): Promise<Payloads.Has> {
    const { key, path } = payload;
    const { provider: cache } = this.context;
    const { data } = await cache[Method.Get]({ method: Method.Get, key, path, errors: [] });

    if (data && (await this.checkNotExpired(data, key))) {
      const { data: hasData } = await cache[Method.Has]({ method: Method.Has, key, path: ['value', ...path], errors: [] });

      payload.data = hasData;
    }

    return payload;
  }

  @PreProvider()
  public async [Method.Entries](payload: Payloads.Entries<StoredValue>): Promise<Payloads.Entries<StoredValue>> {
    const { provider: cache } = this.context;
    const { data: entries } = await cache[Method.Entries]({ method: Method.Entries, errors: [] });

    if (entries) {
      payload.data ??= {};

      for (const [key, val] of Object.entries(entries)) {
        if (await this.checkNotExpired(val, key)) {
          payload.data[key] = val.value;
        } else {
          const { data: bypassCacheData } = await this.provider[Method.Get]({ method: Method.Get, key, path: [], errors: [] });

          if (bypassCacheData) payload.data[key] = bypassCacheData;
        }
      }
    }

    return payload;
  }

  public async [Method.Every](payload: Payloads.Every.ByHook<StoredValue>): Promise<Payloads.Every.ByHook<StoredValue>>;
  public async [Method.Every](payload: Payloads.Every.ByValue): Promise<Payloads.Every.ByValue>;

  @PreProvider()
  public async [Method.Every](payload: Payloads.Every<StoredValue>): Promise<Payloads.Every<StoredValue>> {
    const { provider: cache } = this.context;
    const { type, hook, path, value } = payload;
    const cacheHook = (hook: Payload.Hook<StoredValue, unknown>) => {
      return async (value: CacheMiddleware.Document<StoredValue>, key: string) => {
        if (await this.checkNotExpired(value, key)) {
          return hook(value.value, key);
        }

        const { data: bypassCacheData } = await this.provider[Method.Get]<StoredValue>({ method: Method.Get, key, path: [], errors: [] });

        if (bypassCacheData) return hook(bypassCacheData, key);

        return true;
      };
    };

    if (isEveryByHookPayload(payload) && hook) {
      const { data, errors } = await cache[Method.Every]({ method: Method.Every, type, data: true, hook: cacheHook(hook), path, errors: [] });

      payload.data = data;
      payload.errors = [...payload.errors, ...errors];
    } else {
      const valueHook = (storedValue: StoredValue) => {
        const data = getProperty(storedValue, path || []);

        return data === value;
      };

      const { data, errors } = await cache[Method.Every]({
        method: Method.Every,
        type: Payload.Type.Hook,
        data: true,
        hook: cacheHook(valueHook),
        path,
        errors: []
      });

      payload.data = data;
      payload.errors = [...payload.errors, ...errors];
    }

    return payload;
  }

  public async [Method.Filter](payload: Payloads.Filter.ByHook<StoredValue>): Promise<Payloads.Filter.ByHook<StoredValue>>;
  public async [Method.Filter](payload: Payloads.Filter.ByValue<StoredValue>): Promise<Payloads.Filter.ByValue<StoredValue>>;

  @PreProvider()
  public async [Method.Filter](payload: Payloads.Filter<StoredValue>): Promise<Payloads.Filter<StoredValue>> {
    const { provider: cache } = this.context;
    const { hook, path, type, value } = payload;

    payload.data = {};

    if (hook && isFilterByHookPayload(payload)) {
      const cacheHook = async (value: CacheMiddleware.Document<StoredValue>, key: string) => {
        if (await this.checkNotExpired(value, key)) {
          if (await hook(value.value, key)) {
            payload.data ??= {};
            payload.data[key] = value.value;
          }
        }

        const { data: bypassCacheData } = await this.provider[Method.Get]({ method: Method.Get, key, path: path ?? [], errors: [] });

        if (bypassCacheData) {
          if (await hook(bypassCacheData, key)) {
            payload.data ??= {};
            payload.data[key] = bypassCacheData;
          }
        }

        return false;
      };

      const { errors } = await cache[Method.Filter]({ method: Method.Filter, hook: cacheHook, type, path: [], errors: [] });

      payload.errors = [...payload.errors, ...errors];
    } else {
      const { data, errors } = await cache[Method.Filter]({
        method: Method.Filter,
        type,
        data: {},
        value,
        path: ['value', ...(path ?? [])],
        errors: []
      });

      if (data) {
        const final: { [key: string]: StoredValue } = {};

        for (const [key, val] of Object.entries(data)) {
          if (await this.checkNotExpired(val, key)) {
            final[key] = val.value;
          } else {
            const { data: bypassCacheData } = await this.provider[Method.Get]({ method: Method.Get, key, path: [], errors: [] });

            if (bypassCacheData) final[key] = bypassCacheData;
          }
        }

        payload.data = final;
      }

      payload.errors = [...payload.errors, ...errors];
    }

    return payload;
  }

  public async [Method.Find](payload: Payloads.Find.ByHook<StoredValue>): Promise<Payloads.Find.ByHook<StoredValue>>;
  public async [Method.Find](payload: Payloads.Find.ByValue<StoredValue>): Promise<Payloads.Find.ByValue<StoredValue>>;
  @PreProvider()
  public async [Method.Find](payload: Payloads.Find<StoredValue>): Promise<Payloads.Find<StoredValue>> {
    const { provider: cache } = this.context;
    const { hook, path, type, value } = payload;

    if (hook && isFindByHookPayload(payload)) {
      const cacheHook = async (value: CacheMiddleware.Document<StoredValue>, key: string) => {
        if (await this.checkNotExpired(value, key)) {
          if (await hook(value.value, key)) {
            payload.data = [key, value.value];
            return true;
          }
        }

        const { data: bypassCacheData } = await this.provider[Method.Get]({ method: Method.Get, key, path: [], errors: [] });

        if (bypassCacheData) {
          if (await hook(bypassCacheData, key)) {
            payload.data = [key, bypassCacheData];
            return true;
          }
        }

        return false;
      };

      const { errors } = await cache[Method.Find]({ method: Method.Find, hook: cacheHook, type, path, errors: [] });

      payload.errors = [...payload.errors, ...errors];
    } else {
      const { data, errors } = await cache[Method.Find]({
        method: Method.Find,
        type,
        value,
        path: ['value', ...(path ?? [])],
        errors: []
      });

      if (data && data[0]) {
        if (await this.checkNotExpired(data[1], data[0])) {
          payload.data = [data[0], data[1].value];
        } else {
          const { data: bypassCacheData } = await this.provider[Method.Get]({ method: Method.Get, key: data[0], path: path ?? [], errors: [] });

          if (bypassCacheData) {
            payload.data = [data[0], bypassCacheData];
          }
        }
      }

      payload.errors = [...payload.errors, ...errors];
    }

    return payload;
  }

  @PreProvider()
  public async [Method.Keys](payload: Payloads.Keys): Promise<Payloads.Keys> {
    const { provider: cache } = this.context;

    await this.populateCache();

    const { data, errors } = await cache[Method.Keys]({ method: Method.Keys, errors: [] });

    payload.data = data;
    payload.errors = [...payload.errors, ...errors];
    return payload;
  }

  @PreProvider()
  public async [Method.Values](payload: Payloads.Values<StoredValue>): Promise<Payloads.Values<StoredValue>> {
    const { provider: cache } = this.context;

    await this.populateCache();

    const { data, errors } = await cache[Method.Values]({ method: Method.Values, errors: [] });

    payload.data = data?.map(({ value }) => value);
    payload.errors = [...payload.errors, ...errors];
    return payload;
  }

  public async [Method.Map]<Value = StoredValue>(payload: Payloads.Map.ByHook<StoredValue, Value>): Promise<Payloads.Map.ByHook<StoredValue, Value>>;
  public async [Method.Map]<Value = StoredValue>(payload: Payloads.Map.ByPath<Value>): Promise<Payloads.Map.ByPath<Value>>;
  @PreProvider()
  public async [Method.Map]<ReturnValue = StoredValue>(
    payload: Payloads.Map<StoredValue, ReturnValue>
  ): Promise<Payloads.Map<StoredValue, ReturnValue>> {
    const { provider: cache } = this.context;
    const { hook, path, type } = payload;

    if (hook && isMapByHookPayload(payload)) {
      const mapped: ReturnValue[] = [];
      const cacheHook = async (value: CacheMiddleware.Document<StoredValue>, key: string) => {
        if (await this.checkNotExpired(value, key)) {
          return mapped.push(await hook(value.value, key));
        }

        const { data: bypassCacheData } = await this.provider[Method.Get]({ method: Method.Get, key, path: [], errors: [] });

        if (bypassCacheData) {
          mapped.push(await hook(bypassCacheData, key));
        }

        return null;
      };

      const { errors } = await cache[Method.Map]({ method: Method.Map, hook: cacheHook, type, path, errors: [] });

      payload.data = mapped;

      payload.errors = [...payload.errors, ...errors];
    } else {
      const mapped: ReturnValue[] = [];
      const cacheHook = async (value: CacheMiddleware.Document<StoredValue>, key: string) => {
        if (await this.checkNotExpired(value, key)) {
          return mapped.push(getProperty(value.value, path ?? []) as ReturnValue);
        }

        const { data: bypassCacheData } = await this.provider[Method.Get]({ method: Method.Get, key, path: [], errors: [] });

        if (bypassCacheData) {
          mapped.push(getProperty(bypassCacheData, path ?? []) as ReturnValue);
        }

        return null;
      };

      const { errors } = await cache[Method.Each]({
        method: Method.Each,
        hook: cacheHook,
        errors: []
      });

      payload.data = mapped;

      payload.errors = [...payload.errors, ...errors];
    }

    return payload;
  }

  @PreProvider()
  public async [Method.GetMany](payload: Payloads.GetMany<StoredValue>): Promise<Payloads.GetMany<StoredValue>> {
    payload.data ??= {};

    const { provider: cache } = this.context;
    const { keys } = payload;

    for (const key of keys) {
      const { data, errors } = await cache[Method.Get]({ method: Method.Get, key, path: [], errors: [] });

      payload.errors = [...payload.errors, ...errors];

      if (data && (await this.checkNotExpired(data, key))) {
        payload.data[key] = data.value;
      } else {
        const { data: bypassCacheData } = await this.provider[Method.Get]({ method: Method.Get, key, path: [], errors: [] });

        if (bypassCacheData) payload.data[key] = bypassCacheData;
      }
    }

    return payload;
  }

  @PostProvider()
  public async [Method.Clear](payload: Payloads.Clear): Promise<Payloads.Clear> {
    const { provider: cache } = this.context;

    await cache[Method.Clear]({ method: Method.Clear, errors: [] });

    return payload;
  }

  @PostProvider()
  public async [Method.Set]<Value = StoredValue>(payload: Payloads.Set<Value>): Promise<Payloads.Set<Value>> {
    const { key, value, path } = payload;
    const { provider: cache } = this.context;

    await cache[Method.Set]<CacheMiddleware.Document<Value>>({
      method: Method.Set,
      key,
      path,
      value: { created: new Date().toISOString(), value },
      errors: []
    });

    return payload;
  }

  @PostProvider()
  public async [Method.SetMany](payload: Payloads.SetMany): Promise<Payloads.SetMany> {
    const { entries, overwrite } = payload;
    const { provider: cache } = this.context;
    const data: Payloads.SetMany.KeyPathValue[] = [];

    for (const { key, path, value } of entries) {
      if (path.length === 0) {
        const doc = { created: new Date().toISOString(), key, value };

        data.push({ key, path: [], value: doc });
      } else {
        data.push({ key, path: ['value', ...path], value });
      }
    }

    await cache[Method.SetMany]({ method: Method.SetMany, entries: data, overwrite, errors: [] });

    return payload;
  }

  @PostProvider()
  public async [Method.Inc](payload: Payloads.Inc): Promise<Payloads.Inc> {
    const { key, path } = payload;
    const { provider: cache } = this.context;
    const { errors } = await cache[Method.Inc]({ method: Method.Inc, key, path: ['value', ...path], errors: [] });

    payload.errors = [...payload.errors, ...errors];

    return payload;
  }

  @PostProvider()
  public async [Method.Dec](payload: Payloads.Dec): Promise<Payloads.Dec> {
    const { key, path } = payload;
    const { provider: cache } = this.context;
    const { errors } = await cache[Method.Dec]({ method: Method.Dec, key, path: ['value', ...path], errors: [] });

    payload.errors = [...payload.errors, ...errors];

    return payload;
  }

  @PostProvider()
  public async [Method.Delete](payload: Payloads.Delete): Promise<Payloads.Delete> {
    const { key, path } = payload;
    const { provider: cache } = this.context;
    const { errors } = await cache[Method.Delete]({ method: Method.Delete, key, path: path.length > 0 ? ['value', ...path] : [], errors: [] });

    payload.errors = [...payload.errors, ...errors];

    return payload;
  }

  @PostProvider()
  public async [Method.DeleteMany](payload: Payloads.DeleteMany): Promise<Payloads.DeleteMany> {
    const { keys } = payload;
    const { provider: cache } = this.context;
    const { errors } = await cache[Method.DeleteMany]({ method: Method.DeleteMany, keys, errors: [] });

    payload.errors = [...payload.errors, ...errors];

    return payload;
  }

  @PostProvider()
  public async [Method.Push]<Value>(payload: Payloads.Push<Value>): Promise<Payloads.Push<Value>> {
    const { key, value, path } = payload;
    const { provider: cache } = this.context;
    const { errors } = await cache[Method.Push]({
      method: Method.Push,
      key,
      path: ['value', ...path],
      value,
      errors: []
    });

    payload.errors = [...payload.errors, ...errors];

    return payload;
  }

  @PostProvider()
  public async [Method.Math](payload: Payloads.Math): Promise<Payloads.Math> {
    const { key, path, operand, operator } = payload;
    const { provider: cache } = this.context;
    const { errors } = await cache[Method.Math]({ method: Method.Math, key, path: ['value', ...path], operand, operator, errors: [] });

    payload.errors = [...payload.errors, ...errors];

    return payload;
  }

  public async [Method.Remove]<Value = StoredValue>(payload: Payloads.Remove.ByHook<Value>): Promise<Payloads.Remove.ByHook<Value>>;
  public async [Method.Remove](payload: Payloads.Remove.ByValue): Promise<Payloads.Remove.ByValue>;

  @PostProvider()
  public async [Method.Remove]<Value = StoredValue>(payload: Payloads.Remove<Value>): Promise<Payloads.Remove<Value>> {
    const { key, path, type, hook, value } = payload;
    const { provider: cache } = this.context;
    const { data } = await cache[Method.Get]({ method: Method.Get, key, path: [], errors: [] });

    if (data && (await this.checkNotExpired(data, key))) {
      if (isRemoveByHookPayload(payload) && hook) {
        const { errors } = await cache[Method.Remove]({ method: Method.Remove, key, path: ['value', ...path], type, hook, errors: [] });

        payload.errors = [...payload.errors, ...errors];
      } else {
        const { errors } = await cache[Method.Remove]({ method: Method.Remove, key, path: ['value', ...path], type, value, errors: [] });

        payload.errors = [...payload.errors, ...errors];
      }
    }

    return payload;
  }

  @PostProvider()
  public async [Method.Update]<Value = StoredValue>(payload: Payloads.Update<StoredValue, Value>): Promise<Payloads.Update<StoredValue, Value>> {
    const { key, hook } = payload;
    const { provider: cache } = this.context;
    const { data } = await cache[Method.Get]({ method: Method.Get, key, path: [], errors: [] });

    if (data && (await this.checkNotExpired(data, key))) {
      const newValue = hook(data.value, key);
      const { errors } = await this[Method.Set]({ method: Method.Set, key, value: newValue, path: [], errors: [] });

      payload.errors = [...payload.errors, ...errors];
    }

    return payload;
  }

  private async checkNotExpired(data: CacheMiddleware.Document<unknown>, key: string) {
    if (!this.context.ttl || !this.context.ttl.enabled) return true;
    if (new Date().getTime() - new Date(data.created).getTime() <= (this.context.ttl.timeout || 5000)) return true;

    const { provider: cache } = this.context;

    await cache[Method.Delete]({ method: Method.Delete, key, path: [], errors: [] });

    return false;
  }

  private async populateCache() {
    const { provider: cache } = this.context;

    await cache[Method.Clear]({ method: Method.Clear, errors: [] });

    const all = await this.provider[Method.Entries]({ method: Method.Entries, data: {}, errors: [] });

    if (!all.data) return;

    await this[Method.SetMany]({
      method: Method.SetMany,
      entries: Object.entries(all.data).map(([key, value]) => ({ key, value, path: [] })),
      overwrite: true,
      errors: []
    });
  }

  private async fetchCache() {
    if (this.context.fetchAll) {
      await this.populateCache();
    }

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
  export interface Document<StoredValue> {
    value: StoredValue;
    created: string;
  }
  export interface ContextData<StoredValue> {
    provider: JoshProvider<Document<StoredValue>>;
    fetchAll?: boolean;
    polling?: {
      enabled: boolean;
      interval?: number;
    };
    ttl?: {
      enabled: boolean;
      timeout?: number;
    };
  }
}
