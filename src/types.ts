/* eslint-disable @typescript-eslint/no-explicit-any */

import type { DynamicModule, Type } from '@nestjs/common'
import type { UnboxSmartConfigs } from './infer.js'
import type { ListOfUpTo } from './utils/type-helpers.js'

/**
 * Asynchronous configuration for a smart module factory, mirroring the
 * conventional NestJS `registerAsync` options shape.
 *
 * `imports` are applied to the generated config module itself, so `inject`
 * resolves from those modules even when they are not global.
 */
export interface AsyncParams<T> {
  /** Modules whose exported providers may be injected into `useFactory`. */
  imports?: DynamicModule['imports']
  /** Injection tokens resolved and passed to `useFactory` as arguments. */
  inject?: any[]
  /** Produces the configuration object (sync or async). */
  useFactory: (...args: any[]) => T | Promise<T>
}

export function isAsyncParams<T>(o: T | AsyncParams<T>): o is AsyncParams<T> {
  return typeof (o as AsyncParams<T>).useFactory === 'function'
}

/**
 * A configuration class usable in `smartConfigs`. Instance properties define
 * the configuration shape (optional properties may carry defaults); static
 * `label`, `prefix` and `token` customize namespacing and the injection
 * token.
 */
export interface SmartConfig<T = any> extends Type<T> {
  /** Prefixes every property name in the merged configuration (`db_port`). */
  prefix?: string
  /** Nests the configuration under this key in the merged object. */
  label?: string
  /** Overrides the injection token (defaults to the class itself). */
  token?: string | symbol
}
/** A smart module factory usable in `smartImports` — composes another smart module. */
export type SmartImport<T = any> = (arg: AsyncParams<T> | T) => DynamicModule
/** Inline form of {@link SmartConfig} with per-usage label/prefix/token overrides. */
export interface ExtendedSmartConfig<T = any> {
  prefix?: string
  label?: string
  token?: string | symbol
  smartConfig: SmartConfig<T>
}
/** Inline form of {@link SmartImport} that namespaces the imported module's configuration. */
export interface ExtendedSmartImport<T = any> {
  prefix?: string
  label?: string
  smartImport: SmartImport<T>
}

export function isSmartConfig(c: SmartConfig | ExtendedSmartConfig): c is SmartConfig {
  return isClass(c)
}
export function isSmartImport(c: SmartImport | ExtendedSmartImport): c is SmartImport {
  return isFunction(c) && !isClass(c)
}
export function isExtendedSmartConfig(c: SmartConfig | ExtendedSmartConfig): c is ExtendedSmartConfig {
  const candidate = (c as ExtendedSmartConfig).smartConfig
  return !!candidate && isSmartConfig(candidate)
}
export function isExtendedSmartImport(c: SmartImport | ExtendedSmartImport): c is ExtendedSmartImport {
  const candidate = (c as ExtendedSmartImport).smartImport
  return !!candidate && isSmartImport(candidate)
}

export type AnySmartConfig = SmartConfig | ExtendedSmartConfig
export type AnySmartImport = SmartImport | ExtendedSmartImport | (() => DynamicModule)
export type AnySmartEntity = AnySmartConfig | AnySmartImport

// DynamicModule's array properties with non-nullable element types, each
// offered to the caller as a UNION OF FIXED-LENGTH TUPLES up to a cap and a
// plain array past it — not as the plain array alone. The tuple shape is
// load-bearing for the most common way this library is used:
//
//   class Hub { static forRoot = smartModule({ providers: [Hub, { provide: T, useExisting: Hub }] }) }
//
// A plain-array contextual type makes TypeScript build the union of the
// literal's element types and subtype-reduce it, which reads `typeof Hub`'s
// members while `forRoot` is still being inferred — TS7022, `forRoot` becomes
// `any`, and every `Hub.forRoot(config)` downstream answers TS2554 because the
// factory then has both arities at once. A fixed-length tuple types each
// element by its position and never builds that union. Measured on a
// 335-site consumer: `[Hub]` alone is fine either way; `[Hub, anything]` in
// the class's own static fails with the array and passes with the tuples, on
// TypeScript 5.9 and 6.0 alike. (`[...T[]]` is no fix: TypeScript normalises
// it back to `T[]`.)
//
// Past the cap the plain array takes over and a self-referencing static of
// that length is back on the array's behaviour; sixteen is above any list
// measured in use and above the ten the hand-written unions used to stop at.
// spec/self-referencing-static.spec.ts holds the shape that broke.

type ImportType = NonNullable<DynamicModule['imports']>[number]
type ProviderType = NonNullable<DynamicModule['providers']>[number]
type ExportType = NonNullable<DynamicModule['exports']>[number]
type ControllerType = NonNullable<DynamicModule['controllers']>[number]

type ImportsOptions = ListOfUpTo<ImportType, 16>

type ProvidersOptions = ListOfUpTo<ProviderType, 16>

type ExportsOptions = ListOfUpTo<ExportType, 16>

type ControllersOptions = ListOfUpTo<ControllerType, 16>

//

/**
 * A module definition accepted by `smartModule`: the standard
 * `DynamicModule` properties plus `smartConfigs` (configuration classes)
 * and `smartImports` (composed smart module factories).
 */
export type SmartModule<TC extends AnySmartConfig[], TI extends AnySmartImport[]> = {
  module?: DynamicModule['module']
  providers?: ProvidersOptions
  exports?: ExportsOptions
  imports?: ImportsOptions
  controllers?: ControllersOptions
  global?: DynamicModule['global']
  smartConfigs?: [...TC]
  smartImports?: [...TI]
}

/**
 * A definition factory: receives the generated config modules and the
 * instantiated inline configs, returns a {@link SmartModule}. Invoked once
 * per factory call.
 */
export type SmartModuleFactory<T extends AnySmartConfig[], TC extends AnySmartConfig[], TI extends AnySmartImport[]> = (
  imports: DynamicModule[],
  ...smartConfigs: UnboxSmartConfigs<T>
) => SmartModule<TC, TI>

export type SmartModuleOrFactory<
  T extends AnySmartConfig[],
  TC extends AnySmartConfig[],
  TI extends AnySmartImport[],
> = SmartModuleFactory<T, TC, TI> | SmartModule<TC, TI>

export function isSmartModule<T extends AnySmartConfig[], TC extends AnySmartConfig[], TI extends AnySmartImport[]>(
  x: SmartModuleOrFactory<T, TC, TI>,
): x is SmartModule<TC, TI> {
  return !isFunction(x)
}

export function isSmartModuleFactory<
  T extends AnySmartConfig[],
  TC extends AnySmartConfig[],
  TI extends AnySmartImport[],
>(x: SmartModuleOrFactory<T, TC, TI>): x is SmartModuleFactory<T, TC, TI> {
  return isFunction(x)
}

export function isFunction(c: unknown): c is (...args: unknown[]) => unknown {
  return typeof c === 'function'
}

export function isClass(c: any): c is Type {
  return typeof c === 'function' && /^class\s/.test(Function.prototype.toString.call(c))
}
