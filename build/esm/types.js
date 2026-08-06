/* eslint-disable @typescript-eslint/no-explicit-any */
export function isAsyncParams(o) {
    return typeof o.useFactory === 'function';
}
export function isSmartConfig(c) {
    return isClass(c);
}
export function isSmartImport(c) {
    return isFunction(c) && !isClass(c);
}
export function isExtendedSmartConfig(c) {
    const candidate = c.smartConfig;
    return !!candidate && isSmartConfig(candidate);
}
export function isExtendedSmartImport(c) {
    const candidate = c.smartImport;
    return !!candidate && isSmartImport(candidate);
}
export function isSmartModule(x) {
    return !isFunction(x);
}
export function isSmartModuleFactory(x) {
    return isFunction(x);
}
export function isFunction(c) {
    return typeof c === 'function';
}
export function isClass(c) {
    return typeof c === 'function' && /^class\s/.test(Function.prototype.toString.call(c));
}
//# sourceMappingURL=types.js.map