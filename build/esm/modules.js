import { pickLabeledAndPrefixed, createNamedClass } from './utils/helpers.js';
import { isAsyncParams, isExtendedSmartConfig, isExtendedSmartImport, isSmartConfig, isSmartImport } from './types.js';
export function moduleFromSmartConfig(smartConfigBase, arg) {
    if (isSmartConfig(smartConfigBase)) {
        if (isAsyncParams(arg)) {
            return {
                module: createNamedClass(smartConfigBase.name + 'SmartConfigModule'),
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
                module: createNamedClass(smartConfigBase.name + 'SmartConfigModule'),
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
    if (isExtendedSmartConfig(smartConfigBase)) {
        if (isAsyncParams(arg)) {
            return {
                module: createNamedClass(smartConfigBase.smartConfig.name + 'SmartConfigModule'),
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
                module: createNamedClass(smartConfigBase.smartConfig.name + 'SmartConfigModule'),
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
export function moduleFromSmartImport(smartImportBase, arg) {
    if (isSmartImport(smartImportBase)) {
        return smartImportBase(arg);
    }
    if (isExtendedSmartImport(smartImportBase)) {
        if (isAsyncParams(arg)) {
            return smartImportBase.smartImport({
                imports: arg.imports,
                inject: arg.inject,
                async useFactory(...args) {
                    return pickLabeledAndPrefixed(await arg.useFactory(...args), smartImportBase.label, smartImportBase.prefix);
                },
            });
        }
        else {
            return smartImportBase.smartImport(pickLabeledAndPrefixed(arg, smartImportBase.label, smartImportBase.prefix));
        }
    }
    throw new Error(`SmartImport: ${JSON.stringify(smartImportBase)} of [${typeof smartImportBase}], ${JSON.stringify(arg)} is not valid smart import base for module`);
}
export function applyPropsToSmartConfig(config, overrideObj) {
    return {
        ...new config(),
        ...Object.fromEntries(Object.entries(overrideObj).filter(([, val]) => val !== undefined)),
    };
}
export function instantiateSmartConfig(config, arg) {
    return applyPropsToSmartConfig(config, pickLabeledAndPrefixed(arg, config.label, config.prefix));
}
export function instantiateExtendedSmartConfig(config, arg) {
    return applyPropsToSmartConfig(config.smartConfig, pickLabeledAndPrefixed(arg, typeof config.label === 'string' ? config.label : config.smartConfig.label, typeof config.prefix === 'string' ? config.prefix : config.smartConfig.prefix));
}
//# sourceMappingURL=modules.js.map