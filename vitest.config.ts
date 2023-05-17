import { createVitestConfig } from './scripts/vitest.config';

export default createVitestConfig({
  test: {
    deps: {
      inline: [/^(?!.*vitest).*$/]
    }
  },
  esbuild: {
    target: 'es2021'
  }
});
