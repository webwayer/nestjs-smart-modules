import { DynamicModule } from '@nestjs/common'

export function createNamedClass(name: string) {
  const tmp = {
    [name]: class {},
  }

  return tmp[name]
}

function removePrefix(obj: object, prefix?: string) {
  return prefix ? Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.substring(prefix.length), v])) : obj
}

function filterByPrefix(obj: object, prefix?: string) {
  return prefix ? Object.fromEntries(Object.entries(obj).filter(([k]) => k.startsWith(prefix))) : obj
}

function pickLabel(obj: object, label?: string) {
  return label ? obj[label] : obj
}

export function pickLabeledAndPrefixed(obj: object, label?: string, prefix?: string) {
  return removePrefix(filterByPrefix(pickLabel(obj, label), prefix), prefix)
}

export function appendImports(module: DynamicModule, imports: DynamicModule[]): DynamicModule {
  // Never mutate the existing imports: `module` is spread from the caller's
  // module definition, so `module.imports` can be the definition's own array —
  // pushing into it would leak this call's generated modules into every
  // subsequent factory call.
  module.imports = [...(module.imports ?? []), ...imports]

  return module
}
