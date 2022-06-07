import { ApplyMiddlewareOptions, isPayloadWithData, Method, Middleware, Payloads, PostProvider, PreProvider } from '@joshdb/middleware';
import { mergeDefault } from '@sapphire/utilities';

@ApplyMiddlewareOptions({ name: 'autoEnsure' })
export class AutoEnsureMiddleware<StoredValue = unknown> extends Middleware<AutoEnsureMiddleware.ContextData<StoredValue>, StoredValue> {
  @PreProvider()
  public async [Method.Dec](payload: Payloads.Dec): Promise<Payloads.Dec> {
    const { key } = payload;
    const { defaultValue, ensureProperties } = this.context;

    if (ensureProperties) {
      const getPayload = await this.provider[Method.Get]({ method: Method.Get, key, path: [] });

      if (!isPayloadWithData(getPayload)) return payload;

      const { data } = getPayload;

      await this.provider[Method.Set]({ method: Method.Set, key, path: [], value: mergeDefault(defaultValue, data) });
    } else await this.provider[Method.Ensure]({ method: Method.Ensure, key, defaultValue });

    return payload;
  }

  @PostProvider()
  public async [Method.Get]<Value = StoredValue>(payload: Payloads.Get<Value>): Promise<Payloads.Get<Value>> {
    if (isPayloadWithData(payload)) return payload;

    const { key } = payload;
    const { defaultValue } = this.context;

    await this.provider[Method.Ensure]({ method: Method.Ensure, key, defaultValue });

    payload.data = defaultValue as unknown as Value;

    return payload;
  }

  @PostProvider()
  public async [Method.GetMany](payload: Payloads.GetMany<StoredValue>): Promise<Payloads.GetMany<StoredValue>> {
    payload.data ??= {};

    const { defaultValue } = this.context;

    for (const key of payload.keys) {
      if (key in payload.data && payload.data[key] !== null) continue;

      await this.provider[Method.Ensure]({ method: Method.Ensure, key, defaultValue });

      payload.data[key] = defaultValue;
    }

    return payload;
  }

  @PreProvider()
  public async [Method.Inc](payload: Payloads.Inc): Promise<Payloads.Inc> {
    const { key } = payload;
    const { defaultValue, ensureProperties } = this.context;

    if (ensureProperties) {
      const getPayload = await this.provider[Method.Get]({ method: Method.Get, key, path: [] });

      if (!isPayloadWithData(getPayload)) return payload;

      const { data } = getPayload;

      await this.provider[Method.Set]({ method: Method.Set, key, path: [], value: mergeDefault(defaultValue, data) });
    } else await this.provider[Method.Ensure]({ method: Method.Ensure, key, defaultValue });

    return payload;
  }

  @PreProvider()
  public async [Method.Push]<Value>(payload: Payloads.Push<Value>): Promise<Payloads.Push<Value>> {
    const { key } = payload;
    const { defaultValue, ensureProperties } = this.context;

    if (ensureProperties) {
      const getPayload = await this.provider[Method.Get]({ method: Method.Get, key, path: [] });

      if (!isPayloadWithData(getPayload)) return payload;

      const { data } = getPayload;

      await this.provider[Method.Set]({ method: Method.Set, key, path: [], value: mergeDefault(defaultValue, data) });
    } else await this.provider[Method.Ensure]({ method: Method.Ensure, key, defaultValue });

    return payload;
  }

  @PreProvider()
  public async [Method.Math](payload: Payloads.Math): Promise<Payloads.Math> {
    const { key } = payload;
    const { defaultValue, ensureProperties } = this.context;

    if (ensureProperties) {
      const getPayload = await this.provider[Method.Get]({ method: Method.Get, key, path: [] });

      if (!isPayloadWithData(getPayload)) return payload;

      const { data } = getPayload;

      await this.provider[Method.Set]({ method: Method.Set, key, path: [], value: mergeDefault(defaultValue, data) });
    } else await this.provider[Method.Ensure]({ method: Method.Ensure, key, defaultValue });

    return payload;
  }

  public async [Method.Remove]<Value = StoredValue>(payload: Payloads.Remove.ByHook<Value>): Promise<Payloads.Remove.ByHook<Value>>;
  public async [Method.Remove](payload: Payloads.Remove.ByValue): Promise<Payloads.Remove.ByValue>;

  @PreProvider()
  public async [Method.Remove]<Value = StoredValue>(payload: Payloads.Remove<Value>): Promise<Payloads.Remove<Value>> {
    const { key } = payload;
    const { defaultValue, ensureProperties } = this.context;

    if (ensureProperties) {
      const getPayload = await this.provider[Method.Get]({ method: Method.Get, key, path: [] });

      if (!isPayloadWithData(getPayload)) return payload;

      const { data } = getPayload;

      await this.provider[Method.Set]({ method: Method.Set, key, path: [], value: mergeDefault(defaultValue, data) });
    } else await this.provider[Method.Ensure]({ method: Method.Ensure, key, defaultValue });

    return payload;
  }

  @PreProvider()
  public async [Method.Set]<Value = StoredValue>(payload: Payloads.Set<Value>): Promise<Payloads.Set<Value>> {
    const { key } = payload;
    const { defaultValue, ensureProperties } = this.context;

    if (ensureProperties) {
      const getPayload = await this.provider[Method.Get]({ method: Method.Get, key, path: [] });

      if (!isPayloadWithData(getPayload)) return payload;

      const { data } = getPayload;

      await this.provider[Method.Set]({ method: Method.Set, key, path: [], value: mergeDefault(defaultValue, data) });
    } else await this.provider[Method.Ensure]({ method: Method.Ensure, key, defaultValue });

    return payload;
  }

  @PreProvider()
  public async [Method.SetMany](payload: Payloads.SetMany): Promise<Payloads.SetMany> {
    const { entries } = payload;
    const { defaultValue, ensureProperties } = this.context;

    for (const [{ key }] of entries) {
      if (ensureProperties) {
        const getPayload = await this.provider[Method.Get]({ method: Method.Get, key, path: [] });

        if (!isPayloadWithData(getPayload)) continue;

        const { data } = getPayload;

        await this.provider[Method.Set]({ method: Method.Set, key, path: [], value: mergeDefault(defaultValue, data) });
      } else await this.provider[Method.Ensure]({ method: Method.Ensure, key, defaultValue });
    }

    return payload;
  }

  @PreProvider()
  public async [Method.Update]<Value = StoredValue>(payload: Payloads.Update<StoredValue, Value>): Promise<Payloads.Update<StoredValue, Value>> {
    const { key } = payload;
    const { defaultValue, ensureProperties } = this.context;

    if (ensureProperties) {
      const getPayload = await this.provider[Method.Get]({ method: Method.Get, key, path: [] });

      if (!isPayloadWithData(getPayload)) return payload;

      const { data } = getPayload;

      await this.provider[Method.Set]({ method: Method.Set, key, path: [], value: mergeDefault(defaultValue, data) });
    } else await this.provider[Method.Ensure]({ method: Method.Ensure, key, defaultValue });

    return payload;
  }
}

export namespace AutoEnsureMiddleware {
  export interface ContextData<StoredValue = unknown> {
    /**
     * The default value to set if the key does not exist.
     * @since 1.0.0
     */
    defaultValue: StoredValue;

    /**
     * Whether to merge the {@link ContextData.defaultValue} with existing values.
     * @since 1.0.0
     */
    ensureProperties?: boolean;
  }
}
