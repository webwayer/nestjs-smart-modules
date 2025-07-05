/* eslint-disable @typescript-eslint/no-explicit-any */

import { DynamicModule, Type } from '@nestjs/common'

import { Unbox, Spread } from './utils/type-helpers'
import { AsyncParams, AnySmartConfig, AnySmartEntity } from './types'

interface SmartConfig<T = any> extends Type<T> {
  token?: string
}
type SmartImport<T = any> = (arg: AsyncParams<T> | T) => DynamicModule

interface ExtendedSmartConfig<T = any> {
  token?: string
  smartConfig: SmartConfig<T>
}
interface ExtendedSmartImport<T = any> {
  smartImport: SmartImport<T>
}

interface Labeled<L extends string> {
  label: L
}
interface Prefixed<P extends string> {
  prefix: P
}

export type PrefixProps<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : never]: T[K]
}
export type LabelProps<T, L extends string> = Record<L, T>

export type InferSmartConfig<T> = T extends SmartConfig<infer U> & Labeled<infer L> & Prefixed<infer P>
  ? LabelProps<PrefixProps<U, P>, L>
  : T extends SmartConfig<infer U> & Labeled<infer L>
    ? LabelProps<U, L>
    : T extends SmartConfig<infer U> & Prefixed<infer P>
      ? PrefixProps<U, P>
      : T extends SmartConfig<infer U>
        ? U
        : never
export type InferSmartImport<T> = T extends SmartImport<infer U> ? (U extends object ? U : null) : never
export type InferExtendedSmartConfig<T> = T extends ExtendedSmartConfig<infer U> & Labeled<infer L> & Prefixed<infer P>
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
export type InferExtendedSmartImport<T> = T extends ExtendedSmartImport & Labeled<infer L> & Prefixed<infer P>
  ? LabelProps<PrefixProps<InferSmartImport<T['smartImport']>, P>, L>
  : T extends ExtendedSmartImport & Labeled<infer L>
    ? LabelProps<InferSmartImport<T['smartImport']>, L>
    : T extends ExtendedSmartImport & Prefixed<infer P>
      ? PrefixProps<InferSmartImport<T['smartImport']>, P>
      : T extends ExtendedSmartImport
        ? InferSmartImport<T['smartImport']>
        : never

type UnboxSmartConfigProps<T> = T extends SmartConfig<infer U> | ExtendedSmartConfig<infer U> ? Unbox<U> : null
type UnboxSmartConfigPropsArray<A extends any[]> = A extends [infer L, ...infer R]
  ? [UnboxSmartConfigProps<L>, ...UnboxSmartConfigPropsArray<R>]
  : A
export type UnboxSmartConfigs<T extends AnySmartConfig[]> = UnboxSmartConfigPropsArray<T>

export type InferSmartEntity<T> = T extends () => DynamicModule
  ? {}
  : T extends SmartConfig
    ? InferSmartConfig<T>
    : T extends ExtendedSmartConfig
      ? InferExtendedSmartConfig<T>
      : T extends SmartImport
        ? InferSmartImport<T>
        : T extends ExtendedSmartImport
          ? InferExtendedSmartImport<T>
          : never
export type InferSmartEntities<A extends any[]> = A extends [infer L, ...infer R]
  ? [InferSmartEntity<L>, ...InferSmartEntities<R>]
  : A

export type InferSmartFactoryProps<T extends Array<AnySmartEntity>> = Unbox<Spread<InferSmartEntities<T>>>
export type InferSmartFactory<T extends Array<AnySmartEntity>> =
  T extends Array<() => DynamicModule>
    ? () => DynamicModule
    : (arg: InferSmartFactoryProps<T> | AsyncParams<InferSmartFactoryProps<T>>) => DynamicModule
