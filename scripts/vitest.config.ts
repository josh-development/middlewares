import type { ESBuildOptions } from 'vite';
import { UserConfig, configDefaults, defineConfig } from 'vitest/config';

export const createVitestConfig = (options: UserConfig = {}) =>
  defineConfig({
    ...options,
    test: {
      ...options?.test,
      globals: true,
      coverage: {
        ...options.test?.coverage,
        enabled: true,
        exclude: [...(options.test?.coverage?.exclude ?? []), ...configDefaults.exclude, '**/tests/**', '**/.yarn/**', '**/scripts/**']
      }
    },
    esbuild: {
      ...options?.esbuild,
      target: (options?.esbuild as ESBuildOptions | undefined)?.target ?? 'es2022'
    }
  });
