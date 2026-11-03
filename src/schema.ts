/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AnySmartConfig, AnySmartImport, ExtendedSmartConfig, ExtendedSmartImport, SmartConfig } from './types.js'
import { isExtendedSmartImport, isSmartConfig } from './types.js'

/**
 * One configuration class of a module, as its schema records it: the class
 * itself and the label and prefix it is read under, an inline override
 * already resolved against the class's own statics.
 */
export interface SmartSchemaConfig<C extends SmartConfig = SmartConfig> {
  readonly config: C
  readonly label?: string
  readonly prefix?: string
}

/**
 * One composed import of a module, as its schema records it: the label and
 * prefix it is namespaced under, and the imported module's own schema —
 * `undefined` when the import is a plain factory `smartModule` did not build.
 */
export interface SmartSchemaImport<S extends SmartSchema<any, any> | undefined = SmartSchema<any, any> | undefined> {
  readonly label?: string
  readonly prefix?: string
  readonly schema: S
}

/**
 * What a smart module factory was composed from, as a tree: its configuration
 * classes in the order they are instantiated, and the schema of every smart
 * import beside the namespace it was imported under.
 *
 * It is read off the factory without calling it, so a definition factory
 * contributes only its inline configuration classes — the `smartConfigs` and
 * `smartImports` its function returns exist only once the function runs.
 */
export interface SmartSchema<
  C extends readonly SmartSchemaConfig[] = readonly SmartSchemaConfig[],
  I extends readonly SmartSchemaImport<any>[] = readonly SmartSchemaImport<any>[],
> {
  readonly configs: C
  readonly imports: I
}

type SchemaConfigOf<T> =
  T extends ExtendedSmartConfig<any>
    ? SmartSchemaConfig<T['smartConfig']>
    : T extends SmartConfig
      ? SmartSchemaConfig<T>
      : never
type SchemaOfFactory<T> = T extends { readonly schema: infer S extends SmartSchema<any, any> } ? S : undefined
type SchemaImportOf<T> =
  T extends ExtendedSmartImport<any>
    ? SmartSchemaImport<SchemaOfFactory<T['smartImport']>>
    : SmartSchemaImport<SchemaOfFactory<T>>

// Mapped over the tuple element by element, like `UnboxSmartConfigs`, so a
// long list costs one instantiation; a non-tuple array keeps the wide form.
type SchemaConfigsOf<A extends any[]> = A extends []
  ? []
  : A extends [unknown, ...unknown[]]
    ? { [K in keyof A]: SchemaConfigOf<A[K]> }
    : SmartSchemaConfig[]
type SchemaImportsOf<A extends any[]> = A extends []
  ? []
  : A extends [unknown, ...unknown[]]
    ? { [K in keyof A]: SchemaImportOf<A[K]> }
    : SmartSchemaImport[]

/** The schema type of a module composed from the given configs and imports. */
export type InferSmartSchema<TC extends AnySmartConfig[], TI extends AnySmartImport[]> = SmartSchema<
  SchemaConfigsOf<TC>,
  SchemaImportsOf<TI>
>

/** The `schema` property every factory `smartModule` returns carries. */
export interface WithSmartSchema<S extends SmartSchema> {
  readonly schema: S
}

function schemaConfigOf(config: AnySmartConfig): SmartSchemaConfig {
  if (isSmartConfig(config)) {
    return { config, label: config.label, prefix: config.prefix }
  }

  // Resolved exactly as `instantiateExtendedSmartConfig` resolves it.
  return {
    config: config.smartConfig,
    label: typeof config.label === 'string' ? config.label : config.smartConfig.label,
    prefix: typeof config.prefix === 'string' ? config.prefix : config.smartConfig.prefix,
  }
}

function schemaOfFactory(factory: unknown): SmartSchema | undefined {
  return (factory as Partial<WithSmartSchema<SmartSchema>>).schema
}

function schemaImportOf(smartImport: AnySmartImport): SmartSchemaImport {
  if (isExtendedSmartImport(smartImport)) {
    return { label: smartImport.label, prefix: smartImport.prefix, schema: schemaOfFactory(smartImport.smartImport) }
  }

  return { schema: schemaOfFactory(smartImport) }
}

/**
 * Gives `factory` its `schema`, built on first read and kept: reading it
 * walks only what the definition already holds, so a factory nobody asks
 * costs nothing and an invalid entry fails where it always did — when the
 * factory is called.
 */
export function attachSchema<F extends object>(
  factory: F,
  configs: readonly AnySmartConfig[],
  imports: readonly AnySmartImport[],
): F {
  let schema: SmartSchema | undefined

  return Object.defineProperty(factory, 'schema', {
    enumerable: true,
    get() {
      schema ??= { configs: configs.map(schemaConfigOf), imports: imports.map(schemaImportOf) }
      return schema
    },
  })
}
