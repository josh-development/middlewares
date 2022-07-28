import { MapProvider } from '@joshdb/map';
import { MathOperator, Method, MiddlewareStore, Payload } from '@joshdb/middleware';
import { AutoEnsureMiddleware } from '../../src';

describe('AutoEnsureMiddleware', () => {
  describe('is a class', () => {
    test(`GIVEN typeof AutoEnsureMiddleware THEN returns function`, () => {
      expect(typeof AutoEnsureMiddleware).toBe('function');
    });

    test('GIVEN typeof ...prototype THEN returns object', () => {
      expect(typeof AutoEnsureMiddleware.prototype).toBe('object');
    });
  });

  describe('can manipulate provider data', () => {
    // @ts-expect-error 2322
    const store = new MiddlewareStore({ provider: new MapProvider() });
    const autoEnsure = new AutoEnsureMiddleware<unknown>({ defaultValue: 'test:defaultValue' });

    beforeAll(async () => {
      // @ts-expect-error 2345
      await autoEnsure.init(store);
    });

    beforeEach(async () => {
      await store.provider[Method.Clear]({ method: Method.Clear });
    });

    describe(Method.Dec, () => {
      test('GIVEN provider w/o data THEN middleware ensures data ', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Dec]({ method: Method.Dec, key: 'test:key', path: [] });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Dec);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:defaultValue');
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, key: 'test:key', path: [], value: 'test:value' });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getBefore.data).toBe('test:value');

        const payload = await autoEnsure[Method.Dec]({ method: Method.Dec, key: 'test:key', path: [] });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Dec);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:value');
      });
    });

    describe(Method.Get, () => {
      test('GIVEN provider w/o data THEN middleware ensures data', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Get);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();
        expect('data' in payload).toBe(true);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:defaultValue');
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, key: 'test:key', path: [], value: 'test:value' });

        const payload = await autoEnsure[Method.Get]({ method: Method.Get, key: 'test:key', path: [], data: 'test:value' });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Get);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();
        expect('data' in payload).toBe(true);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:value');
      });
    });

    describe(Method.GetMany, () => {
      test('GIVEN provider w/o data THEN middleware ensures data', async () => {
        const payload = await autoEnsure[Method.GetMany]({ method: Method.GetMany, keys: ['test:key', 'test:anotherKey'] });

        expect(typeof payload).toBe('object');

        const { method, trigger, error, data } = payload;

        expect(method).toBe(Method.GetMany);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();
        expect('data' in payload).toBe(true);
        expect(Object.entries(data!)).toContainEqual(['test:key', 'test:defaultValue']);
        expect(Object.entries(data!)).toContainEqual(['test:anotherKey', 'test:defaultValue']);
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.SetMany]({
          method: Method.SetMany,
          entries: [
            [{ key: 'test:key', path: [] }, 'test:value'],
            [{ key: 'test:anotherKey', path: [] }, 'test:anotherValue']
          ],
          overwrite: true
        });

        const payload = await autoEnsure[Method.GetMany]({
          method: Method.GetMany,
          keys: ['test:key', 'test:anotherKey'],
          data: {
            'test:key': 'test:value',
            'test:anotherKey': 'test:anotherValue'
          }
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, error, data } = payload;

        expect(method).toBe(Method.GetMany);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();
        expect('data' in payload).toBe(true);
        expect(Object.entries(data!)).toContainEqual(['test:key', 'test:value']);
        expect(Object.entries(data!)).toContainEqual(['test:anotherKey', 'test:anotherValue']);
      });

      test('GIVEN provider w/ partial data THEN middleware ensures or skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, key: 'test:key', path: [], value: 'test:value' });

        const payload = await autoEnsure[Method.GetMany]({
          method: Method.GetMany,
          keys: ['test:key', 'test:anotherKey'],
          data: { 'test:key': 'test:value' }
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, error, data } = payload;

        expect(method).toBe(Method.GetMany);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();
        expect('data' in payload).toBe(true);
        expect(Object.entries(data!)).toContainEqual(['test:key', 'test:value']);
        expect(Object.entries(data!)).toContainEqual(['test:anotherKey', 'test:defaultValue']);
      });
    });

    describe(Method.Inc, () => {
      test('GIVEN provider w/o data THEN middleware ensures data ', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Inc]({ method: Method.Inc, key: 'test:key', path: [] });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Inc);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:defaultValue');
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, key: 'test:key', path: [], value: 'test:value' });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getBefore.data).toBe('test:value');

        const payload = await autoEnsure[Method.Inc]({ method: Method.Inc, key: 'test:key', path: [] });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Inc);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:value');
      });
    });

    describe(Method.Push, () => {
      test('GIVEN provider w/o data THEN middleware ensures data ', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Push]({ method: Method.Push, key: 'test:key', path: [], value: 'test:value' });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Push);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:defaultValue');
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, key: 'test:key', path: [], value: 'test:value' });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getBefore.data).toBe('test:value');

        const payload = await autoEnsure[Method.Push]({ method: Method.Push, key: 'test:key', path: [], value: 'test:value' });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Push);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:value');
      });
    });

    describe(Method.Math, () => {
      test('GIVEN provider w/o data THEN middleware ensures data ', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Math]({
          method: Method.Math,
          key: 'test:key',
          path: [],
          operator: MathOperator.Addition,
          operand: 1
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Math);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:defaultValue');
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, key: 'test:key', path: [], value: 'test:value' });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getBefore.data).toBe('test:value');

        const payload = await autoEnsure[Method.Math]({
          method: Method.Math,
          key: 'test:key',
          path: [],
          operator: MathOperator.Addition,
          operand: 1
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Math);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:value');
      });
    });

    describe(Method.Remove, () => {
      test('GIVEN provider w/o data THEN middleware ensures data ', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Remove]({
          method: Method.Remove,
          type: Payload.Type.Value,
          key: 'test:key',
          path: [],
          value: 'test:value'
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Remove);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:defaultValue');
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, key: 'test:key', path: [], value: 'test:value' });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getBefore.data).toBe('test:value');

        const payload = await autoEnsure[Method.Remove]({
          method: Method.Remove,
          type: Payload.Type.Value,
          key: 'test:key',
          path: [],
          value: 'test:value'
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Remove);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:value');
      });
    });

    describe(Method.Set, () => {
      test('GIVEN provider w/o data THEN middleware ensures data ', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Set]({ method: Method.Set, key: 'test:key', path: [], value: 'test:value' });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Set);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:defaultValue');
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, key: 'test:key', path: [], value: 'test:value' });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getBefore.data).toBe('test:value');

        const payload = await autoEnsure[Method.Set]({ method: Method.Set, key: 'test:key', path: [], value: 'test:value' });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Set);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:value');
      });
    });

    describe(Method.SetMany, () => {
      test('GIVEN provider w/o data THEN middleware ensures data', async () => {
        const payload = await autoEnsure[Method.SetMany]({
          method: Method.SetMany,
          entries: [
            [{ key: 'test:key', path: [] }, 'test:value'],
            [{ key: 'test:anotherKey', path: [] }, 'test:anotherValue']
          ],
          overwrite: true
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.SetMany);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getManyAfter = await store.provider[Method.GetMany]({ method: Method.GetMany, keys: ['test:key', 'test:anotherKey'] });

        expect(Object.entries(getManyAfter.data!)).toContainEqual(['test:key', 'test:defaultValue']);
        expect(Object.entries(getManyAfter.data!)).toContainEqual(['test:anotherKey', 'test:defaultValue']);
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.SetMany]({
          method: Method.SetMany,
          entries: [
            [{ key: 'test:key', path: [] }, 'test:value'],
            [{ key: 'test:anotherKey', path: [] }, 'test:anotherValue']
          ],
          overwrite: true
        });

        const getManyBefore = await store.provider[Method.GetMany]({ method: Method.GetMany, keys: ['test:key', 'test:anotherKey'] });

        expect(Object.entries(getManyBefore.data!)).toContainEqual(['test:key', 'test:value']);
        expect(Object.entries(getManyBefore.data!)).toContainEqual(['test:anotherKey', 'test:anotherValue']);

        const payload = await autoEnsure[Method.SetMany]({
          method: Method.SetMany,
          entries: [
            [{ key: 'test:key', path: [] }, 'test:value'],
            [{ key: 'test:anotherKey', path: [] }, 'test:anotherValue']
          ],
          overwrite: true
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.SetMany);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getManyAfter = await store.provider[Method.GetMany]({ method: Method.GetMany, keys: ['test:key', 'test:anotherKey'] });

        expect(Object.entries(getManyAfter.data!)).toContainEqual(['test:key', 'test:value']);
        expect(Object.entries(getManyAfter.data!)).toContainEqual(['test:anotherKey', 'test:anotherValue']);
      });

      test('GIVEN provider w/ partial data THEN middleware ensures or skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, key: 'test:key', path: [], value: 'test:value' });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getBefore.data).toBe('test:value');

        const payload = await autoEnsure[Method.SetMany]({
          method: Method.SetMany,
          entries: [
            [{ key: 'test:key', path: [] }, 'test:value'],
            [{ key: 'test:anotherKey', path: [] }, 'test:anotherValue']
          ],
          overwrite: true
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.SetMany);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getManyAfter = await store.provider[Method.GetMany]({ method: Method.GetMany, keys: ['test:key', 'test:anotherKey'] });

        expect(Object.entries(getManyAfter.data!)).toContainEqual(['test:key', 'test:value']);
        expect(Object.entries(getManyAfter.data!)).toContainEqual(['test:anotherKey', 'test:defaultValue']);
      });
    });

    describe(Method.Update, () => {
      test('GIVEN provider w/o data THEN middleware ensures data ', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Update]({ method: Method.Update, key: 'test:key', hook: () => 'test:value' });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Update);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:defaultValue');
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, key: 'test:key', path: [], value: 'test:value' });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getBefore.data).toBe('test:value');

        const payload = await autoEnsure[Method.Update]({ method: Method.Update, key: 'test:key', hook: () => 'test:value' });

        expect(typeof payload).toBe('object');

        const { method, trigger, error } = payload;

        expect(method).toBe(Method.Update);
        expect(trigger).toBeUndefined();
        expect(error).toBeUndefined();

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, key: 'test:key', path: [] });

        expect(getAfter.data).toBe('test:value');
      });
    });
  });
});
