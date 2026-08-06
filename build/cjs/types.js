"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAsyncParams = isAsyncParams;
exports.isSmartConfig = isSmartConfig;
exports.isSmartImport = isSmartImport;
exports.isExtendedSmartConfig = isExtendedSmartConfig;
exports.isExtendedSmartImport = isExtendedSmartImport;
exports.isSmartModule = isSmartModule;
exports.isSmartModuleFactory = isSmartModuleFactory;
exports.isFunction = isFunction;
exports.isClass = isClass;
function isAsyncParams(o) {
    return typeof o.useFactory === 'function';
}
function isSmartConfig(c) {
    return isClass(c);
}
function isSmartImport(c) {
    return isFunction(c) && !isClass(c);
}
function isExtendedSmartConfig(c) {
    const candidate = c.smartConfig;
    return !!candidate && isSmartConfig(candidate);
}
function isExtendedSmartImport(c) {
    const candidate = c.smartImport;
    return !!candidate && isSmartImport(candidate);
}
function isSmartModule(x) {
    return !isFunction(x);
}
function isSmartModuleFactory(x) {
    return isFunction(x);
}
function isFunction(c) {
    return typeof c === 'function';
}
function isClass(c) {
    return typeof c === 'function' && /^class\s/.test(Function.prototype.toString.call(c));
}
//# sourceMappingURL=types.js.map