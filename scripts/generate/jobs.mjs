import { exec as execSync } from 'child_process';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { promisify } from 'util';

const exec = promisify(execSync);

export function resolvePath(name, ...args) {
  return resolve(process.cwd(), 'packages', name, ...args);
}

export const jobs = [
  {
    description: 'Preliminary Generation Check',
    callback: ({ name }) =>
      new Promise((resolve, reject) =>
        existsSync(resolvePath(name)) ? reject(new Error('A middleware with the given name already exists')) : resolve('')
      )
  },
  {
    description: 'Workspace Folder Creation',
    callback: async ({ name, description, umd }) => {
      await mkdir(resolvePath(name));
      await writeFile(
        resolvePath(name, 'package.json'),
        JSON.stringify(
          umd
            ? {
                name: `@joshdb/${name}`,
                version: '1.0.0',
                description,
                author: 'Évelyne Lachance <eslachance@gmail.com> (https://evie.codes/)',
                contributors: [],
                license: 'Apache-2.0',
                main: 'dist/index.js',
                module: 'dist/index.mjs',
                browser: 'dist/index.umd.js',
                unpkg: 'dist/index.umd.js',
                types: 'dist/index.d.ts',
                exports: {
                  import: './dist/index.mjs',
                  require: './dist/index.js'
                },
                scripts: {
                  test: 'jest',
                  build: 'rollup -c rollup.bundle.ts',
                  release: 'npm publish',
                  prepublishOnly: 'rollup-type-bundler'
                },
                dependencies: {
                  '@joshdb/core': 'next'
                },
                devDependencies: {
                  '@favware/rollup-type-bundler': '^1.0.7',
                  jest: '^27.5.1',
                  rollup: '^2.70.2',
                  'standard-version': '^9.3.2'
                },
                repository: {
                  type: 'git',
                  url: 'git+https://github.com/josh-development/middlewares.git'
                },
                files: ['dist', '!dist/*tsbuildinfo'],
                engines: {
                  node: '>=16.6.0',
                  npm: '>=7.0.0'
                },
                keywords: [],
                bugs: {
                  url: 'https://github.com/josh-development/middlewares/issues'
                },
                homepage: 'https://josh.evie.dev',
                publishConfig: {
                  access: 'public'
                }
              }
            : {
                name: `@joshdb/${name}`,
                version: '1.0.0',
                description,
                author: 'Évelyne Lachance <eslachance@gmail.com> (https://evie.codes/)',
                contributors: [],
                license: 'Apache-2.0',
                main: 'dist/index.js',
                module: 'dist/index.mjs',
                types: 'dist/index.d.ts',
                exports: {
                  import: './dist/index.mjs',
                  require: './dist/index.js'
                },
                scripts: {
                  test: 'jest',
                  build: 'rollup -c rollup.bundle.ts',
                  release: 'npm publish',
                  prepublishOnly: 'rollup-type-bundler'
                },
                dependencies: {
                  '@joshdb/core': 'next'
                },
                devDependencies: {
                  '@favware/rollup-type-bundler': '^1.0.7',
                  jest: '^27.5.1',
                  rollup: '^2.70.2',
                  'standard-version': '^9.3.2'
                },
                repository: {
                  type: 'git',
                  url: 'git+https://github.com/josh-development/middlewares.git'
                },
                files: ['dist', '!dist/*tsbuildinfo'],
                engines: {
                  node: '>=16.6.0',
                  npm: '>=7.0.0'
                },
                keywords: [],
                bugs: {
                  url: 'https://github.com/josh-development/middlewares/issues'
                },
                homepage: 'https://josh.evie.dev',
                publishConfig: {
                  access: 'public'
                }
              },
          null,
          2
        )
      );
    }
  },
  {
    description: 'Generate Configuration Files',
    callback: async ({ name, umd }) => {
      await writeFile(
        resolvePath(name, 'jest.config.ts'),
        `import type { Config } from '@jest/types';

// eslint-disable-next-line @typescript-eslint/require-await
export default async (): Promise<Config.InitialOptions> => ({
  displayName: 'unit test',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.base.json'
    }
  }
});
`
      );

      await writeFile(
        resolvePath(name, 'rollup.bundle.ts'),
        umd
          ? `import { resolve } from 'path';
import cleaner from 'rollup-plugin-cleaner';
import typescript from 'rollup-plugin-typescript2';
import versionInjector from 'rollup-plugin-version-injector';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: './dist/index.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    {
      file: './dist/index.mjs',
      format: 'es',
      exports: 'named',
      sourcemap: true
    },
    {
      file: './dist/index.umd.js',
      format: 'umd',
      name: 'Josh${title}',
      exports: 'named',
      sourcemap: true,
      globals: {
        '@joshdb/core': 'JoshCore'
      }
    }
  ],
  external: ['@joshdb/core'],
  plugins: [cleaner({ targets: ['./dist'] }), typescript({ tsconfig: resolve(process.cwd(), 'src', 'tsconfig.json') }), versionInjector()]
};`
          : `import { resolve } from 'path';
import cleaner from 'rollup-plugin-cleaner';
import typescript from 'rollup-plugin-typescript2';
import versionInjector from 'rollup-plugin-version-injector';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: './dist/index.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    {
      file: './dist/index.mjs',
      format: 'es',
      exports: 'named',
      sourcemap: true
    },
    {
      file: './dist/index.umd.js',
      format: 'umd',
      exports: 'named',
      sourcemap: true,
      globals: {}
    }
  ],
  external: [],
  plugins: [cleaner({ targets: ['./dist'] }), typescript({ tsconfig: resolve(process.cwd(), 'src', 'tsconfig.json') }), versionInjector()]
};`
      );

      await writeFile(resolvePath(name, 'tsconfig.base.json'), JSON.stringify({ extends: '../../tsconfig.base.json' }, null, 2));
      await writeFile(
        resolvePath(name, 'tsconfig.eslint.json'),
        JSON.stringify({ extends: './tsconfig.base.json', compilerOptions: { allowJs: true, checkJs: true }, include: ['src', 'tests'] }, null, 2)
      );
    }
  },
  {
    description: 'Generate Source Folder',
    callback: async ({ name, title }) => {
      await mkdir(resolvePath(name, 'src'));
      await writeFile(
        resolvePath(name, 'src', 'tsconfig.json'),
        JSON.stringify(
          {
            extends: '../tsconfig.base.json',
            compilerOptions: {
              rootDir: './',
              outDir: '../dist',
              composite: true,
              preserveConstEnums: true,
              useDefineForClassFields: false
            },
            include: ['.']
          },
          null,
          2
        )
      );

      await writeFile(
        resolvePath(name, 'src', 'index.ts'),
        `export * from './lib/${title}';

export const version = '[VI]{version}[/VI]';
`
      );

      await mkdir(resolvePath(name, 'src', 'lib'));
      await writeFile(
        resolvePath(name, 'src', 'lib', `${title}.ts`),
        `import { ApplyMiddlewareOptions, Middleware } from '@joshdb/core';

@ApplyMiddlewareOptions({ name: '${name}' })
export class ${title}<StoredValue = unknown> extends Middleware<${title}.ContextData, StoredValue> {}

export namespace ${title} {
  export interface ContextData {}
}
`
      );
    }
  },
  {
    description: 'Generate Tests Folder',
    callback: async ({ name, title }) => {
      await mkdir(resolvePath(name, 'tests'));
      await writeFile(
        resolvePath(name, 'tests', 'tsconfig.json'),
        JSON.stringify(
          {
            extends: '../tsconfig.base.json'
          },
          null,
          2
        )
      );

      await mkdir(resolvePath(name, 'tests', 'lib'));
      await writeFile(
        resolvePath(name, 'tests', 'lib', `${title}.test.ts`),
        `import { ${title} } from '../../src';

describe('${title}', () => {
  describe('is a class', () => {
    test('GIVEN typeof ${title} THEN returns function', () => {
      expect(typeof ${title}).toBe('function');
    });

    test('GIVEN typeof ...prototype THEN returns object', () => {
      expect(typeof ${title}.prototype).toBe('object');
    });
  });
});
`
      );
    }
  },
  {
    description: 'Install Dependencies',
    callback: async () => {
      await exec('yarn');
    }
  },
  {
    description: 'Lint Files',
    callback: async () => {
      await exec('yarn lint');
    }
  },
  {
    description: 'Format Files',
    callback: async ({ name }) => {
      await exec(`yarn prettier --write "packages/${name}/**/*"`);
    }
  }
];
