import { AutoEnsure } from '../../src';

describe('AutoEnsure', () => {
  describe('is a class', () => {
    test(`GIVEN typeof ${AutoEnsure.prototype.constructor.name} THEN returns function`, () => {
      expect(typeof AutoEnsure).toBe('function');
    });

    test('GIVEN typeof ...prototype THEN returns object', () => {
      expect(typeof AutoEnsure.prototype).toBe('object');
    });
  });
});
