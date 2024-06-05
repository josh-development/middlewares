<div align="center">

![Josh Logo](https://evie.codes/josh-light.png)

# @joshdb/cache

**An auto ensure middleware for Josh.**

[![GitHub](https://img.shields.io/github/license/josh-development/middlewares)](https://github.com/josh-development/middlewares/blob/main/LICENSE.md)
[![codecov](https://codecov.io/gh/josh-development/middlewares/branch/main/graph/badge.svg?token=JnJcjxqT3k)](https://codecov.io/gh/josh-development/middlewares)
[![npm bundle size](https://img.shields.io/bundlephobia/min/@joshdb/cache?logo=webpack&style=flat-square)](https://bundlephobia.com/result?p=@joshdb/cache)
[![npm](https://img.shields.io/npm/v/@joshdb/cache?color=crimson&logo=npm&style=flat-square)](https://www.npmjs.com/package/@joshdb/cache)

[![Support Server](https://discord.com/api/guilds/298508738623438848/embed.png?style=banner2)](https://discord.gg/N7ZKH3P)

</div>

## Description

A cache middleware for Josh.

## Features

- Written in TypeScript
- Offers CommonJS, ESM and UMD bundles
- Fully tested

## Installation

You can use the following command to install this package, or replace `npm install` with your package manager of choice.

```sh
npm install @joshdb/cache
```

## Middleware Context Data

```typescript
interface ContextData<StoredValue = unknown> {
  /**
   * The JoshProvider to use for cache
   * @since 1.0.0
   */
  provider: JoshProvider<Document<StoredValue>>;

  /**
   * When true, fetches all entries from the provider on startup
   * @since 1.0.0
   * @default true
   */
  fetchAll: boolean;

  /**
   * When enabled fetches from the cache provider on a set interval
   * @since 1.0.0
   */
  polling?: PollingOptions;

  /**
   * When enabled invalidates entries from the cache provider when they expire
   * @since 1.0.0
   */
  ttl?: TTLOptions;
}
```
