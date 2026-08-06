"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartModule = smartModule;
const modules_js_1 = require("./modules.js");
const helpers_js_1 = require("./utils/helpers.js");
const types_js_1 = require("./types.js");
function smartModule(...args) {
    const inlineSmartConfigs = args.slice(0, args.length - 1);
    const smartModuleOrFactory = args[args.length - 1];
    return function (arg) {
        const module = (0, helpers_js_1.createNamedClass)((this?.name || '') + 'SmartModule');
        const inlineSmartConfigModules = inlineSmartConfigs.map(c => (0, modules_js_1.moduleFromSmartConfig)(c, arg));
        if ((0, types_js_1.isSmartModule)(smartModuleOrFactory)) {
            const moduleDefinition = smartModuleOrFactory;
            const smartConfigModules = (moduleDefinition.smartConfigs || []).map(c => (0, modules_js_1.moduleFromSmartConfig)(c, arg));
            const smartImportModules = (moduleDefinition.smartImports || []).map(c => (0, modules_js_1.moduleFromSmartImport)(c, arg));
            return (0, helpers_js_1.appendImports)({ module, ...moduleDefinition }, [
                ...inlineSmartConfigModules,
                ...smartConfigModules,
                ...smartImportModules,
            ]);
        }
        if ((0, types_js_1.isAsyncParams)(arg)) {
            const moduleDefinition = smartModuleOrFactory(inlineSmartConfigModules);
            const smartConfigModules = (moduleDefinition.smartConfigs || []).map(c => (0, modules_js_1.moduleFromSmartConfig)(c, arg));
            const smartImportModules = (moduleDefinition.smartImports || []).map(c => (0, modules_js_1.moduleFromSmartImport)(c, arg));
            return (0, helpers_js_1.appendImports)({ module, ...moduleDefinition }, [
                ...inlineSmartConfigModules,
                ...smartConfigModules,
                ...smartImportModules,
            ]);
        }
        // Instantiated config objects; the factory's variadic parameter is typed
        // through UnboxSmartConfigs on the overload side, so the untyped
        // implementation casts here.
        const inlineSmartConfigInstances = inlineSmartConfigs.map(c => {
            if ((0, types_js_1.isSmartConfig)(c)) {
                return (0, modules_js_1.instantiateSmartConfig)(c, arg);
            }
            return (0, modules_js_1.instantiateExtendedSmartConfig)(c, arg);
        });
        const moduleDefinition = smartModuleOrFactory(inlineSmartConfigModules, ...inlineSmartConfigInstances);
        const smartConfigModules = (moduleDefinition.smartConfigs || []).map(c => (0, modules_js_1.moduleFromSmartConfig)(c, arg));
        const smartImportModules = (moduleDefinition.smartImports || []).map(c => (0, modules_js_1.moduleFromSmartImport)(c, arg));
        return (0, helpers_js_1.appendImports)({ module, ...moduleDefinition }, [
            ...inlineSmartConfigModules,
            ...smartConfigModules,
            ...smartImportModules,
        ]);
    };
}
//# sourceMappingURL=smartModule.js.map