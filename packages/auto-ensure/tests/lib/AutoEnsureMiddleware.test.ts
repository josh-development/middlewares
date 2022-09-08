import { MapProvider } from '@joshdb/map';
import { JoshMiddlewareStore, MathOperator, Method, Payload } from '@joshdb/provider';
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
    const store = new JoshMiddlewareStore({ provider: new MapProvider() });
    const autoEnsure = new AutoEnsureMiddleware<unknown>({ defaultValue: { a: 'b', c: 'd' } });

    beforeAll(async () => {
      await autoEnsure.init(store);
    });

    beforeEach(async () => {
      await store.provider[Method.Clear]({ method: Method.Clear, errors: [] });

      Reflect.deleteProperty(autoEnsure['context'], 'ensureProperties');
    });

    describe(Method.Dec, () => {
      test('GIVEN provider w/o data THEN middleware ensures data ', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Dec]({ method: Method.Dec, errors: [], key: 'key', path: [] });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Dec);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ e: 'f', g: 'h' });

        const payload = await autoEnsure[Method.Dec]({ method: Method.Dec, errors: [], key: 'key', path: [] });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Dec);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ e: 'f', g: 'h' });
      });

      test('GIVEN provider w/ partial data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { a: 'b' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ a: 'b' });

        const payload = await autoEnsure[Method.Dec]({ method: Method.Dec, errors: [], key: 'key', path: [] });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Dec);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/o data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        const payload = await autoEnsure[Method.Dec]({ method: Method.Dec, errors: [], key: 'key', path: [] });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Dec);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });
    });

    describe(Method.Get, () => {
      test('GIVEN provider w/o data THEN middleware ensures data', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Get);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);
        expect('data' in payload).toBe(true);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        const payload = await autoEnsure[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [], data: { e: 'f', g: 'h' } });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Get);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);
        expect('data' in payload).toBe(true);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ e: 'f', g: 'h' });
      });
    });

    describe(Method.GetMany, () => {
      test('GIVEN provider w/o data THEN middleware ensures data', async () => {
        const payload = await autoEnsure[Method.GetMany]({ method: Method.GetMany, errors: [], keys: ['key', 'anotherKey'] });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors, data } = payload;

        expect(method).toBe(Method.GetMany);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);
        expect('data' in payload).toBe(true);
        expect(Object.entries(data!)).toContainEqual(['key', { a: 'b', c: 'd' }]);
        expect(Object.entries(data!)).toContainEqual(['anotherKey', { a: 'b', c: 'd' }]);
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.SetMany]({
          method: Method.SetMany,
          errors: [],
          entries: [
            { key: 'key', path: [], value: { e: 'f', g: 'h' } },
            { key: 'anotherKey', path: [], value: { i: 'j', k: 'l' } }
          ],
          overwrite: true
        });

        const payload = await autoEnsure[Method.GetMany]({
          method: Method.GetMany,
          errors: [],
          keys: ['key', 'anotherKey'],
          data: {
            key: { e: 'f', g: 'h' },
            anotherKey: { i: 'j', k: 'l' }
          }
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors, data } = payload;

        expect(method).toBe(Method.GetMany);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);
        expect('data' in payload).toBe(true);
        expect(Object.entries(data!)).toContainEqual(['key', { e: 'f', g: 'h' }]);
        expect(Object.entries(data!)).toContainEqual(['anotherKey', { i: 'j', k: 'l' }]);
      });

      test('GIVEN provider w/ partial data THEN middleware ensures or skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        const payload = await autoEnsure[Method.GetMany]({
          method: Method.GetMany,
          errors: [],
          keys: ['key', 'anotherKey'],
          data: { key: { e: 'f', g: 'h' } }
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors, data } = payload;

        expect(method).toBe(Method.GetMany);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);
        expect('data' in payload).toBe(true);
        expect(Object.entries(data!)).toContainEqual(['key', { e: 'f', g: 'h' }]);
        expect(Object.entries(data!)).toContainEqual(['anotherKey', { a: 'b', c: 'd' }]);
      });
    });

    describe(Method.Inc, () => {
      test('GIVEN provider w/o data THEN middleware ensures data ', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Inc]({ method: Method.Inc, errors: [], key: 'key', path: [] });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Inc);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ e: 'f', g: 'h' });

        const payload = await autoEnsure[Method.Inc]({ method: Method.Inc, errors: [], key: 'key', path: [] });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Inc);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ e: 'f', g: 'h' });
      });

      test('GIVEN provider w/ partial data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { a: 'b' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ a: 'b' });

        const payload = await autoEnsure[Method.Inc]({ method: Method.Inc, errors: [], key: 'key', path: [] });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Inc);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/o data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        const payload = await autoEnsure[Method.Inc]({ method: Method.Inc, errors: [], key: 'key', path: [] });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Inc);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });
    });

    describe(Method.Push, () => {
      test('GIVEN provider w/o data THEN middleware ensures data ', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Push]({ method: Method.Push, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Push);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ e: 'f', g: 'h' });

        const payload = await autoEnsure[Method.Push]({ method: Method.Push, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Push);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ e: 'f', g: 'h' });
      });

      test('GIVEN provider w/ partial data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { a: 'b' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ a: 'b' });

        const payload = await autoEnsure[Method.Push]({ method: Method.Push, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Push);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/o data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        const payload = await autoEnsure[Method.Push]({ method: Method.Push, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Push);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });
    });

    describe(Method.Math, () => {
      test('GIVEN provider w/o data THEN middleware ensures data ', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Math]({
          method: Method.Math,
          errors: [],
          key: 'key',
          path: [],
          operator: MathOperator.Addition,
          operand: 1
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Math);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ e: 'f', g: 'h' });

        const payload = await autoEnsure[Method.Math]({
          method: Method.Math,
          errors: [],
          key: 'key',
          path: [],
          operator: MathOperator.Addition,
          operand: 1
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Math);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ e: 'f', g: 'h' });
      });

      test('GIVEN provider w/ partial data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { a: 'b' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ a: 'b' });

        const payload = await autoEnsure[Method.Math]({
          method: Method.Math,
          errors: [],
          key: 'key',
          path: [],
          operator: MathOperator.Addition,
          operand: 1
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Math);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/o data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        const payload = await autoEnsure[Method.Math]({
          method: Method.Math,
          errors: [],
          key: 'key',
          path: [],
          operator: MathOperator.Addition,
          operand: 1
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Math);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });
    });

    describe(Method.Remove, () => {
      test('GIVEN provider w/o data THEN middleware ensures data ', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Remove]({
          method: Method.Remove,
          errors: [],
          type: Payload.Type.Value,
          key: 'key',
          path: ['e'],
          value: 'f'
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Remove);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ e: 'f', g: 'h' });

        const payload = await autoEnsure[Method.Remove]({
          method: Method.Remove,
          errors: [],
          type: Payload.Type.Value,
          key: 'key',
          path: ['e'],
          value: 'f'
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Remove);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ e: 'f', g: 'h' });
      });

      test('GIVEN provider w/ partial data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { a: 'b' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ a: 'b' });

        const payload = await autoEnsure[Method.Remove]({
          method: Method.Remove,
          errors: [],
          type: Payload.Type.Value,
          key: 'key',
          path: ['e'],
          value: 'f'
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Remove);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/o data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        const payload = await autoEnsure[Method.Remove]({
          method: Method.Remove,
          errors: [],
          type: Payload.Type.Value,
          key: 'key',
          path: ['e'],
          value: 'f'
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Remove);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });
    });

    describe(Method.Set, () => {
      test('GIVEN provider w/o data THEN middleware ensures data ', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Set);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ e: 'f', g: 'h' });

        const payload = await autoEnsure[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Set);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ e: 'f', g: 'h' });
      });

      test('GIVEN provider w/ partial data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { a: 'b' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ a: 'b' });

        const payload = await autoEnsure[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Set);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/o data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        const payload = await autoEnsure[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Set);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });
    });

    describe(Method.SetMany, () => {
      test('GIVEN provider w/o data THEN middleware ensures data', async () => {
        const payload = await autoEnsure[Method.SetMany]({
          method: Method.SetMany,
          errors: [],
          entries: [
            { key: 'key', path: [], value: { e: 'f', g: 'h' } },
            { key: 'anotherKey', path: [], value: { i: 'j', k: 'l' } }
          ],
          overwrite: true
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.SetMany);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getManyAfter = await store.provider[Method.GetMany]({ method: Method.GetMany, errors: [], keys: ['key', 'anotherKey'] });

        expect(Object.entries(getManyAfter.data!)).toContainEqual(['key', { a: 'b', c: 'd' }]);
        expect(Object.entries(getManyAfter.data!)).toContainEqual(['anotherKey', { a: 'b', c: 'd' }]);
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.SetMany]({
          method: Method.SetMany,
          errors: [],
          entries: [
            { key: 'key', path: [], value: { e: 'f', g: 'h' } },
            { key: 'anotherKey', path: [], value: { i: 'j', k: 'l' } }
          ],
          overwrite: true
        });

        const getManyBefore = await store.provider[Method.GetMany]({ method: Method.GetMany, errors: [], keys: ['key', 'anotherKey'] });

        expect(Object.entries(getManyBefore.data!)).toContainEqual(['key', { e: 'f', g: 'h' }]);
        expect(Object.entries(getManyBefore.data!)).toContainEqual(['anotherKey', { i: 'j', k: 'l' }]);

        const payload = await autoEnsure[Method.SetMany]({
          method: Method.SetMany,
          errors: [],
          entries: [
            { key: 'key', path: [], value: { e: 'f', g: 'h' } },
            { key: 'anotherKey', path: [], value: { i: 'j', k: 'l' } }
          ],
          overwrite: true
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.SetMany);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getManyAfter = await store.provider[Method.GetMany]({ method: Method.GetMany, errors: [], keys: ['key', 'anotherKey'] });

        expect(Object.entries(getManyAfter.data!)).toContainEqual(['key', { e: 'f', g: 'h' }]);
        expect(Object.entries(getManyAfter.data!)).toContainEqual(['anotherKey', { i: 'j', k: 'l' }]);
      });

      test('GIVEN provider w/ partial data THEN middleware ensures or skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ e: 'f', g: 'h' });

        const payload = await autoEnsure[Method.SetMany]({
          method: Method.SetMany,
          errors: [],
          entries: [
            { key: 'key', path: [], value: { e: 'f', g: 'h' } },
            { key: 'anotherKey', path: [], value: { i: 'j', k: 'l' } }
          ],
          overwrite: true
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.SetMany);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getManyAfter = await store.provider[Method.GetMany]({ method: Method.GetMany, errors: [], keys: ['key', 'anotherKey'] });

        expect(Object.entries(getManyAfter.data!)).toContainEqual(['key', { e: 'f', g: 'h' }]);
        expect(Object.entries(getManyAfter.data!)).toContainEqual(['anotherKey', { a: 'b', c: 'd' }]);
      });

      test('GIVEN provider w/ partial data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        await store.provider[Method.SetMany]({
          method: Method.SetMany,
          errors: [],
          entries: [
            { key: 'key', path: [], value: { a: 'b' } },
            { key: 'anotherKey', path: [], value: { c: 'd' } }
          ],
          overwrite: true
        });

        const getManyBefore = await store.provider[Method.GetMany]({ method: Method.GetMany, errors: [], keys: ['key', 'anotherKey'] });

        expect(Object.entries(getManyBefore.data!)).toContainEqual(['key', { a: 'b' }]);
        expect(Object.entries(getManyBefore.data!)).toContainEqual(['anotherKey', { c: 'd' }]);

        const payload = await autoEnsure[Method.SetMany]({
          method: Method.SetMany,
          errors: [],
          entries: [
            { key: 'key', path: [], value: { a: 'b' } },
            { key: 'anotherKey', path: [], value: {} }
          ],
          overwrite: true
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.SetMany);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getManyAfter = await store.provider[Method.GetMany]({ method: Method.GetMany, errors: [], keys: ['key', 'anotherKey'] });

        expect(Object.entries(getManyAfter.data!)).toContainEqual(['key', { a: 'b', c: 'd' }]);
        expect(Object.entries(getManyAfter.data!)).toContainEqual(['anotherKey', { a: 'b', c: 'd' }]);
      });

      test('GIVEN provider w/o data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        const payload = await autoEnsure[Method.SetMany]({
          method: Method.SetMany,
          errors: [],
          entries: [
            { key: 'key', path: [], value: { a: 'b' } },
            { key: 'anotherKey', path: [], value: {} }
          ],
          overwrite: true
        });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.SetMany);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getManyAfter = await store.provider[Method.GetMany]({ method: Method.GetMany, errors: [], keys: ['key', 'anotherKey'] });

        expect(Object.entries(getManyAfter.data!)).toContainEqual(['key', { a: 'b', c: 'd' }]);
        expect(Object.entries(getManyAfter.data!)).toContainEqual(['anotherKey', { a: 'b', c: 'd' }]);
      });
    });

    describe(Method.Update, () => {
      test('GIVEN provider w/o data THEN middleware ensures data ', async () => {
        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect('data' in getBefore).toBe(false);

        const payload = await autoEnsure[Method.Update]({ method: Method.Update, errors: [], key: 'key', hook: () => ({ e: 'f', g: 'h' }) });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Update);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/ data THEN middleware skips over data', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { e: 'f', g: 'h' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ e: 'f', g: 'h' });

        const payload = await autoEnsure[Method.Update]({ method: Method.Update, errors: [], key: 'key', hook: () => ({ e: 'f', g: 'h' }) });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Update);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ e: 'f', g: 'h' });
      });

      test('GIVEN provider w/ partial data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { a: 'b' } });

        const getBefore = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getBefore.data).toStrictEqual({ a: 'b' });

        const payload = await autoEnsure[Method.Update]({ method: Method.Update, errors: [], key: 'key', hook: () => ({ a: 'b' }) });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Update);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });

      test('GIVEN provider w/o data THEN middleware ensures properties', async () => {
        autoEnsure['context'].ensureProperties = true;

        const payload = await autoEnsure[Method.Update]({ method: Method.Update, errors: [], key: 'key', hook: () => ({}) });

        expect(typeof payload).toBe('object');

        const { method, trigger, errors } = payload;

        expect(method).toBe(Method.Update);
        expect(trigger).toBeUndefined();
        expect(errors).toStrictEqual([]);

        const getAfter = await store.provider[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] });

        expect(getAfter.data).toStrictEqual({ a: 'b', c: 'd' });
      });
    });
  });
});
