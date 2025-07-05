import { DynamicModule } from '@nestjs/common'

import {
  instantiateSmartConfig,
  instantiateExtendedSmartConfig,
  moduleFromSmartConfig,
  moduleFromSmartImport,
} from './modules'
import { appendImports, createNamedClass } from './utils/helpers'
import {
  AsyncParams,
  AnySmartConfig,
  AnySmartImport,
  SmartModuleOrFactory,
  isAsyncParams,
  isSmartConfig,
  isSmartModule,
} from './types'
import { InferSmartFactory } from './infer'

export function smartModule<
  T extends AnySmartConfig[] = [],
  TC extends AnySmartConfig[] = [],
  TI extends AnySmartImport[] = [],
>(...args: [...T, SmartModuleOrFactory<[...T], [...TC], [...TI]>]): InferSmartFactory<[...T, ...TC, ...TI]>
export function smartModule(moduleOrModuleDefinitionFn: SmartModuleOrFactory<[], [], []>): () => DynamicModule
export function smartModule(...args) {
  const inlineSmartConfigs = args.slice(0, args.length - 1) as AnySmartConfig[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const smartModuleOrFactory = args[args.length - 1] as SmartModuleOrFactory<any, any, any>

  return function (arg: object | AsyncParams<object>) {
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

      return appendImports(
        {
          module,
          ...smartModuleOrFactory(inlineSmartConfigModules),
        },
        [...inlineSmartConfigModules, ...smartConfigModules, ...smartImportModules],
      )
    }

    const inlineSmartConfigInstances = inlineSmartConfigs.map(c => {
      if (isSmartConfig(c)) {
        return instantiateSmartConfig(c, arg)
      }
      return instantiateExtendedSmartConfig(c, arg)
    })

    const moduleDefinition = smartModuleOrFactory(inlineSmartConfigModules, ...inlineSmartConfigInstances)

    const smartConfigModules = (moduleDefinition.smartConfigs || []).map(c => moduleFromSmartConfig(c, arg))
    const smartImportModules = (moduleDefinition.smartImports || []).map(c => moduleFromSmartImport(c, arg))

    return appendImports({ module, ...smartModuleOrFactory(inlineSmartConfigModules, ...inlineSmartConfigInstances) }, [
      ...inlineSmartConfigModules,
      ...smartConfigModules,
      ...smartImportModules,
    ])
  }
}
