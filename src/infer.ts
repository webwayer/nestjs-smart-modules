/* eslint-disable @typescript-eslint/no-explicit-any */

import type { DynamicModule } from '@nestjs/common'

import type { Unbox, Spread } from './utils/type-helpers.js'
import type {
  AsyncParams,
  AnySmartConfig,
  AnySmartEntity,
  SmartConfig,
  SmartImport,
  ExtendedSmartConfig,
  ExtendedSmartImport,
} from './types.js'

interface Labeled<L extends string> {
  label: L
}
interface Prefixed<P extends string> {
  prefix: P
}

type PrefixProps<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : never]: T[K]
}
type LabelProps<T, L extends string> = Record<L, T>

type InferSmartConfig<T> = T extends SmartConfig<infer U> & Labeled<infer L> & Prefixed<infer P>
  ? LabelProps<PrefixProps<U, P>, L>
  : T extends SmartConfig<infer U> & Labeled<infer L>
    ? LabelProps<U, L>
    : T extends SmartConfig<infer U> & Prefixed<infer P>
      ? PrefixProps<U, P>
      : T extends SmartConfig<infer U>
        ? U
        : never
type InferSmartImport<T> = T extends SmartImport<infer U> ? (U extends object ? U : null) : never
type InferExtendedSmartConfig<T> = T extends ExtendedSmartConfig<infer U> & Labeled<infer L> & Prefixed<infer P>
  ? LabelProps<PrefixProps<U, P>, L>
  : T extends ExtendedSmartConfig<infer U> & { smartConfig: Prefixed<infer P> } & Labeled<infer L>
    ? LabelProps<PrefixProps<U, P>, L>
    : T extends ExtendedSmartConfig<infer U> & Labeled<infer L>
      ? LabelProps<U, L>
      : T extends ExtendedSmartConfig<infer U> & { smartConfig: Labeled<infer L> } & Prefixed<infer P>
        ? LabelProps<PrefixProps<U, P>, L>
        : T extends ExtendedSmartConfig<infer U> & Prefixed<infer P>
          ? PrefixProps<U, P>
          : T extends ExtendedSmartConfig
            ? InferSmartConfig<T['smartConfig']>
            : never
type InferExtendedSmartImport<T> = T extends ExtendedSmartImport & Labeled<infer L> & Prefixed<infer P>
  ? LabelProps<PrefixProps<InferSmartImport<T['smartImport']>, P>, L>
  : T extends ExtendedSmartImport & Labeled<infer L>
    ? LabelProps<InferSmartImport<T['smartImport']>, L>
    : T extends ExtendedSmartImport & Prefixed<infer P>
      ? PrefixProps<InferSmartImport<T['smartImport']>, P>
      : T extends ExtendedSmartImport
        ? InferSmartImport<T['smartImport']>
        : never

type UnboxSmartConfigProps<T> = T extends SmartConfig<infer U> | ExtendedSmartConfig<infer U> ? Unbox<U> : null
// A homomorphic mapped type over a tuple maps element by element with no recursion,
// so a list of any length costs one instantiation; peeling the tuple head by tail
// instead used to hit TypeScript's depth limit at about fifty entries (TS2589).
// The guard keeps a non-tuple array (and `any`) answering itself, as the recursion did.
type UnboxSmartConfigPropsArray<A extends any[]> = A extends [unknown, ...unknown[]]
  ? { [K in keyof A]: UnboxSmartConfigProps<A[K]> }
  : A
/** Instance types of the given config classes, in order (factory arguments). */
export type UnboxSmartConfigs<T extends AnySmartConfig[]> = UnboxSmartConfigPropsArray<T>

type InferSmartEntity<T> = T extends () => DynamicModule
  ? // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- {} is the identity element for Spread
    {}
  : T extends SmartConfig
    ? InferSmartConfig<T>
    : T extends ExtendedSmartConfig
      ? InferExtendedSmartConfig<T>
      : T extends SmartImport
        ? InferSmartImport<T>
        : T extends ExtendedSmartImport
          ? InferExtendedSmartImport<T>
          : never
// Mapped for the same reason as `UnboxSmartConfigPropsArray` above.
type InferSmartEntities<A extends any[]> = A extends [unknown, ...unknown[]]
  ? { [K in keyof A]: InferSmartEntity<A[K]> }
  : A

/** The merged configuration object type for the given configs and imports. */
export type InferSmartFactoryProps<T extends Array<AnySmartEntity>> = Unbox<Spread<InferSmartEntities<T>>>
/** The factory signature produced by `smartModule` for the given configs and imports. */
export type InferSmartFactory<T extends Array<AnySmartEntity>> =
  T extends Array<() => DynamicModule>
    ? () => DynamicModule
    : (arg: InferSmartFactoryProps<T> | AsyncParams<InferSmartFactoryProps<T>>) => DynamicModule
