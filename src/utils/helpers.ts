import type { DynamicModule } from '@nestjs/common'

export function createNamedClass(name: string) {
  const tmp = {
    [name]: class {},
  }

  return tmp[name]
}

type PlainObject = Record<string, unknown>

function removePrefix(obj: PlainObject, prefix?: string): PlainObject {
  return prefix ? Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.substring(prefix.length), v])) : obj
}

function filterByPrefix(obj: PlainObject, prefix?: string): PlainObject {
  return prefix ? Object.fromEntries(Object.entries(obj).filter(([k]) => k.startsWith(prefix))) : obj
}

function pickLabel(obj: PlainObject, label?: string): PlainObject {
  return label ? (obj[label] as PlainObject) : obj
}

export function pickLabeledAndPrefixed(obj: object | undefined, label?: string, prefix?: string) {
  return removePrefix(filterByPrefix(pickLabel((obj ?? {}) as PlainObject, label), prefix), prefix)
}

export function appendImports(module: DynamicModule, imports: DynamicModule[]): DynamicModule {
  // Never mutate the existing imports: `module` is spread from the caller's
  // module definition, so `module.imports` can be the definition's own array —
  // pushing into it would leak this call's generated modules into every
  // subsequent factory call.
  module.imports = [...(module.imports ?? []), ...imports]

  return module
}
