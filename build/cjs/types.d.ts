import type { DynamicModule, Type } from '@nestjs/common';
import type { UnboxSmartConfigs } from './infer.js';
/**
 * Asynchronous configuration for a smart module factory, mirroring the
 * conventional NestJS `registerAsync` options shape.
 *
 * `imports` are applied to the generated config module itself, so `inject`
 * resolves from those modules even when they are not global.
 */
export interface AsyncParams<T> {
    /** Modules whose exported providers may be injected into `useFactory`. */
    imports?: DynamicModule['imports'];
    /** Injection tokens resolved and passed to `useFactory` as arguments. */
    inject?: any[];
    /** Produces the configuration object (sync or async). */
    useFactory: (...args: any[]) => T | Promise<T>;
}
export declare function isAsyncParams<T>(o: T | AsyncParams<T>): o is AsyncParams<T>;
/**
 * A configuration class usable in `smartConfigs`. Instance properties define
 * the configuration shape (optional properties may carry defaults); static
 * `label`, `prefix` and `token` customize namespacing and the injection
 * token.
 */
export interface SmartConfig<T = any> extends Type<T> {
    /** Prefixes every property name in the merged configuration (`db_port`). */
    prefix?: string;
    /** Nests the configuration under this key in the merged object. */
    label?: string;
    /** Overrides the injection token (defaults to the class itself). */
    token?: string | symbol;
}
/** A smart module factory usable in `smartImports` — composes another smart module. */
export type SmartImport<T = any> = (arg: AsyncParams<T> | T) => DynamicModule;
/** Inline form of {@link SmartConfig} with per-usage label/prefix/token overrides. */
export interface ExtendedSmartConfig<T = any> {
    prefix?: string;
    label?: string;
    token?: string | symbol;
    smartConfig: SmartConfig<T>;
}
/** Inline form of {@link SmartImport} that namespaces the imported module's configuration. */
export interface ExtendedSmartImport<T = any> {
    prefix?: string;
    label?: string;
    smartImport: SmartImport<T>;
}
export declare function isSmartConfig(c: SmartConfig | ExtendedSmartConfig): c is SmartConfig;
export declare function isSmartImport(c: SmartImport | ExtendedSmartImport): c is SmartImport;
export declare function isExtendedSmartConfig(c: SmartConfig | ExtendedSmartConfig): c is ExtendedSmartConfig;
export declare function isExtendedSmartImport(c: SmartImport | ExtendedSmartImport): c is ExtendedSmartImport;
export type AnySmartConfig = SmartConfig | ExtendedSmartConfig;
export type AnySmartImport = SmartImport | ExtendedSmartImport | (() => DynamicModule);
export type AnySmartEntity = AnySmartConfig | AnySmartImport;
type ImportType = NonNullable<DynamicModule['imports']>[number];
type ProviderType = NonNullable<DynamicModule['providers']>[number];
type ExportType = NonNullable<DynamicModule['exports']>[number];
type ControllerType = NonNullable<DynamicModule['controllers']>[number];
type ImportsOptions = [] | [ImportType] | [ImportType, ImportType] | [ImportType, ImportType, ImportType] | [ImportType, ImportType, ImportType, ImportType] | [ImportType, ImportType, ImportType, ImportType, ImportType] | [ImportType, ImportType, ImportType, ImportType, ImportType, ImportType] | [ImportType, ImportType, ImportType, ImportType, ImportType, ImportType, ImportType] | [ImportType, ImportType, ImportType, ImportType, ImportType, ImportType, ImportType, ImportType] | [ImportType, ImportType, ImportType, ImportType, ImportType, ImportType, ImportType, ImportType, ImportType] | [
    ImportType,
    ImportType,
    ImportType,
    ImportType,
    ImportType,
    ImportType,
    ImportType,
    ImportType,
    ImportType,
    ImportType
] | ImportType[];
type ProvidersOptions = [] | [ProviderType] | [ProviderType, ProviderType] | [ProviderType, ProviderType, ProviderType] | [ProviderType, ProviderType, ProviderType, ProviderType] | [ProviderType, ProviderType, ProviderType, ProviderType, ProviderType] | [ProviderType, ProviderType, ProviderType, ProviderType, ProviderType, ProviderType] | [ProviderType, ProviderType, ProviderType, ProviderType, ProviderType, ProviderType, ProviderType] | [ProviderType, ProviderType, ProviderType, ProviderType, ProviderType, ProviderType, ProviderType, ProviderType] | [
    ProviderType,
    ProviderType,
    ProviderType,
    ProviderType,
    ProviderType,
    ProviderType,
    ProviderType,
    ProviderType,
    ProviderType
] | [
    ProviderType,
    ProviderType,
    ProviderType,
    ProviderType,
    ProviderType,
    ProviderType,
    ProviderType,
    ProviderType,
    ProviderType,
    ProviderType
] | ProviderType[];
type ExportsOptions = [...ExportType[]] | [] | [ExportType] | [ExportType, ExportType] | [ExportType, ExportType, ExportType] | [ExportType, ExportType, ExportType, ExportType] | [ExportType, ExportType, ExportType, ExportType, ExportType] | [ExportType, ExportType, ExportType, ExportType, ExportType, ExportType] | [ExportType, ExportType, ExportType, ExportType, ExportType, ExportType, ExportType] | [ExportType, ExportType, ExportType, ExportType, ExportType, ExportType, ExportType, ExportType] | [ExportType, ExportType, ExportType, ExportType, ExportType, ExportType, ExportType, ExportType, ExportType] | [
    ExportType,
    ExportType,
    ExportType,
    ExportType,
    ExportType,
    ExportType,
    ExportType,
    ExportType,
    ExportType,
    ExportType
] | ExportType[];
type ControllersOptions = [] | [ControllerType] | [ControllerType, ControllerType] | [ControllerType, ControllerType, ControllerType] | [ControllerType, ControllerType, ControllerType, ControllerType] | [ControllerType, ControllerType, ControllerType, ControllerType, ControllerType] | [ControllerType, ControllerType, ControllerType, ControllerType, ControllerType, ControllerType] | [ControllerType, ControllerType, ControllerType, ControllerType, ControllerType, ControllerType, ControllerType] | [
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType
] | [
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType
] | [
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType,
    ControllerType
] | [
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
    ControllerType
] | ControllerType[];
/**
 * A module definition accepted by `smartModule`: the standard
 * `DynamicModule` properties plus `smartConfigs` (configuration classes)
 * and `smartImports` (composed smart module factories).
 */
