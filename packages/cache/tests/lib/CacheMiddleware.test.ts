import { MapProvider } from '@joshdb/map';
import { Method, MiddlewareStore, Payload } from '@joshdb/middleware';
import { CacheMiddleware } from '../../src';

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
    // @ts-expect-error 2322
    const store = new MiddlewareStore({ provider: new MapProvider() });
    const cache = new CacheMiddleware<unknown>({
      // @ts-expect-error 2322
      provider: new MapProvider(),
      polling: {
        enabled: true
      }
    });

    beforeAll(async () => {
      // @ts-expect-error 2345
      await cache.init(store);
    });

    test('GIVEN polling enabled THEN starts polling', () => {
      expect(cache.pollingInterval).toBeDefined();
    });

    afterAll(() => {
      clearInterval(cache.pollingInterval);
    });
  });

  describe('can ttl', () => {
    const provider = new MapProvider();
    // @ts-expect-error 2322
    const store = new MiddlewareStore({ provider: new MapProvider() });
    const cache = new CacheMiddleware<unknown>({
      // @ts-expect-error 2322
      provider,
      ttl: {
        enabled: true,
        timeout: 500
      }
    });

    beforeAll(async () => {
      // @ts-expect-error 2345
      await cache.init(store);
    });

    test('GIVEN ttl enabled w/ data THEN returns data', async () => {
      await cache[Method.Set]({ key: 'test:ttl', value: 123, method: Method.Set, path: [] });
      const { data } = await cache[Method.Get]({ key: 'test:ttl', method: Method.Get, path: [] });
      expect(data).toBe(123);
    });

    test('GIVEN ttl enabled w/ expired data THEN returns empty after timeout', async () => {
      await cache[Method.Set]({ key: 'test:ttl', value: 123, method: Method.Set, path: [] });

      await delay(600);
      const { data } = await cache[Method.Get]({ key: 'test:ttl', method: Method.Get, path: [] });
      expect(data).toBe(undefined);
    });
  });

  describe('can manipulate data', () => {
    // @ts-expect-error 2322
    const store = new MiddlewareStore({ provider: new MapProvider() });
    // @ts-expect-error 2322
    const cache = new CacheMiddleware<unknown>({ provider: new MapProvider(), ttl: { enabled: true, timeout: 500 } });

    beforeAll(async () => {
      // @ts-expect-error 2345
      await cache.init(store);
    });

    beforeEach(async () => {
      await store.provider[Method.Clear]({ method: Method.Clear });
      await cache[Method.Clear]({ method: Method.Clear });
    });

    describe(Method.Get, () => {
      test('GIVEN cache w/ data THEN it is cached', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [] });
        const { data: cachedValue } = await cache[Method.Get]({ method: Method.Get, key: 'key', path: [] });

        expect(cachedValue).toBe('value');
      });

      test('GIVEN cache w/o data THEN it is not cached', async () => {
        const { data: cachedValue } = await cache[Method.Get]({ method: Method.Get, key: 'key', path: [] });

        expect(cachedValue).toBe(undefined);
      });
    });

    describe(Method.Each, () => {
      test('GIVEN cache w/ data THEN it is iterated', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [] });
        const values: unknown[] = [];
        const cb = jest.fn((value) => values.push(value));
        await cache[Method.Each]({ method: Method.Each, hook: cb });
        expect(cb).toBeCalledTimes(1);

        expect(values).toEqual(['value']);
      });

      test('GIVEN cache w/o data THEN it is not iterated', async () => {
        const values: unknown[] = [];
        const cb = jest.fn((value) => values.push(value));
        await cache[Method.Each]({ method: Method.Each, hook: cb });
        expect(cb).toBeCalledTimes(0);

        expect(values).toEqual([]);
      });

      test('GIVEN cache w/ expired data AND provider w/o data THEN it is not iterated', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [] });
        await delay(600);
        const values: unknown[] = [];
        const cb = jest.fn((value) => values.push(value));
        await cache[Method.Each]({ method: Method.Each, hook: cb });
        expect(cb).toBeCalledTimes(0);

        expect(values).toEqual([]);
      });

      test('GIVEN cache w/ expired data AND provider w/ data THEN it is iterated', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [] });
        await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [] });
        await delay(600);
        const values: unknown[] = [];
        const cb = jest.fn((value) => values.push(value));
        await cache[Method.Each]({ method: Method.Each, hook: cb });
        expect(cb).toBeCalledTimes(1);

        expect(values).toEqual(['stored']);
      });
    });

    describe(Method.Entries, () => {
      test('GIVEN cache w/ data THEN returns data object', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [] });

        const { data } = await cache[Method.Entries]({ method: Method.Entries });
        expect(data).toEqual({ key: 'value' });
      });

      test('GIVEN cache w/o data THEN returns empty object', async () => {
        const { data } = await cache[Method.Entries]({ method: Method.Entries });
        expect(data).toEqual({});
      });

      test('GIVEN cache w/ expired data AND provider w/o data THEN it returns empty object', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [] });
        await delay(600);

        const { data } = await cache[Method.Entries]({ method: Method.Entries });
        expect(data).toEqual({});
      });

      test('GIVEN cache w/ expired data AND provider w/ data THEN it is iterated', async () => {
        await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [] });
        await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [] });
        await delay(600);

        const { data } = await cache[Method.Entries]({ method: Method.Entries });
        expect(data).toEqual({ key: 'stored' });
      });
    });

    describe(Method.Every, () => {
      describe(Payload.Type.Hook, () => {
        test('GIVEN cache w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [] });
          const values: unknown[] = [];
          const cb = jest.fn((value) => {
            values.push(value);
            return true;
          });

          const { data } = await cache[Method.Every]({ method: Method.Every, hook: cb, type: Payload.Type.Hook });
          expect(cb).toBeCalledTimes(1);

          expect(values).toEqual(['value']);
          expect(data).toBe(true);
        });

        test('GIVEN cache w/o data THEN it is not iterated', async () => {
          const values: unknown[] = [];
          const cb = jest.fn((value) => {
            values.push(value);
            return false;
          });

          const { data } = await cache[Method.Every]({ method: Method.Every, hook: cb, type: Payload.Type.Hook });
          expect(cb).toBeCalledTimes(0);

          expect(values).toEqual([]);
          expect(data).toBe(true);
        });

        test('GIVEN cache w/ expired data AND provider w/o data THEN it is not iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [] });
          await delay(600);
          const values: unknown[] = [];
          const cb = jest.fn((value) => {
            values.push(value);
            return false;
          });

          const { data } = await cache[Method.Every]({ method: Method.Every, hook: cb, type: Payload.Type.Hook });
          expect(cb).toBeCalledTimes(0);

          expect(values).toEqual([]);
          expect(data).toBe(true);
        });

        test('GIVEN cache w/ expired data AND provider w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [] });
          await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [] });
          await delay(600);
          const values: unknown[] = [];
          const cb = jest.fn((value) => {
            values.push(value);
            return false;
          });

          const { data } = await cache[Method.Every]({ method: Method.Every, hook: cb, type: Payload.Type.Hook });
          expect(cb).toBeCalledTimes(1);

          expect(values).toEqual(['stored']);
          expect(data).toBe(false);
        });
      });

      describe(Payload.Type.Value, () => {
        test('GIVEN cache w/ data THEN it is iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [] });

          const { data } = await cache[Method.Every]({ method: Method.Every, value: 'value', path: [], type: Payload.Type.Value });

          expect(data).toBe(true);
        });

        test('GIVEN cache w/o data THEN it is not iterated', async () => {
          const { data } = await cache[Method.Every]({ method: Method.Every, value: 'value', path: [], type: Payload.Type.Value });

          expect(data).toBe(true);
        });

        test('GIVEN cache w/ expired data AND provider w/o data THEN it is not iterated', async () => {
          await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [] });
          await delay(600);
          const { data } = await cache[Method.Every]({ method: Method.Every, value: 'value', path: [], type: Payload.Type.Value });

          expect(data).toBe(true);
        });

        // test('GIVEN cache w/ expired data AND provider w/ data THEN it is iterated', async () => {
        //   await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [] });
        //   await store.provider[Method.Set]({ method: Method.Set, key: 'key', value: 'stored', path: [] });
        //   await delay(600);
        //   const { data } = await cache[Method.Every]({ method: Method.Every, value: 'value', path: [], type: Payload.Type.Value });

        //   expect(data).toBe(false);
        // }); Value doesn't check ttl
      });
    });
  });
});
