<div align="center">

![Josh Logo](https://evie.codes/josh-light.png)

# @joshdb/transform

**A data manipulation middleware for Josh that parses data through a before and after function to transform the data to be stored.**

[![GitHub](https://img.shields.io/github/license/josh-development/middlewares)](https://github.com/josh-development/middlewares/blob/main/LICENSE.md)
[![codecov](https://codecov.io/gh/josh-development/middlewares/branch/main/graph/badge.svg?token=JnJcjxqT3k)](https://codecov.io/gh/josh-development/middlewares)
[![npm bundle size](https://img.shields.io/bundlephobia/min/@joshdb/schema?logo=webpack&style=flat-square)](https://bundlephobia.com/result?p=@joshdb/schema)
[![npm](https://img.shields.io/npm/v/@joshdb/transform?color=crimson&logo=npm&style=flat-square)](https://www.npmjs.com/package/@joshdb/transform)

[![Support Server](https://discord.com/api/guilds/298508738623438848/embed.png?style=banner2)](https://discord.gg/N7ZKH3P)

</div>

## Description

A data manipulation middleware for Josh that parses data through a before and after function to transform the data to be stored.

## Features

- Written in TypeScript
- Offers CommonJS, ESM and UMD bundles
- Fully tested

## Installation

You can use the following command to install this package, or replace `npm install` with your package manager of choice.

```sh
npm install @joshdb/transform
```

## Middleware Context Data

```typescript
interface ContextData<BeforeValue = unknown, AfterValue = unknown> extends JoshMiddleware.Context {
  /**
   * Manipulates the data before it is stored by the provider.
   * @since 1.0.0
   */
  before: (data: BeforeValue, key: string | string[] | null, path: string[] | null) => AfterValue;

  /**
   * Normalizes the data after it is retrieved from the provider.
   * @since 1.0.0
   */
  after: (data: AfterValue, key: string | string[] | null, path: string[] | null) => BeforeValue;

  /**
   * Manipulates any existing data to the appropriate format.
   * @since 1.0.0
   * @default false
   */
  autoTransform?: boolean;
}
```
