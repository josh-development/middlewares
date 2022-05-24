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
                author: '@joshdb',
                main: 'dist/index.js',
                module: 'dist/index.mjs',
                browser: 'dist/index.umd.js',
                unpkg: 'dist/index.umd.js',
                types: 'dist/index.d.ts',
                exports: {
                  import: './dist/index.mjs',
                  require: './dist/index.js',
                  types: './dist/index.d.ts'
                },
                sideEffects: false,
                scripts: {
                  test: 'jest',
                  lint: 'eslint src tests --ext ts --fix -c ../../.eslintrc',
                  build: 'rollup -c rollup.config.ts',
                  prepack: 'rollup-type-bundler',
                  bump: 'cliff-jumper',
                  'check-update': 'cliff-jumper --dry-run'
                },
                dependencies: {
                  '@joshdb/middleware': 'next'
                },
                devDependencies: {
                  '@favware/rollup-type-bundler': '^1.0.7'
                },
                repository: {
                  type: 'git',
                  url: 'git+https://github.com/josh-development/middlewares.git'
                },
                files: ['dist', '!dist/*.tsbuildinfo'],
                engines: {
                  node: '>=16.6.0',
                  npm: '>=7'
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
                author: '@joshdb',
                main: 'dist/index.js',
                module: 'dist/index.mjs',
                types: 'dist/index.d.ts',
                exports: {
                  import: './dist/index.mjs',
                  require: './dist/index.js',
                  types: './dist/index.d.ts'
                },
                sideEffects: false,
                scripts: {
                  test: 'jest',
                  lint: 'eslint src tests --ext ts --fix -c ../../.eslintrc',
                  build: 'rollup -c rollup.config.ts',
                  prepack: 'rollup-type-bundler',
                  bump: 'cliff-jumper',
                  'check-update': 'cliff-jumper --dry-run'
                },
                dependencies: {
                  '@joshdb/middleware': 'next'
                },
                devDependencies: {
                  '@favware/rollup-type-bundler': '^1.0.7'
                },
                repository: {
                  type: 'git',
                  url: 'git+https://github.com/josh-development/middlewares.git'
                },
                files: ['dist', '!dist/*.tsbuildinfo'],
                engines: {
                  node: '>=16.6.0',
                  npm: '>=7'
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
    callback: async ({ name, title, umd }) => {
      await writeFile(
        resolvePath(name, '.cliff-jumperrc.yml'),
        `name: ${name}
org: joshdb
packagePath: packages/${name}
`
      );

      await writeFile(
        resolvePath(name, '.typedoc-json-parserrc.yml'),
        `json: 'docs/api.json'
`
      );

      await writeFile(
        resolvePath(name, 'CHANGELOG.md'),
        `# Changelog

All notable changes to this project will be documented in this file.
`
      );

      await writeFile(
        resolvePath(name, 'cliff.toml'),
        `[changelog]
header = """
# Changelog

All notable changes to this project will be documented in this file.\n
"""
body = """
{% if version %}\
    # [{{ version | trim_start_matches(pat="v") }}]\
    {% if previous %}\
        {% if previous.version %}\
            (https://github.com/josh-development/utilities/compare/{{ previous.version }}...{{ version }})\
        {% else %}
            (https://github.com/josh-development/utilities/tree/{{ version }})\
        {% endif %}\
    {% endif %} \
    - ({{ timestamp | date(format="%Y-%m-%d") }})
{% else %}\
    # [unreleased]
{% endif %}\
{% for group, commits in commits | group_by(attribute="group") %}
    ## {{ group | upper_first }}
    {% for commit in commits %}
    - {% if commit.scope %}\
      **{{commit.scope}}:** \
      {% endif %}\
            {{ commit.message | upper_first }} ([{{ commit.id | truncate(length=7, end="") }}](https://github.com/josh-development/utilities/commit/{{ commit.id }}))\
    {% if commit.breaking %}\
      \n\n {% raw %}  {% endraw %} ### 💥 Breaking Changes:\n \
      {% for breakingChange in commit.footers %}\
        {% raw %}  {% endraw %} - {{ breakingChange }}\n\
      {% endfor %}\
    {% endif %}\
    {% endfor %}
{% endfor %}\n
"""
trim = true
footer = ""

[git]
conventional_commits = true
filter_unconventional = true
commit_parsers = [
    { message = "^feat", group = "🚀 Features"},
    { message = "^fix", group = "🐛 Bug Fixes"},
    { message = "^docs", group = "📝 Documentation"},
    { message = "^perf", group = "🏃 Performance"},
    { message = "^refactor", group = "🏠 Refactor"},
    { message = ".*deprecated", body = ".*deprecated", group = "🚨 Deprecation"},
    { message = "^revert", skip = true},
    { message = "^style", group = "🪞 Styling"},
    { message = "^test", group = "🧪 Testing"},
    { message = "^chore", skip = true},
    { message = "^ci", skip = true},
    { body = ".*security", group = "🛡️ Security"},
]
filter_commits = true
tag_pattern = "@joshdb/${name}@[0-9]*"
ignore_tags = ""
topo_order = false
sort_commits = "newest"
`
      );

      await writeFile(
        resolvePath(name, 'jest.config.mjs'),
        `/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  displayName: 'unit test',
  preset: 'ts-jest',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  setupFilesAfterEnv: ['jest-extended/all'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tests/tsconfig.json'
    }
  },
  coveragePathIgnorePatterns: []
};

export default config;

`
      );

      await writeFile(
        resolvePath(name, 'rollup.config.ts'),
        umd
          ? `import { resolve } from 'node:path';
import cleaner from 'rollup-plugin-cleaner';
import typescript from 'rollup-plugin-typescript2';

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
      sourcemap: true,
      globals: {
        '@joshdb/middleware': 'JoshMiddleware'
      }
    }
  ],
  external: ['@joshdb/middleware'],
  plugins: [cleaner({ targets: ['./dist'] }), typescript({ tsconfig: resolve(process.cwd(), 'src', 'tsconfig.json') })]
};
`
          : `import { resolve } from 'path';
import cleaner from 'rollup-plugin-cleaner';
import typescript from 'rollup-plugin-typescript2';

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
  ],
  external: ['@joshdb/middleware'],
  plugins: [cleaner({ targets: ['./dist'] }), typescript({ tsconfig: resolve(process.cwd(), 'src', 'tsconfig.json') })]
};
`
      );

      await writeFile(
        resolvePath(name, 'tsconfig.eslint.json'),
        JSON.stringify(
          {
            extends: '../../tsconfig.base.json',
            compilerOptions: {
              allowJs: true,
              checkJs: true
            },
            include: ['src', 'tests']
          },
          null,
          2
        )
      );

      await writeFile(
        resolvePath(name, 'typedoc.json'),
        JSON.stringify(
          {
            $schema: 'https://typedoc.org/schema.json',
            entryPoints: ['src/index.ts'],
            json: 'docs/api.json',
            tsconfig: 'src/tsconfig.json',
            treatWarningsAsErrors: true
          },
          null,
          2
        )
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
            extends: '../../../tsconfig.base.json',
            compilerOptions: {
              rootDir: './',
              outDir: '../dist',
              composite: true,
              tsBuildInfoFile: '../dist/.tsbuildinfo'
            },
            include: ['.']
          },
          null,
          2
        )
      );

      await writeFile(
        resolvePath(name, 'src', 'index.ts'),
        `export * from './lib/${title}Middleware';
`
      );

      await mkdir(resolvePath(name, 'src', 'lib'));
      await writeFile(
        resolvePath(name, 'src', 'lib', `${title}Middleware.ts`),
        `import { ApplyMiddlewareOptions, Middleware } from '@joshdb/middleware';

@ApplyMiddlewareOptions({ name: '${name}' })
export class ${title}Middleware<StoredValue = unknown> extends Middleware<${title}Middleware.ContextData, StoredValue> {}

export namespace ${title}Middleware {
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
            extends: '../../../tsconfig.base.json',
            compilerOptions: {
              rootDir: './',
              outDir: './build',
              tsBuildInfoFile: './build/.tsbuildinfo'
            },
            include: ['./'],
            references: [{ path: '../src' }]
          },
          null,
          2
        )
      );

      await mkdir(resolvePath(name, 'tests', 'lib'));
      await writeFile(
        resolvePath(name, 'tests', 'lib', `${title}Middleware.test.ts`),
        `import { ${title}Middleware } from '../../src';

describe('${title}Middleware', () => {
  describe('is a class', () => {
    test('GIVEN typeof ${title}Middleware THEN returns function', () => {
      expect(typeof ${title}Middleware).toBe('function');
    });

    test('GIVEN typeof ...prototype THEN returns object', () => {
      expect(typeof ${title}Middleware.prototype).toBe('object');
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