export type SmartModule<TC extends AnySmartConfig[], TI extends AnySmartImport[]> = {
    module?: DynamicModule['module'];
    providers?: ProvidersOptions;
    exports?: ExportsOptions;
    imports?: ImportsOptions;
    controllers?: ControllersOptions;
    global?: DynamicModule['global'];
    smartConfigs?: [...TC];
    smartImports?: [...TI];
};
/**
 * A definition factory: receives the generated config modules and the
 * instantiated inline configs, returns a {@link SmartModule}. Invoked once
 * per factory call.
 */
export type SmartModuleFactory<T extends AnySmartConfig[], TC extends AnySmartConfig[], TI extends AnySmartImport[]> = (imports: DynamicModule[], ...smartConfigs: UnboxSmartConfigs<T>) => SmartModule<TC, TI>;
export type SmartModuleOrFactory<T extends AnySmartConfig[], TC extends AnySmartConfig[], TI extends AnySmartImport[]> = SmartModuleFactory<T, TC, TI> | SmartModule<TC, TI>;
export declare function isSmartModule<T extends AnySmartConfig[], TC extends AnySmartConfig[], TI extends AnySmartImport[]>(x: SmartModuleOrFactory<T, TC, TI>): x is SmartModule<TC, TI>;
export declare function isSmartModuleFactory<T extends AnySmartConfig[], TC extends AnySmartConfig[], TI extends AnySmartImport[]>(x: SmartModuleOrFactory<T, TC, TI>): x is SmartModuleFactory<T, TC, TI>;
export declare function isFunction(c: unknown): c is (...args: unknown[]) => unknown;
export declare function isClass(c: any): c is Type;
export {};
//# sourceMappingURL=types.d.ts.map