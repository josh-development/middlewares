import { MapProvider } from '@joshdb/map';
import { JoshMiddlewareStore, MathOperator, Method, Payload } from '@joshdb/provider';
import { CacheMiddleware } from '../../src';

import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

const delay = async (t: number) => {
  await new Promise((r) => setTimeout(r, t));
};

describe('CacheMiddleware', () => {
  describe('is a class', () => {
    test('GIVEN typeof CacheMiddleware THEN returns function', () => {
      expect(typeof CacheMiddleware).toBe('function');
    });

    test('GIVEN typeof ...prototype THEN returns object', () => {
      expect(typeof CacheMiddleware.prototype).toBe('object');
    });
  });

  describe('can poll', () => {
    const store = new JoshMiddlewareStore({ provider: new MapProvider() });
    const cache = new CacheMiddleware<unknown>({
      provider: new MapProvider(),
      polling: {}
    });

    beforeAll(async () => {
      await cache.init(store);
    });

    test('GIVEN cache w/o data THEN fetches version', async () => {
      expect(await cache.fetchVersion()).toBeTypeOf('object');
    });

    test('GIVEN cache w/ data THEN fetches version', async () => {
      await cache[Method.Set]({ method: Method.Set, key: 'test', value: 'test', path: [], errors: [] });
      expect(await cache.fetchVersion()).toBeTypeOf('object');
    });
  });

  describe('can poll', () => {
    const store = new JoshMiddlewareStore({ provider: new MapProvider() });
    const cache = new CacheMiddleware<unknown>({
      provider: new MapProvider(),
      polling: {}
    });

    beforeAll(async () => {
      await cache.init(store);
    });

    test('GIVEN polling enabled THEN starts polling', () => {
      expect(cache.pollingInterval).toBeDefined();
    });

    afterAll(() => {
      clearInterval(cache.pollingInterval);
    });
  });

  describe('GIVEN polling THEN can catch exit', () => {
    const store = new JoshMiddlewareStore({ provider: new MapProvider() });
    const cache = new CacheMiddleware<unknown>({
      provider: new MapProvider(),
      polling: {}
    });

    beforeAll(async () => {
      await cache.init(store);
    });

    test('GIVEN polling enabled THEN starts polling', () => {
      expect(cache.pollingInterval).toBeDefined();

      const exitFn = vi.spyOn(process, 'exit').mockImplementationOnce(() => true as never);

      process.emit('SIGINT');
      expect(cache.pollingInterval).toBeUndefined();
      expect(exitFn).toBeCalledTimes(1);
    });

    afterAll(() => {
      clearInterval(cache.pollingInterval);
    });
  });

  describe('can fetchAll', () => {
    const store = new JoshMiddlewareStore({ provider: new MapProvider() });
    const cache = new CacheMiddleware<unknown>({
      provider: new MapProvider()
    });

    test('GIVEN fetchAll enabled THEN cache is populated', async () => {
      await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
      await cache.init(store);

      const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', path: [], errors: [] });

      expect(data).toEqual('value');
    });
  });

  describe('can fetchAll nothing', () => {
    const store = new JoshMiddlewareStore({ provider: new MapProvider() });
    const cache = new CacheMiddleware<unknown>({
      provider: new MapProvider()
    });

    test('GIVEN fetchAll enabled THEN cache is populated', async () => {
      await cache.init(store);

      const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', path: [], errors: [] });

      expect(data).toEqual(undefined);
    });
  });

  describe('can ttl', () => {
    const store = new JoshMiddlewareStore({ provider: new MapProvider() });
    const cache = new CacheMiddleware<unknown>({ provider: new MapProvider(), ttl: { timeout: 100 } });

    beforeAll(async () => {
      await cache.init(store);
    });

    test('GIVEN ttl enabled w/ data THEN returns data', async () => {
      await cache[Method.Set]({ key: 'test:ttl', value: 123, method: Method.Set, path: [], errors: [] });

      const { data } = await cache[Method.Get]({ key: 'test:ttl', method: Method.Get, path: [], errors: [] });

      expect(data).toBe(123);
    });

    test('GIVEN ttl enabled w/o ttl timeout THEN returns data', async () => {
      const noTimeoutCache = new CacheMiddleware<unknown>({ provider: new MapProvider(), ttl: {} });

      await noTimeoutCache.init(store);
      await noTimeoutCache[Method.Set]({ key: 'test:ttl', value: 123, method: Method.Set, path: [], errors: [] });

      await delay(1100);

      const { data } = await noTimeoutCache[Method.Get]({ key: 'test:ttl', method: Method.Get, path: [], errors: [] });

      expect(data).toBe(undefined);
    });

    test('GIVEN ttl enabled w/ expired data THEN returns empty after timeout', async () => {
      await cache[Method.Set]({ key: 'test:ttl', value: 123, method: Method.Set, path: [], errors: [] });

      await delay(200);

      const { data } = await cache[Method.Get]({ key: 'test:ttl', method: Method.Get, path: [], errors: [] });

      expect(data).toBe(undefined);
    });
  });

  describe('can manipulate data', () => {
    const store = new JoshMiddlewareStore({ provider: new MapProvider() });
    const cache = new CacheMiddleware<unknown>({ provider: new MapProvider(), ttl: { timeout: 100 } });

    beforeAll(async () => {
      await cache.init(store);
    });

    beforeEach(async () => {
      await store.provider[Method.Clear]({ method: Method.Clear, errors: [] });
      await cache[Method.Clear]({ method: Method.Clear, errors: [] });
    });

    describe(Method.Get, () => {
      test('GIVEN cache w/ data THEN it is cached', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

        const { data: cachedValue } = await cache[Method.Get]({ method: Method.Get, key: 'key', path: [], errors: [] });

        expect(cachedValue).toBe('value');
      });

      test('GIVEN cache w/o data THEN it is not cached', async () => {
        const { data: cachedValue } = await cache[Method.Get]({ method: Method.Get, key: 'key', path: [], errors: [] });

        expect(cachedValue).toBe(undefined);
      });
    });

    describe(Method.Each, () => {
      test('GIVEN cache w/ data THEN it is iterated', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

        const values: unknown[] = [];
        const cb = vi.fn((value) => values.push(value));

        await cache[Method.Each]({ method: Method.Each, hook: cb, errors: [] });
        expect(cb).toBeCalledTimes(1);

        expect(values).toEqual(['value']);
      });

      test('GIVEN cache w/o data THEN it is not iterated', async () => {
        const values: unknown[] = [];
        const cb = vi.fn((value) => values.push(value));

        await cache[Method.Each]({ method: Method.Each, hook: cb, errors: [] });
        expect(cb).toBeCalledTimes(0);

        expect(values).toEqual([]);
      });

      test('GIVEN cache w/ expired data AND provider w/o data THEN it is not iterated', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
        await delay(200);

        const values: unknown[] = [];
        const cb = vi.fn((value) => values.push(value));

        await cache[Method.Each]({ method: Method.Each, hook: cb, errors: [] });
        expect(cb).toBeCalledTimes(0);

        expect(values).toEqual([]);
      });

      test('GIVEN cache w/ expired data AND provider w/ data THEN it is iterated', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
        await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [], errors: [] });
        await delay(200);

        const values: unknown[] = [];
        const cb = vi.fn((value) => values.push(value));

        await cache[Method.Each]({ method: Method.Each, hook: cb, errors: [] });
        expect(cb).toBeCalledTimes(1);

        expect(values).toEqual(['stored']);
      });
    });

    describe(Method.Has, () => {
      test('GIVEN cache w/ data THEN returns true', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

        const { data: hasValue } = await cache[Method.Has]({ method: Method.Has, key: 'key', path: [], errors: [] });

        expect(hasValue).toBe(true);
      });
    });

    describe(Method.Entries, () => {
      test('GIVEN cache w/ data THEN returns data object', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

        const { data } = await cache[Method.Entries]({ method: Method.Entries, errors: [] });

        expect(data).toEqual({ key: 'value' });
      });

      test('GIVEN cache w/o data THEN returns empty object', async () => {
        const { data } = await cache[Method.Entries]({ method: Method.Entries, errors: [] });

        expect(data).toEqual({});
      });

      test('GIVEN cache w/ expired data AND provider w/o data THEN it returns empty object', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
        await delay(200);

        const { data } = await cache[Method.Entries]({ method: Method.Entries, errors: [] });

        expect(data).toEqual({});
      });

      test('GIVEN cache w/ expired data AND provider w/ data THEN it is iterated', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
        await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [], errors: [] });
        await delay(200);

        const { data } = await cache[Method.Entries]({ method: Method.Entries, errors: [] });

        expect(data).toEqual({ key: 'stored' });
      });
    });

    describe(Method.Every, () => {
      describe(Payload.Type.Hook.toString().toString(), () => {
        test('GIVEN cache w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

          const values: unknown[] = [];
          const cb = vi.fn((value) => {
            values.push(value);
            return true;
          });

          const { data } = await cache[Method.Every]({ method: Method.Every, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(cb).toBeCalledTimes(1);

          expect(values).toEqual(['value']);
          expect(data).toBe(true);
        });

        test('GIVEN cache w/o data THEN it is not iterated', async () => {
          const values: unknown[] = [];
          const cb = vi.fn((value) => {
            values.push(value);
            return false;
          });

          const { data } = await cache[Method.Every]({ method: Method.Every, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(cb).toBeCalledTimes(0);

          expect(values).toEqual([]);
          expect(data).toBe(true);
        });

        test('GIVEN cache w/ expired data AND provider w/o data THEN it is not iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await delay(200);

          const values: unknown[] = [];
          const cb = vi.fn((value) => {
            values.push(value);
            return false;
          });

          const { data } = await cache[Method.Every]({ method: Method.Every, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(cb).toBeCalledTimes(0);

          expect(values).toEqual([]);
          expect(data).toBe(true);
        });

        test('GIVEN cache w/ expired data AND provider w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [], errors: [] });
          await delay(200);

          const values: unknown[] = [];
          const cb = vi.fn((value) => {
            values.push(value);
            return false;
          });

          const { data } = await cache[Method.Every]({ method: Method.Every, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(cb).toBeCalledTimes(1);

          expect(values).toEqual(['stored']);
          expect(data).toBe(false);
        });
      });

      describe(Payload.Type.Value.toString(), () => {
        test('GIVEN cache w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

          const { data } = await cache[Method.Every]({ method: Method.Every, value: 'value', path: [], type: Payload.Type.Value, errors: [] });

          expect(data).toBe(true);
        });

        test('GIVEN cache w/o data THEN it is not iterated', async () => {
          const { data } = await cache[Method.Every]({ method: Method.Every, value: 'value', path: [], type: Payload.Type.Value, errors: [] });

          expect(data).toBe(true);
        });

        test('GIVEN cache w/ expired data AND provider w/o data THEN it is not iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await delay(200);

          const { data } = await cache[Method.Every]({ method: Method.Every, value: 'value', path: [], type: Payload.Type.Value, errors: [] });

          expect(data).toBe(true);
        });

        test('GIVEN cache w/ expired data AND provider w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [], errors: [] });
          await delay(200);

          const { data } = await cache[Method.Every]({ method: Method.Every, value: 'value', path: [], type: Payload.Type.Value, errors: [] });

          expect(data).toBe(false);
        });
      });
    });

    describe(Method.Filter, () => {
      describe(Payload.Type.Hook.toString(), () => {
        test('GIVEN cache w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

          const values: unknown[] = [];
          const cb = vi.fn((value) => {
            values.push(value);
            return true;
          });

          const { data } = await cache[Method.Filter]({ method: Method.Filter, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(values).toEqual(['value']);
          expect(data).toEqual({ key: 'value' });
        });

        test('GIVEN cache w/o data THEN it is not iterated', async () => {
          const values: unknown[] = [];
          const cb = vi.fn((value) => {
            values.push(value);
            return false;
          });

          const { data } = await cache[Method.Filter]({ method: Method.Filter, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(values).toEqual([]);
          expect(data).toEqual({});
        });

        test('GIVEN cache w/ expired data AND provider w/o data THEN it is not iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await delay(200);

          const values: unknown[] = [];
          const cb = vi.fn((value) => {
            values.push(value);
            return true;
          });

          const { data } = await cache[Method.Filter]({ method: Method.Filter, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(values).toEqual([]);
          expect(data).toEqual({});
        });

        test('GIVEN cache w/ expired data AND provider w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [], errors: [] });
          await delay(200);

          const values: unknown[] = [];
          const cb = vi.fn((value) => {
            values.push(value);
            return true;
          });

          const { data } = await cache[Method.Filter]({ method: Method.Filter, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(values).toEqual(['stored']);
          expect(data).toEqual({ key: 'stored' });
        });
      });

      describe(Payload.Type.Value.toString(), () => {
        test('GIVEN cache w/ data THEN it is filtered', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

          const { data } = await cache[Method.Filter]({ method: Method.Filter, value: 'value', path: [], type: Payload.Type.Value, errors: [] });

          expect(data).toEqual({ key: 'value' });
        });

        test('GIVEN cache w/ data w/ path THEN it is filtered', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: { foo: 'bar' }, path: [], errors: [] });

          const { data } = await cache[Method.Filter]({ method: Method.Filter, value: 'bar', path: ['foo'], type: Payload.Type.Value, errors: [] });

          expect(data).toEqual({ key: { foo: 'bar' } });
        });

        test('GIVEN cache w/o data THEN it is not iterated', async () => {
          const { data } = await cache[Method.Filter]({ method: Method.Filter, value: 'value', path: [], type: Payload.Type.Value, errors: [] });

          expect(data).toEqual({});
        });

        test('GIVEN cache w/ expired data AND provider w/o data THEN it is not iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await delay(200);

          const { data } = await cache[Method.Filter]({ method: Method.Filter, value: 'value', path: [], type: Payload.Type.Value, errors: [] });

          expect(data).toEqual({});
        });

        test('GIVEN cache w/ expired data AND provider w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [], errors: [] });
          await delay(200);

          const { data } = await cache[Method.Filter]({ method: Method.Filter, value: 'value', path: [], type: Payload.Type.Value, errors: [] });

          expect(data).toEqual({ key: 'stored' });
        });
      });
    });

    describe(Method.Find, () => {
      describe(Payload.Type.Hook.toString(), () => {
        test('GIVEN cache w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

          const values: unknown[] = [];
          const cb = vi.fn((value) => {
            values.push(value);
            return true;
          });

          const { data } = await cache[Method.Find]({ method: Method.Find, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(values).toEqual(['value']);
          expect(data).toEqual(['key', 'value']);
        });

        test('GIVEN cache w/o data THEN it is not iterated', async () => {
          const values: unknown[] = [];
          const cb = vi.fn((value) => {
            values.push(value);
            return false;
          });

          const { data } = await cache[Method.Find]({ method: Method.Find, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(values).toEqual([]);
          expect(data).toBe(undefined);
        });

        test('GIVEN cache w/ expired data AND provider w/o data THEN it is not iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await delay(200);

          const values: unknown[] = [];
          const cb = vi.fn((value) => {
            values.push(value);
            return true;
          });

          const { data } = await cache[Method.Find]({ method: Method.Find, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(values).toEqual([]);
          expect(data).toBe(undefined);
        });

        test('GIVEN cache w/ expired data AND provider w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [], errors: [] });
          await delay(200);

          const values: unknown[] = [];
          const cb = vi.fn((value) => {
            values.push(value);
            return true;
          });

          const { data } = await cache[Method.Find]({ method: Method.Find, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(values).toEqual(['stored']);
          expect(data).toEqual(['key', 'stored']);
        });
      });

      describe(Payload.Type.Value.toString(), () => {
        test('GIVEN cache w/ data THEN it is filtered', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

          const { data } = await cache[Method.Find]({ method: Method.Find, value: 'value', path: [], type: Payload.Type.Value, errors: [] });

          expect(data).toEqual(['key', 'value']);
        });

        test('GIVEN cache w/ data w/ path THEN it is filtered', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: { foo: 'bar' }, path: [], errors: [] });

          const { data } = await cache[Method.Find]({ method: Method.Find, value: 'bar', path: ['foo'], type: Payload.Type.Value, errors: [] });

          expect(data).toEqual(['key', { foo: 'bar' }]);
        });

        test('GIVEN cache w/o data THEN it is not iterated', async () => {
          const { data } = await cache[Method.Find]({ method: Method.Find, value: 'value', path: [], type: Payload.Type.Value, errors: [] });

          expect(data).toBe(undefined);
        });

        test('GIVEN cache w/ expired data AND provider w/o data THEN it is not iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await delay(200);

          const { data } = await cache[Method.Find]({ method: Method.Find, value: 'value', path: [], type: Payload.Type.Value, errors: [] });

          expect(data).toBe(undefined);
        });

        test('GIVEN cache w/ expired data AND provider w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [], errors: [] });
          await delay(200);

          const { data } = await cache[Method.Find]({ method: Method.Find, value: 'value', path: [], type: Payload.Type.Value, errors: [] });

          expect(data).toEqual(['key', 'stored']);
        });
      });
    });

    describe(Method.Keys, () => {
      test('GIVEN cache w/o data THEN no keys are returned', async () => {
        const { data } = await cache[Method.Keys]({ method: Method.Keys, errors: [] });

        expect(data).toEqual([]);
      });

      test('GIVEN provider w/ data THEN keys are returned', async () => {
        await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

        const { data } = await cache[Method.Keys]({ method: Method.Keys, errors: [] });

        expect(data).toEqual(['key']);
      });
    });

    describe(Method.Values, () => {
      test('GIVEN cache w/o data THEN no values are returned', async () => {
        const { data } = await cache[Method.Values]({ method: Method.Values, errors: [] });

        expect(data).toEqual([]);
      });

      test('GIVEN provider w/ data THEN values are returned', async () => {
        await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

        const { data } = await cache[Method.Values]({ method: Method.Values, errors: [] });

        expect(data).toEqual(['value']);
      });
    });

    describe(Method.Map, () => {
      describe(Payload.Type.Hook.toString(), () => {
        test('GIVEN cache w/ data THEN it is mapped', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

          const cb = vi.fn((value) => {
            return value;
          });

          const { data: values } = await cache[Method.Map]({ method: Method.Map, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(values).toEqual(['value']);
        });

        test('GIVEN cache w/o data THEN it is not iterated', async () => {
          const cb = vi.fn((value) => {
            return value;
          });

          const { data: values } = await cache[Method.Map]({ method: Method.Map, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(values).toEqual([]);
        });

        test('GIVEN cache w/ expired data AND provider w/o data THEN it is not iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await delay(200);

          const cb = vi.fn((value) => {
            return value;
          });

          const { data: values } = await cache[Method.Map]({ method: Method.Map, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(values).toEqual([]);
        });

        test('GIVEN cache w/ expired data AND provider w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [], errors: [] });
          await delay(200);

          const cb = vi.fn((value) => {
            return value;
          });

          const { data: values } = await cache[Method.Map]({ method: Method.Map, hook: cb, type: Payload.Type.Hook, errors: [] });

          expect(values).toEqual(['stored']);
        });
      });

      describe(Payload.Type.Value.toString(), () => {
        test('GIVEN cache w/ data THEN it is mapped', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

          const { data } = await cache[Method.Map]({ method: Method.Map, path: [], type: Payload.Type.Path, errors: [] });

          expect(data).toEqual(['value']);
        });

        test('GIVEN cache w/ data w/ path THEN it is filtered', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: { foo: 'bar' }, path: [], errors: [] });

          const { data } = await cache[Method.Map]({ method: Method.Map, path: ['foo'], type: Payload.Type.Path, errors: [] });

          expect(data).toEqual(['bar']);
        });

        test('GIVEN cache w/o data THEN it is not iterated', async () => {
          const { data } = await cache[Method.Map]({ method: Method.Map, path: [], type: Payload.Type.Path, errors: [] });

          expect(data).toEqual([]);
        });

        test('GIVEN cache w/ expired data AND provider w/o data THEN it is not iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await delay(200);

          const { data } = await cache[Method.Map]({ method: Method.Map, path: [], type: Payload.Type.Path, errors: [] });

          expect(data).toEqual([]);
        });

        test('GIVEN cache w/ expired data AND provider w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
          await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [], errors: [] });
          await delay(200);

          const { data } = await cache[Method.Map]({ method: Method.Map, path: [], type: Payload.Type.Path, errors: [] });

          expect(data).toEqual(['stored']);
        });
      });
    });

    describe(Method.GetMany, () => {
      test('GIVEN cache w/o data THEN no values are returned', async () => {
        const { data } = await cache[Method.GetMany]({ method: Method.GetMany, keys: ['key'], errors: [] });

        expect(data).toEqual({});
      });

      test('GIVEN cache w/o data and provider w/ data THEN value returned', async () => {
        await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

        const { data } = await cache[Method.GetMany]({ method: Method.GetMany, keys: ['key'], errors: [] });

        expect(data).toEqual({ key: 'value' });
      });

      test('GIVEN cache w/ data THEN values are returned', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

        const { data } = await cache[Method.GetMany]({ method: Method.GetMany, keys: ['key'], errors: [] });

        expect(data).toEqual({ key: 'value' });
      });

      test('GIVEN cache w/ expired data AND provider w/o data THEN no values are returned', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
        await delay(200);

        const { data } = await cache[Method.GetMany]({ method: Method.GetMany, keys: ['key'], errors: [] });

        expect(data).toEqual({});
      });

      test('GIVEN cache w/ expired data AND provider w/ data THEN values are returned', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });
        await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [], errors: [] });
        await delay(200);

        const { data } = await cache[Method.GetMany]({ method: Method.GetMany, keys: ['key'], errors: [] });

        expect(data).toEqual({ key: 'stored' });
      });
    });

    describe(Method.SetMany, () => {
      test('GIVEN cache w/o data THEN data is set', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key2', value: {}, path: [], errors: [] }); // https://github.com/josh-development/providers/issues/154
        await cache[Method.SetMany]({
          method: Method.SetMany,
          entries: [
            { key: 'key', value: 'value', path: [] },
            { key: 'key2', value: 'value', path: ['test'] }
          ],
          overwrite: true,
          errors: []
        });

        const { data } = await cache[Method.Entries]({ method: Method.GetMany, errors: [] });

        expect(data).toEqual({ key2: { test: 'value' }, key: 'value' });
      });
    });

    describe(Method.Inc, () => {
      test('GIVEN cache w/ data and provider w/o data THEN value is incremented', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 0, path: [], errors: [] });

        await cache[Method.Inc]({ method: Method.Inc, key: 'key', errors: [], path: [] });

        const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', errors: [], path: [] });

        expect(data).toEqual(1);
      });
    });

    describe(Method.Dec, () => {
      test('GIVEN cache w/ data and provider w/o data THEN value is decremented', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 0, path: [], errors: [] });

        await cache[Method.Dec]({ method: Method.Dec, key: 'key', errors: [], path: [] });

        const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', errors: [], path: [] });

        expect(data).toEqual(-1);
      });
    });

    describe(Method.Delete, () => {
      test('GIVEN cache w/o data and provider w/o data THEN nothing happens', async () => {
        await cache[Method.Delete]({ method: Method.Delete, key: 'key', path: ['foo'], errors: [] });

        const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', errors: [], path: [] });

        expect(data).toEqual(undefined);
      });

      test('GIVEN cache w/ data and provider w/o data THEN value is removed at path', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: { foo: 'bar' }, path: [], errors: [] });

        await cache[Method.Delete]({ method: Method.Delete, key: 'key', path: ['foo'], errors: [] });

        const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', errors: [], path: [] });

        expect(data).toEqual({});
      });

      test('GIVEN cache w/ data and provider w/o data THEN document is removed', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: { foo: 'bar' }, path: [], errors: [] });

        await cache[Method.Delete]({ method: Method.Delete, key: 'key', path: [], errors: [] });

        const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', errors: [], path: [] });

        expect(data).toEqual(undefined);
      });
    });

    describe(Method.DeleteMany, () => {
      test('GIVEN cache w/ data and provider w/o data THEN keys are deleted', async () => {
        await cache[Method.SetMany]({
          method: Method.SetMany,
          entries: [
            { key: 'key', value: 'value', path: [] },
            { key: 'key2', value: 'value', path: [] }
          ],
          overwrite: true,
          errors: []
        });

        await cache[Method.DeleteMany]({ method: Method.DeleteMany, keys: ['key', 'key2'], errors: [] });

        const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', errors: [], path: [] });
        const { data: data2 } = await cache[Method.Get]({ method: Method.Get, key: 'key2', errors: [], path: [] });

        expect(data).toEqual(undefined);
        expect(data2).toEqual(undefined);
      });
    });

    describe(Method.Push, () => {
      test('GIVEN cache w/o data and provider w/o data THEN returns undefined with errors', async () => {
        const { errors } = await cache[Method.Push]({
          method: Method.Push,
          key: 'key',
          value: 'value',
          path: [],
          errors: []
        });

        const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', errors: [], path: [] });

        expect(errors.length).toBe(1);
        expect(data).toEqual(undefined);
      });

      test('GIVEN cache w/ data and provider w/o data THEN array is set and pushed', async () => {
        await cache[Method.Set]({
          method: Method.Set,
          key: 'key',
          value: [],
          path: [],
          errors: []
        });

        await cache[Method.Push]({
          method: Method.Push,
          key: 'key',
          value: 'value',
          path: [],
          errors: []
        });

        const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', errors: [], path: [] });

        expect(data).toEqual(['value']);
      });
    });

    describe(Method.Math, () => {
      test('GIVEN cache w/o data and provider w/o data THEN array is set and pushed', async () => {
        const { errors } = await cache[Method.Math]({
          method: Method.Math,
          key: 'key',
          operand: 1,
          operator: MathOperator.Addition,
          path: [],
          errors: []
        });

        const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', errors: [], path: [] });

        expect(errors.length).toBe(1);
        expect(data).toEqual(undefined);
      });

      test('GIVEN cache w/ data and provider w/o data THEN math succeeds', async () => {
        await cache[Method.Set]({
          method: Method.Set,
          key: 'key',
          value: 1,
          path: [],
          errors: []
        });

        await cache[Method.Math]({
          method: Method.Math,
          key: 'key',
          operand: 1,
          operator: MathOperator.Addition,
          path: [],
          errors: []
        });

        const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', errors: [], path: [] });

        expect(data).toEqual(2);
      });
    });

    describe(Method.Remove, () => {
      describe(Payload.Type.Hook.toString(), () => {
        test('GIVEN cache w/ data THEN it is removed', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: ['value'], path: [], errors: [] });

          const cb = vi.fn((value) => {
            return value === 'value';
          });

          await cache[Method.Remove]({
            key: 'key',
            path: [],
            method: Method.Remove,
            hook: cb,
            type: Payload.Type.Hook,
            errors: []
          });

          const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', errors: [], path: [] });

          expect(data).toEqual([]);
        });

        test('GIVEN cache w/o data THEN it ignores', async () => {
          const cb = vi.fn(() => {
            return true;
          });

          await cache[Method.Remove]({
            key: 'key',
            method: Method.Remove,
            hook: cb,
            type: Payload.Type.Hook,
            path: [],
            errors: []
          });

          expect(cb).toBeCalledTimes(0);
        });

        test('GIVEN cache w/ expired data AND provider w/o data THEN it is not iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: ['value'], path: [], errors: [] });
          await delay(200);

          const cb = vi.fn(() => {
            return true;
          });

          await cache[Method.Remove]({
            key: 'key',
            method: Method.Remove,
            hook: cb,
            type: Payload.Type.Hook,
            path: [],
            errors: []
          });

          expect(cb).toBeCalledTimes(0);
        });
      });

      describe(Payload.Type.Value.toString(), () => {
        test('GIVEN cache w/ data THEN it is removed', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: ['value'], path: [], errors: [] });

          await cache[Method.Remove]({ key: 'key', method: Method.Remove, value: 'value', path: [], type: Payload.Type.Value, errors: [] });

          const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', errors: [], path: [] });

          expect(data).toEqual([]);
        });

        test('GIVEN cache w/ data w/ path THEN it is removed', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: { foo: ['bar'] }, path: [], errors: [] });

          await cache[Method.Remove]({ key: 'key', method: Method.Remove, value: 'bar', path: ['foo'], type: Payload.Type.Value, errors: [] });

          const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', errors: [], path: [] });

          expect((data as { foo: string[] }).foo).toEqual([]);
        });

        test('GIVEN cache w/ expired data AND provider w/o data THEN it is not iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: ['value'], path: [], errors: [] });
          await delay(200);

          const { errors } = await cache[Method.Remove]({
            key: 'key',
            method: Method.Remove,
            value: 'value',
            path: [],
            type: Payload.Type.Value,
            errors: []
          });

          expect(errors.length).toBe(0);
        });
      });
    });

    describe(Method.Update, () => {
      test("GIVEN cache w/ data THEN it's updated", async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [], errors: [] });

        await cache[Method.Update]<string>({
          method: Method.Update,
          key: 'key',
          hook: (value) => (value as string).toUpperCase(),
          errors: []
        });

        const { data } = await cache[Method.Get]({ method: Method.Get, key: 'key', errors: [], path: [] });

        expect(data).toEqual('VALUE');
      });
    });
  });
});
