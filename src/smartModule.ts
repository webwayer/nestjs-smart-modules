import type { DynamicModule } from '@nestjs/common'

import {
  instantiateSmartConfig,
  instantiateExtendedSmartConfig,
  moduleFromSmartConfig,
  moduleFromSmartImport,
} from './modules.js'
import { appendImports, createNamedClass } from './utils/helpers.js'
import type {
  AsyncParams,
  AnySmartConfig,
  AnySmartImport,
  SmartModule,
  SmartModuleFactory,
  SmartModuleOrFactory,
} from './types.js'
import { isAsyncParams, isSmartConfig, isSmartModule } from './types.js'
import type { InferSmartFactory } from './infer.js'
import { attachSchema } from './schema.js'
import type { InferSmartSchema, WithSmartSchema } from './schema.js'

/**
 * Turns a module definition into a configurable module factory.
 *
 * The returned factory accepts the merged configuration of every
 * `smartConfigs` class and every composed `smartImports` factory in the
 * tree, and produces a NestJS {@link DynamicModule}. Configuration can be
 * passed synchronously (a plain object) or asynchronously (an
 * {@link AsyncParams} object with `useFactory`/`inject`/`imports`).
 *
 * Inline config classes may precede the definition when it is a factory
 * function — their instantiated values are passed to the factory so the
 * module definition can depend on resolved configuration.
 *
 * Each factory call creates its own `DynamicModule` (and therefore its own
 * provider instances) unless the definition declares `shared: true`, which
 * builds the module once per configuration object; the merged configuration
 * is delivered identically to every branch of the tree.
 *
 * @example
 * ```ts
 * class DatabaseConfig {
 *   url: string
 * }
 *
 * @Injectable()
 * class DatabaseService {
 *   static smartModule = smartModule({
 *     smartConfigs: [DatabaseConfig],
 *     providers: [DatabaseService],
 *     exports: [DatabaseService],
 *   })
 *
 *   constructor(private readonly config: DatabaseConfig) {}
 * }
 *
 * // in AppModule: imports: [DatabaseService.smartModule({ url: 'postgres://…' })]
 * ```
 *
 * @param args - Optional inline {@link AnySmartConfig} classes followed by a
 *   module definition object or a definition factory
 *   `(imports, ...configs) => SmartModule`.
 * @returns A factory `(config) => DynamicModule` whose parameter type is
 *   inferred from every config class and composed import in the definition.
 */
export function smartModule<
  T extends AnySmartConfig[] = [],
  TC extends AnySmartConfig[] = [],
  TI extends AnySmartImport[] = [],
>(
  ...args: [...T, SmartModule<[...TC], [...TI]>]
): InferSmartFactory<[...T, ...TC, ...TI]> & WithSmartSchema<InferSmartSchema<[...T, ...TC], [...TI]>>
/**
 * Definition factory: the returned factory's `schema` holds only the inline
 * config classes, since what the function returns exists only once it runs.
 */
export function smartModule<
  T extends AnySmartConfig[] = [],
  TC extends AnySmartConfig[] = [],
  TI extends AnySmartImport[] = [],
>(
  ...args: [...T, SmartModuleFactory<[...T], [...TC], [...TI]>]
): InferSmartFactory<[...T, ...TC, ...TI]> & WithSmartSchema<InferSmartSchema<[...T], []>>
/**
 * Definition without smart configs or smart imports: the returned factory
 * takes no configuration argument.
 */
export function smartModule(
  moduleOrModuleDefinitionFn: SmartModuleOrFactory<[], [], []>,
): (() => DynamicModule) & WithSmartSchema<InferSmartSchema<[], []>>
export function smartModule(...args: unknown[]) {
  const inlineSmartConfigs = args.slice(0, args.length - 1) as AnySmartConfig[]
  const smartModuleOrFactory = args[args.length - 1] as SmartModuleOrFactory<
    AnySmartConfig[],
    AnySmartConfig[],
    AnySmartImport[]
  >

  // The module each configuration object was given, for a definition that
  // declares `shared`: NestJS registers one DynamicModule object once, however
  // many branches import it.
  const sharedModules = new WeakMap<object, DynamicModule>()

  const factory = function (this: { name?: string } | undefined, arg?: object | AsyncParams<object>) {
    // A tree that takes no configuration is still one tree: the object made
    // here is what every import beneath this call is handed and keyed by.
    const config = arg ?? {}
    const inlineSmartConfigModules = inlineSmartConfigs.map(c => moduleFromSmartConfig(c, config))

    const { shared, smartConfigs, smartImports, ...nestModule } = isSmartModule(smartModuleOrFactory)
      ? smartModuleOrFactory
      : isAsyncParams(config)
        ? smartModuleOrFactory(inlineSmartConfigModules)
        : smartModuleOrFactory(
            inlineSmartConfigModules,
            // Instantiated config objects; the factory's variadic parameter is
            // typed through UnboxSmartConfigs on the overload side, so the
            // untyped implementation casts here.
            ...(inlineSmartConfigs.map(c =>
              isSmartConfig(c) ? instantiateSmartConfig(c, config) : instantiateExtendedSmartConfig(c, config),
            ) as AnySmartConfig[]),
          )

    const built = shared ? sharedModules.get(config) : undefined

    if (built) {
      return built
    }

    // `shared`, `smartConfigs` and `smartImports` are read here and stay here:
    // NestJS is handed the keys of a DynamicModule and nothing else.
    const module = appendImports({ module: createNamedClass((this?.name || '') + 'SmartModule'), ...nestModule }, [
      ...inlineSmartConfigModules,
      ...(smartConfigs ?? []).map(c => moduleFromSmartConfig(c, config)),
      ...(smartImports ?? []).map(c => moduleFromSmartImport(c, config)),
    ])

    if (shared) {
      sharedModules.set(config, module)
    }

    return module
  }

  const definition = isSmartModule(smartModuleOrFactory) ? smartModuleOrFactory : {}

  return attachSchema(
    factory,
    [...inlineSmartConfigs, ...(definition.smartConfigs ?? [])],
    definition.smartImports ?? [],
  )
}
