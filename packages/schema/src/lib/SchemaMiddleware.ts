import { ApplyMiddlewareOptions, isPayloadWithData, JoshMiddleware, Method, Payloads, PostProvider, PreProvider } from '@joshdb/provider';
import type { BaseValidator } from '@sapphire/shapeshift';

@ApplyMiddlewareOptions({ name: 'schema' })
export class SchemaMiddleware<StoredValue = unknown> extends JoshMiddleware<SchemaMiddleware.ContextData<StoredValue>, StoredValue> {
  @PreProvider()
  public async [Method.Dec](payload: Payloads.Dec): Promise<Payloads.Dec> {
    const { key } = payload;
    const { schema } = this.context;
    const getPayload = await this.provider[Method.Get]({ method: Method.Get, errors: [], key, path: [] });

    if (!isPayloadWithData(getPayload)) return payload;

    const { data } = getPayload;

    try {
      schema.parse(data);
    } catch (error) {
      payload.errors.push(
        this.error({ identifier: SchemaMiddleware.Identifiers.InvalidData, method: Method.Dec, context: { shapeshiftError: error } })
      );

      return payload;
    }

    return payload;
  }

  @PostProvider()
  public [Method.Get]<Value = StoredValue>(payload: Payloads.Get<Value>): Payloads.Get<Value> {
    if (!isPayloadWithData(payload)) return payload;

    const { schema } = this.context;
    const { data } = payload;

    try {
      schema.parse(data);
    } catch (error) {
      payload.errors.push(
        this.error({ identifier: SchemaMiddleware.Identifiers.InvalidData, method: Method.Get, context: { shapeshiftError: error } })
      );

      return payload;
    }

    return payload;
  }

  @PostProvider()
  public [Method.GetMany](payload: Payloads.GetMany<StoredValue>): Payloads.GetMany<StoredValue> {
    if (!isPayloadWithData(payload)) return payload;

    const { schema } = this.context;
    const { data } = payload;

    for (const value of Object.values(data!)) {
      if (value !== null) {
        try {
          schema.parse(value);
        } catch (error) {
          payload.errors.push(
            this.error({ identifier: SchemaMiddleware.Identifiers.InvalidData, method: Method.GetMany, context: { shapeshiftError: error } })
          );

          return payload;
        }
      }
    }

    return payload;
  }

  @PreProvider()
  public async [Method.Inc](payload: Payloads.Inc): Promise<Payloads.Inc> {
    const { key } = payload;
    const { schema } = this.context;
    const getPayload = await this.provider[Method.Get]({ method: Method.Get, errors: [], key, path: [] });

    if (!isPayloadWithData(getPayload)) return payload;

    const { data } = getPayload;

    try {
      schema.parse(data);
    } catch (error) {
      payload.errors.push(
        this.error({ identifier: SchemaMiddleware.Identifiers.InvalidData, method: Method.Inc, context: { shapeshiftError: error } })
      );

      return payload;
    }

    return payload;
  }

  @PreProvider()
  public async [Method.Push]<Value>(payload: Payloads.Push<Value>): Promise<Payloads.Push<Value>> {
    const { key } = payload;
    const { schema } = this.context;
    const getPayload = await this.provider[Method.Get]({ method: Method.Get, errors: [], key, path: [] });

    if (!isPayloadWithData(getPayload)) return payload;

    const { data } = getPayload;

    try {
      schema.parse(data);
    } catch (error) {
      payload.errors.push(
        this.error({ identifier: SchemaMiddleware.Identifiers.InvalidData, method: Method.Push, context: { shapeshiftError: error } })
      );

      return payload;
    }

    return payload;
  }

  @PreProvider()
  public async [Method.Math](payload: Payloads.Math): Promise<Payloads.Math> {
    const { key } = payload;
    const { schema } = this.context;
    const getPayload = await this.provider[Method.Get]({ method: Method.Get, errors: [], key, path: [] });

    if (!isPayloadWithData(getPayload)) return payload;

    const { data } = getPayload;

    try {
      schema.parse(data);
    } catch (error) {
      payload.errors.push(
        this.error({ identifier: SchemaMiddleware.Identifiers.InvalidData, method: Method.Math, context: { shapeshiftError: error } })
      );

      return payload;
    }

    return payload;
  }

