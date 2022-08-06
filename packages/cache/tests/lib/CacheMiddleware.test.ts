import { MapProvider } from '@joshdb/map';
import { Method, MiddlewareStore } from '@joshdb/middleware';
import { CacheMiddleware } from '../../src';

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
        enabled: true
      }
    });

    beforeAll(async () => {
      // @ts-expect-error 2345
      await cache.init(store);
    });

    test('GIVEN ttl enabled w/data THEN returns data', async () => {
      await cache[Method.Set]({ key: 'test:ttl', value: 123, method: Method.Set, path: [] });
      const { data } = await cache[Method.Get]({ key: 'test:ttl', method: Method.Get, path: [] });
      expect(data).toBe(123);
    });
  });

  describe('can manipulate provider data', () => {
    // @ts-expect-error 2322
    const store = new MiddlewareStore({ provider: new MapProvider() });
    // @ts-expect-error 2322
    const cache = new CacheMiddleware<unknown>({ provider: new MapProvider() });

    beforeAll(async () => {
      // @ts-expect-error 2345
      await cache.init(store);
    });

    beforeEach(async () => {
      await store.provider[Method.Clear]({ method: Method.Clear });
      await cache[Method.Clear]({ method: Method.Clear });
    });

    test('GIVEN cache has data THEN it is cached', async () => {
      await cache[Method.Set]({ method: Method.Set, key: 'key', value: 'value', path: [] });
      const { data: cachedValue } = await cache[Method.Get]({ method: Method.Get, key: 'key', path: [] });

      expect(cachedValue).toBe('value');
    });

    test('GIVEN cache has no data THEN it is not cached', async () => {
      const { data: cachedValue } = await cache[Method.Get]({ method: Method.Get, key: 'key', path: [] });

      expect(cachedValue).toBe(undefined);
    });
  });
});
