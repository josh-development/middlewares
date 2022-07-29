<div align="center">

![Josh Logo](https://evie.codes/josh-light.png)

# @joshdb/auto-ensure

**An auto ensure middleware for Josh.**

[![GitHub](https://img.shields.io/github/license/josh-development/middlewares)](https://github.com/josh-development/middlewares/blob/main/LICENSE.md)
[![codecov](https://codecov.io/gh/josh-development/middlewares/branch/main/graph/badge.svg?token=JnJcjxqT3k)](https://codecov.io/gh/josh-development/middlewares)
[![npm](https://img.shields.io/npm/v/@joshdb/auto-ensure?color=crimson&logo=npm&style=flat-square)](https://www.npmjs.com/package/@joshdb/auto-ensure)

[![Support Server](https://discord.com/api/guilds/298508738623438848/embed.png?style=banner2)](https://discord.gg/N7ZKH3P)

</div>

## Description

An auto ensure middleware for Josh.

## Features

- Written in TypeScript
- Offers CommonJS, ESM and UMD bundles
- Fully tested

## Installation

You can use the following command to install this package, or replace `npm install` with your package manager of choice.

```sh
npm install @joshdb/auto-ensure
```

## Middleware Context Data

```typescript
interface ContextData<StoredValue = unknown> {
  /**
   * The default value to set if the key does not exist.
   * @since 1.0.0
   */
  defaultValue: StoredValue;

  /**
   * Whether to merge the `ContextData#defaultValue` with existing values.
   * @since 1.0.0
   */
  ensureProperties?: boolean;
}
```
