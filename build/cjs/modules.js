"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleFromSmartConfig = moduleFromSmartConfig;
exports.moduleFromSmartImport = moduleFromSmartImport;
exports.applyPropsToSmartConfig = applyPropsToSmartConfig;
exports.instantiateSmartConfig = instantiateSmartConfig;
exports.instantiateExtendedSmartConfig = instantiateExtendedSmartConfig;
const helpers_js_1 = require("./utils/helpers.js");
const types_js_1 = require("./types.js");
function moduleFromSmartConfig(smartConfigBase, arg) {
    if ((0, types_js_1.isSmartConfig)(smartConfigBase)) {
        if ((0, types_js_1.isAsyncParams)(arg)) {
            return {
                module: (0, helpers_js_1.createNamedClass)(smartConfigBase.name + 'SmartConfigModule'),
                // `imports` must live on the module, not on the provider: NestJS ignores
                // unknown keys on a FactoryProvider, so `inject` would only resolve from
                // global modules. Copied so the module never owns the caller's array.
                imports: [...(arg.imports ?? [])],
                providers: [
                    {
                        inject: arg.inject,
                        async useFactory(...args) {
                            return instantiateSmartConfig(smartConfigBase, await arg.useFactory(...args));
                        },
                        provide: smartConfigBase.token || smartConfigBase,
                    },
                ],
                exports: [smartConfigBase.token || smartConfigBase],
            };
        }
        else {
            return {
                module: (0, helpers_js_1.createNamedClass)(smartConfigBase.name + 'SmartConfigModule'),
                providers: [
                    {
                        useValue: instantiateSmartConfig(smartConfigBase, arg),
                        provide: smartConfigBase.token || smartConfigBase,
                    },
                ],
                exports: [smartConfigBase.token || smartConfigBase],
            };
        }
    }
    if ((0, types_js_1.isExtendedSmartConfig)(smartConfigBase)) {
        if ((0, types_js_1.isAsyncParams)(arg)) {
            return {
                module: (0, helpers_js_1.createNamedClass)(smartConfigBase.smartConfig.name + 'SmartConfigModule'),
                // Same as above: module-level `imports`, defensively copied.
                imports: [...(arg.imports ?? [])],
                providers: [
                    {
                        inject: arg.inject,
                        async useFactory(...args) {
                            return instantiateExtendedSmartConfig(smartConfigBase, await arg.useFactory(...args));
                        },
                        provide: smartConfigBase.token || smartConfigBase.smartConfig,
                    },
                ],
                exports: [smartConfigBase.token || smartConfigBase.smartConfig],
            };
        }
        else {
            return {
                module: (0, helpers_js_1.createNamedClass)(smartConfigBase.smartConfig.name + 'SmartConfigModule'),
                providers: [
                    {
                        useValue: instantiateExtendedSmartConfig(smartConfigBase, arg),
                        provide: smartConfigBase.token || smartConfigBase.smartConfig,
                    },
                ],
                exports: [smartConfigBase.token || smartConfigBase.smartConfig],
            };
        }
    }
    throw new Error(`SmartConfig: ${JSON.stringify(smartConfigBase)} of [${typeof smartConfigBase}], ${JSON.stringify(arg)} is not valid smart config base for module`);
}
function moduleFromSmartImport(smartImportBase, arg) {
    if ((0, types_js_1.isSmartImport)(smartImportBase)) {
        return smartImportBase(arg);
    }
    if ((0, types_js_1.isExtendedSmartImport)(smartImportBase)) {
        if ((0, types_js_1.isAsyncParams)(arg)) {
            return smartImportBase.smartImport({
                imports: arg.imports,
                inject: arg.inject,
                async useFactory(...args) {
                    return (0, helpers_js_1.pickLabeledAndPrefixed)(await arg.useFactory(...args), smartImportBase.label, smartImportBase.prefix);
                },
            });
        }
        else {
            return smartImportBase.smartImport((0, helpers_js_1.pickLabeledAndPrefixed)(arg, smartImportBase.label, smartImportBase.prefix));
        }
    }
    throw new Error(`SmartImport: ${JSON.stringify(smartImportBase)} of [${typeof smartImportBase}], ${JSON.stringify(arg)} is not valid smart import base for module`);
}
function applyPropsToSmartConfig(config, overrideObj) {
    return {
        ...new config(),
        ...Object.fromEntries(Object.entries(overrideObj).filter(([, val]) => val !== undefined)),
    };
}
function instantiateSmartConfig(config, arg) {
    return applyPropsToSmartConfig(config, (0, helpers_js_1.pickLabeledAndPrefixed)(arg, config.label, config.prefix));
}
function instantiateExtendedSmartConfig(config, arg) {
    return applyPropsToSmartConfig(config.smartConfig, (0, helpers_js_1.pickLabeledAndPrefixed)(arg, typeof config.label === 'string' ? config.label : config.smartConfig.label, typeof config.prefix === 'string' ? config.prefix : config.smartConfig.prefix));
}
//# sourceMappingURL=modules.js.map