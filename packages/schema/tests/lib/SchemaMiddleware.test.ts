import { MapProvider } from '@joshdb/map';
import { JoshMiddlewareStore, MathOperator, Method, Payload } from '@joshdb/provider';
import { CombinedPropertyError, s } from '@sapphire/shapeshift';
import { SchemaMiddleware } from '../../src';

describe('SchemaMiddleware', () => {
  describe('is a class', () => {
    test('GIVEN typeof SchemaMiddleware THEN returns function', () => {
      expect(typeof SchemaMiddleware).toBe('function');
    });

    test('GIVEN typeof ...prototype THEN returns object', () => {
      expect(typeof SchemaMiddleware.prototype).toBe('object');
    });
  });

  describe('can manipulate provider data', () => {
    const store = new JoshMiddlewareStore({ provider: new MapProvider() });
    const schema = new SchemaMiddleware<unknown>({
      schema: s.object({
        str: s.string,
        num: s.number,
        arr: s.array(s.string)
      })
    });

    beforeAll(async () => {
      await schema.init(store);
    });

    beforeEach(async () => {
      await store.provider[Method.Clear]({ method: Method.Clear, errors: [] });
    });

    describe(Method.Dec, () => {
      test('GIVEN missing data THEN skips parse', async () => {
        await expect(schema[Method.Dec]({ method: Method.Dec, errors: [], key: 'key', path: [] })).resolves.toStrictEqual({
          method: Method.Dec,
          errors: [],
          key: 'key',
          path: []
        });
      });

      test('GIVEN valid data THEN passes', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } });

        await expect(schema[Method.Dec]({ method: Method.Dec, errors: [], key: 'key', path: ['num'] })).resolves.toStrictEqual({
          method: Method.Dec,
          errors: [],
          key: 'key',
          path: ['num']
        });
      });

      test('GIVEN invalid data THEN throws', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 1, num: 'test', arr: [] } });

        const payload = await schema[Method.Dec]({ method: Method.Dec, errors: [], key: 'key', path: ['num'] });
        const { method, key, path, errors } = payload;
        const { context } = errors[0];

        expect(method).toBe(Method.Dec);
        expect(key).toBe('key');
        expect(path).toStrictEqual(['num']);
        expect(context.shapeshiftError).toBeInstanceOf(CombinedPropertyError);
      });
    });

    describe(Method.Get, () => {
      test('GIVEN missing data THEN skips parse', () => {
        expect(schema[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [] })).toStrictEqual({
          method: Method.Get,
          errors: [],
          key: 'key',
          path: []
        });
      });

      test('GIVEN valid data THEN passes', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } });

        expect(schema[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [], data: { str: 'test', num: 1, arr: [] } })).toStrictEqual({
          method: Method.Get,
          errors: [],
          key: 'key',
          path: [],
          data: { str: 'test', num: 1, arr: [] }
        });
      });

      test('GIVEN invalid data THEN throws', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 1, num: 'test', arr: [] } });

        const payload = schema[Method.Get]({ method: Method.Get, errors: [], key: 'key', path: [], data: { str: 1, num: 'test', arr: [] } });
        const { method, key, path, errors } = payload;
        const { context } = errors[0];

        expect(method).toBe(Method.Get);
        expect(key).toBe('key');
        expect(path).toStrictEqual([]);
        expect(context.shapeshiftError).toBeInstanceOf(CombinedPropertyError);
      });
    });

    describe(Method.GetMany, () => {
      test('GIVEN missing data THEN skips parse', () => {
        expect(schema[Method.GetMany]({ method: Method.GetMany, errors: [], keys: [] })).toStrictEqual({
          method: Method.GetMany,
          errors: [],
          keys: []
        });
      });

      test('GIVEN valid data THEN passes', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } });

        expect(
          schema[Method.GetMany]({ method: Method.GetMany, errors: [], keys: ['key'], data: { key: { str: 'test', num: 1, arr: [] } } })
        ).toStrictEqual({
          method: Method.GetMany,
          errors: [],
          keys: ['key'],
          data: { key: { str: 'test', num: 1, arr: [] } }
        });
      });

      test('GIVEN invalid data THEN throws', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 1, num: 'test', arr: [] } });

        const payload = schema[Method.GetMany]({
          method: Method.GetMany,
          errors: [],
          keys: ['key'],
          data: { key: { str: 1, num: 'test', arr: [] } }
        });

        const { method, keys, data, errors } = payload;
        const { context } = errors[0];

        expect(method).toBe(Method.GetMany);
        expect(keys).toStrictEqual(['key']);
        expect(data).toStrictEqual({ key: { str: 1, num: 'test', arr: [] } });
        expect(context.shapeshiftError).toBeInstanceOf(CombinedPropertyError);
      });
    });

    describe(Method.Inc, () => {
      test('GIVEN missing data THEN skips parse', async () => {
        await expect(schema[Method.Inc]({ method: Method.Inc, errors: [], key: 'key', path: [] })).resolves.toStrictEqual({
          method: Method.Inc,
          errors: [],
          key: 'key',
          path: []
        });
      });

      test('GIVEN valid data THEN passes', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } });

        await expect(schema[Method.Inc]({ method: Method.Inc, errors: [], key: 'key', path: ['num'] })).resolves.toStrictEqual({
          method: Method.Inc,
          errors: [],
          key: 'key',
          path: ['num']
        });
      });

      test('GIVEN invalid data THEN throws', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 1, num: 'test', arr: [] } });

        const payload = await schema[Method.Inc]({ method: Method.Inc, errors: [], key: 'key', path: ['num'] });
        const { method, key, path, errors } = payload;
        const { context } = errors[0];

        expect(method).toBe(Method.Inc);
        expect(key).toBe('key');
        expect(path).toStrictEqual(['num']);
        expect(context.shapeshiftError).toBeInstanceOf(CombinedPropertyError);
      });
    });

    describe(Method.Push, () => {
      test('GIVEN missing data THEN skips parse', async () => {
        await expect(schema[Method.Push]({ method: Method.Push, errors: [], key: 'key', path: [], value: [] })).resolves.toStrictEqual({
          method: Method.Push,
          errors: [],
          key: 'key',
          path: [],
          value: []
        });
      });

      test('GIVEN valid data THEN passes', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: ['test'] } });

        await expect(schema[Method.Push]({ method: Method.Push, errors: [], key: 'key', path: ['arr'], value: 'test' })).resolves.toStrictEqual({
          method: Method.Push,
          errors: [],
          key: 'key',
          path: ['arr'],
          value: 'test'
        });
      });

      test('GIVEN invalid data THEN throws', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: [1] } });

        const payload = await schema[Method.Push]({ method: Method.Push, errors: [], key: 'key', path: ['arr'], value: 'test' });
        const { method, key, path, errors } = payload;
        const { context } = errors[0];

        expect(method).toBe(Method.Push);
        expect(key).toBe('key');
        expect(path).toStrictEqual(['arr']);
        expect(context.shapeshiftError).toBeInstanceOf(CombinedPropertyError);
      });
    });

    describe(Method.Math, () => {
      test('GIVEN missing data THEN skips parse', async () => {
        await expect(
          schema[Method.Math]({ method: Method.Math, errors: [], key: 'key', path: [], operand: 1, operator: MathOperator.Addition })
        ).resolves.toStrictEqual({
          method: Method.Math,
          errors: [],
          key: 'key',
          path: [],
          operand: 1,
          operator: MathOperator.Addition
        });
      });

      test('GIVEN valid data THEN passes', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } });

        await expect(
          schema[Method.Math]({ method: Method.Math, errors: [], key: 'key', path: ['num'], operand: 1, operator: MathOperator.Addition })
        ).resolves.toStrictEqual({
          method: Method.Math,
          errors: [],
          key: 'key',
          path: ['num'],
          operand: 1,
          operator: MathOperator.Addition
        });
      });

      test('GIVEN invalid data THEN throws', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 1, num: 'test', arr: [] } });

        const payload = await schema[Method.Math]({
          method: Method.Math,
          errors: [],
          key: 'key',
          path: ['num'],
          operand: 1,
          operator: MathOperator.Addition
        });

        const { method, key, path, errors } = payload;
        const { context } = errors[0];

        expect(method).toBe(Method.Math);
        expect(key).toBe('key');
        expect(path).toStrictEqual(['num']);
        expect(context.shapeshiftError).toBeInstanceOf(CombinedPropertyError);
      });
    });

    describe(Method.Remove, () => {
      test('GIVEN missing data THEN skips parse', async () => {
        await expect(
          schema[Method.Remove]({ method: Method.Remove, errors: [], type: Payload.Type.Value, key: 'key', path: ['arr'], value: 'test' })
        ).resolves.toStrictEqual({
          method: Method.Remove,
          errors: [],
          type: Payload.Type.Value,
          key: 'key',
          path: ['arr'],
          value: 'test'
        });
      });

      test('GIVEN valid data THEN passes', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: ['test'] } });

        await expect(
          schema[Method.Remove]({ method: Method.Remove, errors: [], type: Payload.Type.Value, key: 'key', path: ['arr'], value: 'test' })
        ).resolves.toStrictEqual({ method: Method.Remove, errors: [], type: Payload.Type.Value, key: 'key', path: ['arr'], value: 'test' });
      });

      test('GIVEN invalid data THEN throws', async () => {
        await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: [1] } });

        const payload = await schema[Method.Remove]({
          method: Method.Remove,
          errors: [],
          type: Payload.Type.Value,
          key: 'key',
          path: ['arr'],
          value: 'test'
        });

        const { method, key, path, errors } = payload;
        const { context } = errors[0];

        expect(method).toBe(Method.Remove);
        expect(key).toBe('key');
        expect(path).toStrictEqual(['arr']);
        expect(context.shapeshiftError).toBeInstanceOf(CombinedPropertyError);
      });
    });

    describe(Method.Set, () => {
      test('GIVEN missing data THEN skips parse', async () => {
        await expect(
          schema[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } })
        ).resolves.toStrictEqual({
          method: Method.Set,
          errors: [],
          key: 'key',
          path: [],
          value: { str: 'test', num: 1, arr: [] }
        });

        test('GIVEN valid data THEN passes', async () => {
          await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } });

          await expect(schema[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: ['str'], value: 'test' })).resolves.toStrictEqual({
            method: Method.Set,
            errors: [],
            key: 'key',
            path: ['str'],
            value: 'test'
          });
        });

        test('GIVEN invalid data THEN throws', async () => {
          await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 1, num: 'test', arr: [] } });

          const payload = await schema[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: ['str'], value: 'test' });
          const { method, key, path, errors } = payload;
          const { context } = errors[0];

          expect(method).toBe(Method.Set);
          expect(key).toBe('key');
          expect(path).toStrictEqual(['str']);
          expect(context.shapeshiftError).toBeInstanceOf(CombinedPropertyError);
        });

        test('GIVEN invalid value THEN throws', async () => {
          const payload = await schema[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 1, num: 'test', arr: [] } });
          const { method, key, path, errors } = payload;
          const { context } = errors[0];

          expect(method).toBe(Method.Set);
          expect(key).toBe('key');
          expect(path).toStrictEqual([]);
          expect(context.shapeshiftError).toBeInstanceOf(CombinedPropertyError);
        });
      });

      describe(Method.SetMany, () => {
        test('GIVEN missing data THEN skips parse', async () => {
          await expect(
            schema[Method.SetMany]({
              method: Method.SetMany,
              errors: [],
              entries: [{ key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } }],
              overwrite: true
            })
          ).resolves.toStrictEqual({
            method: Method.SetMany,
            errors: [],
            entries: [{ key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } }],
            overwrite: true
          });
        });

        test('GIVEN valid data THEN passes', async () => {
          await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } });

          await expect(
            schema[Method.SetMany]({
              method: Method.SetMany,
              errors: [],
              entries: [{ key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } }],
              overwrite: true
            })
          ).resolves.toStrictEqual({
            method: Method.SetMany,
            errors: [],
            entries: [{ key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } }],
            overwrite: true
          });
        });

        test('GIVEN invalid data THEN throws', async () => {
          await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: {} } });

          const payload = await schema[Method.SetMany]({
            method: Method.SetMany,
            errors: [],
            entries: [{ key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } }],
            overwrite: true
          });

          const { method, entries, errors } = payload;
          const { context } = errors[0];

          expect(method).toBe(Method.SetMany);
          expect(entries).toStrictEqual([{ key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } }]);

          expect(context.shapeshiftError).toBeInstanceOf(CombinedPropertyError);
        });

        test('GIVEN invalid value THEN throws', async () => {
          await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } });

          const payload = await schema[Method.SetMany]({
            method: Method.SetMany,
            errors: [],
            entries: [{ key: 'key', path: [], value: { str: 1, num: 'test', arr: {} } }],
            overwrite: true
          });

          const { method, entries, errors } = payload;
          const { context } = errors[0];

          expect(method).toBe(Method.SetMany);
          expect(entries).toStrictEqual([{ key: 'key', path: [], value: { str: 1, num: 'test', arr: {} } }]);

          expect(context.shapeshiftError).toBeInstanceOf(CombinedPropertyError);
        });
      });

      describe(Method.Update, () => {
        test('GIVEN missing data THEN skips parse', async () => {
          await expect(schema[Method.Update]({ method: Method.Update, errors: [], key: 'key', hook: (value) => value })).resolves.toStrictEqual({
            method: Method.Update,
            errors: [],
            key: 'key',
            hook: expect.any(Function)
          });
        });

        test('GIVEN valid data THEN passes', async () => {
          await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 'test', num: 1, arr: [] } });

          const payload = await schema[Method.Update]({ method: Method.Update, errors: [], key: 'key', hook: (value) => value });
          const { method, key, hook } = payload;

          expect(method).toBe(Method.Update);
          expect(key).toBe('key');
          expect(typeof hook).toBe('function');
        });

        test('GIVEN invalid data THEN throws', async () => {
          await store.provider[Method.Set]({ method: Method.Set, errors: [], key: 'key', path: [], value: { str: 1, num: 'test', arr: [] } });

          const payload = await schema[Method.Update]({ method: Method.Update, errors: [], key: 'key', hook: (value) => value });
          const { method, key, errors } = payload;
          const { context } = errors[0];

          expect(method).toBe(Method.Update);
          expect(key).toBe('key');
          expect(context.shapeshiftError).toBeInstanceOf(CombinedPropertyError);
        });
      });
    });
  });
});
