import { Cache } from '../../src';

describe('Cache', () => {
  describe('is a class', () => {
    test('GIVEN typeof Cache THEN returns function', () => {
      expect(typeof Cache).toBe('function');
    });

    test('GIVEN typeof ...prototype THEN returns object', () => {
      expect(typeof Cache.prototype).toBe('object');
    });
  });
});
