/* eslint-disable @typescript-eslint/no-explicit-any */

import { DynamicModule, Type } from '@nestjs/common'
import { UnboxSmartConfigs } from './infer'

export interface AsyncParams<T> {
  imports?: DynamicModule['imports']
  inject?: any[]
  useFactory: (...args: any[]) => T | Promise<T>
}

export function isAsyncParams<T>(o: T | AsyncParams<T>): o is AsyncParams<T> {
  return typeof o['useFactory'] === 'function'
}

export interface SmartConfig extends Type {
  prefix?: string
  label?: string
  token?: string
}
export type SmartImport<T = any> = (arg: AsyncParams<T> | T) => DynamicModule
export interface ExtendedSmartConfig {
  prefix?: string
  label?: string
  token?: string
  smartConfig: SmartConfig
}
export interface ExtendedSmartImport {
  prefix?: string
  label?: string
  smartImport: SmartImport
}

export function isSmartConfig(c: SmartConfig | ExtendedSmartConfig): c is SmartConfig {
  return isClass(c)
}
export function isSmartImport(c: SmartImport | ExtendedSmartImport): c is SmartImport {
  return isFunction(c) && !isClass(c)
}
export function isExtendedSmartConfig(c: SmartConfig | ExtendedSmartConfig): c is ExtendedSmartConfig {
  return !!c['smartConfig'] && isSmartConfig(c['smartConfig'])
}
export function isExtendedSmartImport(c: SmartImport | ExtendedSmartImport): c is ExtendedSmartImport {
  return !!c['smartImport'] && isSmartImport(c['smartImport'])
}

export type AnySmartConfig = SmartConfig | ExtendedSmartConfig
export type AnySmartImport = SmartImport | ExtendedSmartImport | (() => DynamicModule)
export type AnySmartEntity = AnySmartConfig | AnySmartImport

// This is a hack and I don't kwno why it's needed
// but it's needed to make the type checker happy
// when using the factory pattern and factory function returns module with more than 1 export or provider (I guess import/controller too) ts infer smart module factory as any
// but if expected array is a tuple then it's fine
// I have no idea why this is the case

type ImportType = DynamicModule['imports'][number]
type ProviderType = DynamicModule['providers'][number]
type ExportType = DynamicModule['exports'][number]
type ControllerType = DynamicModule['controllers'][number]

type ImportsOptions =
  | []
  | [ImportType]
  | [ImportType, ImportType]
  | [ImportType, ImportType, ImportType]
  | [ImportType, ImportType, ImportType, ImportType]
  | [ImportType, ImportType, ImportType, ImportType, ImportType]
  | [ImportType, ImportType, ImportType, ImportType, ImportType, ImportType]
  | [ImportType, ImportType, ImportType, ImportType, ImportType, ImportType, ImportType]
  | [ImportType, ImportType, ImportType, ImportType, ImportType, ImportType, ImportType, ImportType]
  | [ImportType, ImportType, ImportType, ImportType, ImportType, ImportType, ImportType, ImportType, ImportType]
  | [
      ImportType,
      ImportType,
      ImportType,
      ImportType,
      ImportType,
      ImportType,
      ImportType,
      ImportType,
      ImportType,
      ImportType,
    ]
  | ImportType[]

type ProvidersOptions =
  | []
  | [ProviderType]
  | [ProviderType, ProviderType]
  | [ProviderType, ProviderType, ProviderType]
  | [ProviderType, ProviderType, ProviderType, ProviderType]
  | [ProviderType, ProviderType, ProviderType, ProviderType, ProviderType]
  | [ProviderType, ProviderType, ProviderType, ProviderType, ProviderType, ProviderType]
  | [ProviderType, ProviderType, ProviderType, ProviderType, ProviderType, ProviderType, ProviderType]
  | [ProviderType, ProviderType, ProviderType, ProviderType, ProviderType, ProviderType, ProviderType, ProviderType]
  | [
      ProviderType,
      ProviderType,
      ProviderType,
      ProviderType,
      ProviderType,
      ProviderType,
      ProviderType,
      ProviderType,
      ProviderType,
    ]
  | [
      ProviderType,
      ProviderType,
      ProviderType,
      ProviderType,
      ProviderType,
      ProviderType,
      ProviderType,
      ProviderType,
      ProviderType,
      ProviderType,
    ]
  | ProviderType[]

type ExportsOptions =
  | [...ExportType[]]
  | []
  | [ExportType]
  | [ExportType, ExportType]
  | [ExportType, ExportType, ExportType]
  | [ExportType, ExportType, ExportType, ExportType]
  | [ExportType, ExportType, ExportType, ExportType, ExportType]
  | [ExportType, ExportType, ExportType, ExportType, ExportType, ExportType]
  | [ExportType, ExportType, ExportType, ExportType, ExportType, ExportType, ExportType]
  | [ExportType, ExportType, ExportType, ExportType, ExportType, ExportType, ExportType, ExportType]
  | [ExportType, ExportType, ExportType, ExportType, ExportType, ExportType, ExportType, ExportType, ExportType]
  | [
      ExportType,
      ExportType,
      ExportType,
      ExportType,
      ExportType,
      ExportType,
      ExportType,
      ExportType,
      ExportType,
      ExportType,
    ]
  | ExportType[]

type ControllersOptions =
  | []
  | [ControllerType]
  | [ControllerType, ControllerType]
  | [ControllerType, ControllerType, ControllerType]
  | [ControllerType, ControllerType, ControllerType, ControllerType]
  | [ControllerType, ControllerType, ControllerType, ControllerType, ControllerType]
  | [ControllerType, ControllerType, ControllerType, ControllerType, ControllerType, ControllerType]
  | [ControllerType, ControllerType, ControllerType, ControllerType, ControllerType, ControllerType, ControllerType]
  | [
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
    ]
  | [
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
    ]
  | [
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
    ]
  | [
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
      ControllerType,
    ]
  | ControllerType[]

//

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

export function isFunction(c: any): c is Function {
  return typeof c === 'function'
}

export function isClass(c: any): c is Type {
  return typeof c === 'function' && /^class\s/.test(Function.prototype.toString.call(c))
}