  public async [Method.Remove]<Value = StoredValue>(payload: Payloads.Remove.ByHook<Value>): Promise<Payloads.Remove.ByHook<Value>>;
  public async [Method.Remove](payload: Payloads.Remove.ByValue): Promise<Payloads.Remove.ByValue>;

  @PreProvider()
  public async [Method.Remove]<Value = StoredValue>(payload: Payloads.Remove<Value>): Promise<Payloads.Remove<Value>> {
    const { key } = payload;
    const { schema } = this.context;
    const getPayload = await this.provider[Method.Get]({ method: Method.Get, errors: [], key, path: [] });

    if (!isPayloadWithData(getPayload)) return payload;

    const { data } = getPayload;

    try {
      schema.parse(data);
    } catch (error) {
      payload.errors.push(
        this.error({ identifier: SchemaMiddleware.Identifiers.InvalidData, method: Method.Remove, context: { shapeshiftError: error } })
      );

      return payload;
    }

    return payload;
  }

  @PreProvider()
  public async [Method.Set]<Value = StoredValue>(payload: Payloads.Set<Value>): Promise<Payloads.Set<Value>> {
    const { key } = payload;
    const { schema } = this.context;
    const getPayload = await this.provider[Method.Get]({ method: Method.Get, errors: [], key, path: [] });

    if (!isPayloadWithData(getPayload)) return payload;

    const { data } = getPayload;

    try {
      schema.parse(data);
    } catch (error) {
      payload.errors.push(
        this.error({ identifier: SchemaMiddleware.Identifiers.InvalidData, method: Method.Set, context: { shapeshiftError: error } })
      );

      return payload;
    }

    return payload;
  }

  @PreProvider()
  public async [Method.SetMany](payload: Payloads.SetMany): Promise<Payloads.SetMany> {
    const { entries } = payload;
    const { schema } = this.context;

    for (const { key, value } of entries) {
      const getPayload = await this.provider[Method.Get]({ method: Method.Get, errors: [], key, path: [] });

      if (!isPayloadWithData(getPayload)) continue;

      const { data } = getPayload;

      try {
        schema.parse(data);
      } catch (error) {
        payload.errors.push(
          this.error({ identifier: SchemaMiddleware.Identifiers.InvalidData, method: Method.SetMany, context: { shapeshiftError: error } })
        );

        return payload;
      }

      try {
        schema.parse(value);
      } catch (error) {
        payload.errors.push(
          this.error({ identifier: SchemaMiddleware.Identifiers.InvalidValue, method: Method.SetMany, context: { shapeshiftError: error } })
        );

        return payload;
      }
    }

    return payload;
  }

  @PreProvider()
  public async [Method.Update]<Value = StoredValue>(payload: Payloads.Update<StoredValue, Value>): Promise<Payloads.Update<StoredValue, Value>> {
    const { key } = payload;
    const { schema } = this.context;
    const getPayload = await this.provider[Method.Get]({ method: Method.Get, errors: [], key, path: [] });

    if (!isPayloadWithData(getPayload)) return payload;

    const { data } = getPayload;

    try {
      schema.parse(data);
    } catch (error) {
      payload.errors.push(
        this.error({ identifier: SchemaMiddleware.Identifiers.InvalidData, method: Method.Update, context: { shapeshiftError: error } })
      );

      return payload;
    }

    return payload;
  }
}

export namespace SchemaMiddleware {
  export interface ContextData<StoredValue = unknown> {
    /**
     * The schema used to parse and validate data.
     * @since 1.0.0
     */
    schema: BaseValidator<StoredValue>;
  }

  export enum Identifiers {
    InvalidData = 'invalidData',

    InvalidValue = 'invalidValue'
  }
}
