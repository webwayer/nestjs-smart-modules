"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNamedClass = createNamedClass;
exports.pickLabeledAndPrefixed = pickLabeledAndPrefixed;
exports.appendImports = appendImports;
function createNamedClass(name) {
    const tmp = {
        [name]: class {
        },
    };
    return tmp[name];
}
function removePrefix(obj, prefix) {
    return prefix ? Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.substring(prefix.length), v])) : obj;
}
function filterByPrefix(obj, prefix) {
    return prefix ? Object.fromEntries(Object.entries(obj).filter(([k]) => k.startsWith(prefix))) : obj;
}
function pickLabel(obj, label) {
    return label ? obj[label] : obj;
}
function pickLabeledAndPrefixed(obj, label, prefix) {
    return removePrefix(filterByPrefix(pickLabel((obj ?? {}), label), prefix), prefix);
}
function appendImports(module, imports) {
    // Never mutate the existing imports: `module` is spread from the caller's
    // module definition, so `module.imports` can be the definition's own array —
    // pushing into it would leak this call's generated modules into every
    // subsequent factory call.
    module.imports = [...(module.imports ?? []), ...imports];
    return module;
}
//# sourceMappingURL=helpers.js.map