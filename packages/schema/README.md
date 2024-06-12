<div align="center">

![Josh Logo](https://evie.codes/josh-light.png)

# @joshdb/schema

**An auto ensure middleware for Josh.**

[![GitHub](https://img.shields.io/github/license/josh-development/middlewares)](https://github.com/josh-development/middlewares/blob/main/LICENSE.md)
[![codecov](https://codecov.io/gh/josh-development/middlewares/branch/main/graph/badge.svg?token=JnJcjxqT3k)](https://codecov.io/gh/josh-development/middlewares)
[![npm bundle size](https://img.shields.io/bundlephobia/min/@joshdb/schema?logo=webpack&style=flat-square)](https://bundlephobia.com/result?p=@joshdb/schema)
[![npm](https://img.shields.io/npm/v/@joshdb/schema?color=crimson&logo=npm&style=flat-square)](https://www.npmjs.com/package/@joshdb/schema)

</div>

## Description

A schema validation middleware for Josh.

## Features

- Written in TypeScript
- Offers CommonJS, ESM and UMD bundles
- Fully tested

## Installation

You can use the following command to install this package, or replace `npm install` with your package manager of choice. This package uses [`@sapphire/shapeshift`](https://www.npmjs.com/package/@sapphire/shapeshift) for schema validation, so you'll want to reference their documentation for more information on how to use it.

```sh
npm install @joshdb/schema@next @sapphire/shapeshift
```

## Middleware Context Data

```typescript
interface ContextData<StoredValue = unknown> {
  /**
   * The schema used to parse and validate data.
   * @since 1.0.0
   */
  schema: BaseValidator<StoredValue>;
}
```
