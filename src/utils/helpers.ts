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
  return label ? ((obj[label] ?? {}) as PlainObject) : obj
}

export function pickLabeledAndPrefixed(obj: object | undefined, label?: string, prefix?: string) {
  return removePrefix(filterByPrefix(pickLabel((obj ?? {}) as PlainObject, label), prefix), prefix)
}

const namespacedConfigs = new WeakMap<object, Map<string, object>>()

/**
 * The configuration an import namespaced by `label` and `prefix` is handed,
 * made once per source configuration and namespace. A shared module is keyed
 * by the configuration object it receives, so two imports under one namespace
 * must receive the same object, not two equal ones.
 */
export function namespacedOnce<T extends object>(
  source: object,
  label: string | undefined,
  prefix: string | undefined,
  make: () => T,
): T {
  const namespace = JSON.stringify([label, prefix])
  const made = namespacedConfigs.get(source) ?? new Map<string, object>()

  namespacedConfigs.set(source, made)

  if (!made.has(namespace)) {
    made.set(namespace, make())
  }

  return made.get(namespace) as T
}

export function appendImports(module: DynamicModule, imports: DynamicModule[]): DynamicModule {
  // Never mutate the existing imports: `module` is spread from the caller's
  // module definition, so `module.imports` can be the definition's own array —
  // pushing into it would leak this call's generated modules into every
  // subsequent factory call.
  module.imports = [...(module.imports ?? []), ...imports]

  return module
}
