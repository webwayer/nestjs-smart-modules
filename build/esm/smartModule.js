import { instantiateSmartConfig, instantiateExtendedSmartConfig, moduleFromSmartConfig, moduleFromSmartImport, } from './modules.js';
import { appendImports, createNamedClass } from './utils/helpers.js';
import { isAsyncParams, isSmartConfig, isSmartModule } from './types.js';
export function smartModule(...args) {
    const inlineSmartConfigs = args.slice(0, args.length - 1);
    const smartModuleOrFactory = args[args.length - 1];
    return function (arg) {
        const module = createNamedClass((this?.name || '') + 'SmartModule');
        const inlineSmartConfigModules = inlineSmartConfigs.map(c => moduleFromSmartConfig(c, arg));
        if (isSmartModule(smartModuleOrFactory)) {
            const moduleDefinition = smartModuleOrFactory;
            const smartConfigModules = (moduleDefinition.smartConfigs || []).map(c => moduleFromSmartConfig(c, arg));
            const smartImportModules = (moduleDefinition.smartImports || []).map(c => moduleFromSmartImport(c, arg));
            return appendImports({ module, ...moduleDefinition }, [
                ...inlineSmartConfigModules,
                ...smartConfigModules,
                ...smartImportModules,
            ]);
        }
        if (isAsyncParams(arg)) {
            const moduleDefinition = smartModuleOrFactory(inlineSmartConfigModules);
            const smartConfigModules = (moduleDefinition.smartConfigs || []).map(c => moduleFromSmartConfig(c, arg));
            const smartImportModules = (moduleDefinition.smartImports || []).map(c => moduleFromSmartImport(c, arg));
            return appendImports({ module, ...moduleDefinition }, [
                ...inlineSmartConfigModules,
                ...smartConfigModules,
                ...smartImportModules,
            ]);
        }
        // Instantiated config objects; the factory's variadic parameter is typed
        // through UnboxSmartConfigs on the overload side, so the untyped
        // implementation casts here.
        const inlineSmartConfigInstances = inlineSmartConfigs.map(c => {
            if (isSmartConfig(c)) {
                return instantiateSmartConfig(c, arg);
            }
            return instantiateExtendedSmartConfig(c, arg);
        });
        const moduleDefinition = smartModuleOrFactory(inlineSmartConfigModules, ...inlineSmartConfigInstances);
        const smartConfigModules = (moduleDefinition.smartConfigs || []).map(c => moduleFromSmartConfig(c, arg));
        const smartImportModules = (moduleDefinition.smartImports || []).map(c => moduleFromSmartImport(c, arg));
        return appendImports({ module, ...moduleDefinition }, [
            ...inlineSmartConfigModules,
            ...smartConfigModules,
            ...smartImportModules,
        ]);
    };
}
//# sourceMappingURL=smartModule.js.map