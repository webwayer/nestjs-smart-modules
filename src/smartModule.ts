import type { DynamicModule } from '@nestjs/common'

import {
  instantiateSmartConfig,
  instantiateExtendedSmartConfig,
  moduleFromSmartConfig,
  moduleFromSmartImport,
} from './modules.js'
import { appendImports, createNamedClass } from './utils/helpers.js'
import type { AsyncParams, AnySmartConfig, AnySmartImport, SmartModuleOrFactory } from './types.js'
import { isAsyncParams, isSmartConfig, isSmartModule } from './types.js'
import type { InferSmartFactory } from './infer.js'

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
 * provider instances); the merged configuration is delivered identically to
 * every branch of the tree.
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
>(...args: [...T, SmartModuleOrFactory<[...T], [...TC], [...TI]>]): InferSmartFactory<[...T, ...TC, ...TI]>
/**
 * Definition without smart configs or smart imports: the returned factory
 * takes no configuration argument.
 */
export function smartModule(moduleOrModuleDefinitionFn: SmartModuleOrFactory<[], [], []>): () => DynamicModule
export function smartModule(...args: unknown[]) {
  const inlineSmartConfigs = args.slice(0, args.length - 1) as AnySmartConfig[]
  const smartModuleOrFactory = args[args.length - 1] as SmartModuleOrFactory<
    AnySmartConfig[],
    AnySmartConfig[],
    AnySmartImport[]
  >

  return function (this: { name?: string } | undefined, arg: object | AsyncParams<object>) {
    const module = createNamedClass((this?.name || '') + 'SmartModule')
    const inlineSmartConfigModules = inlineSmartConfigs.map(c => moduleFromSmartConfig(c, arg))

    if (isSmartModule(smartModuleOrFactory)) {
      const moduleDefinition = smartModuleOrFactory

      const smartConfigModules = (moduleDefinition.smartConfigs || []).map(c => moduleFromSmartConfig(c, arg))
      const smartImportModules = (moduleDefinition.smartImports || []).map(c => moduleFromSmartImport(c, arg))

      return appendImports({ module, ...moduleDefinition }, [
        ...inlineSmartConfigModules,
        ...smartConfigModules,
        ...smartImportModules,
      ])
    }

    if (isAsyncParams(arg)) {
      const moduleDefinition = smartModuleOrFactory(inlineSmartConfigModules)

      const smartConfigModules = (moduleDefinition.smartConfigs || []).map(c => moduleFromSmartConfig(c, arg))
      const smartImportModules = (moduleDefinition.smartImports || []).map(c => moduleFromSmartImport(c, arg))

      return appendImports({ module, ...moduleDefinition }, [
        ...inlineSmartConfigModules,
        ...smartConfigModules,
        ...smartImportModules,
      ])
    }

    // Instantiated config objects; the factory's variadic parameter is typed
    // through UnboxSmartConfigs on the overload side, so the untyped
    // implementation casts here.
    const inlineSmartConfigInstances = inlineSmartConfigs.map(c => {
      if (isSmartConfig(c)) {
        return instantiateSmartConfig(c, arg)
      }
      return instantiateExtendedSmartConfig(c, arg)
    }) as AnySmartConfig[]

    const moduleDefinition = smartModuleOrFactory(inlineSmartConfigModules, ...inlineSmartConfigInstances)

    const smartConfigModules = (moduleDefinition.smartConfigs || []).map(c => moduleFromSmartConfig(c, arg))
    const smartImportModules = (moduleDefinition.smartImports || []).map(c => moduleFromSmartImport(c, arg))

    return appendImports({ module, ...moduleDefinition }, [
      ...inlineSmartConfigModules,
      ...smartConfigModules,
      ...smartImportModules,
    ])
  }
}
