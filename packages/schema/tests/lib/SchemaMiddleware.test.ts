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
});
