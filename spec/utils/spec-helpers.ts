import { DynamicModule, InjectionToken } from '@nestjs/common'
import { AsyncParams } from '../../src/types'

// Type testing utilities
export type TypeTest<T, U> = T extends U ? (U extends T ? true : false) : false

export function typeAssert<_T extends true>() {
  // This function is used for compile-time type checking
}

// Helper type for expected factory signature
export type ExpectedFactoryType<TConfig = void> = TConfig extends void
  ? () => DynamicModule
  : (arg: TConfig | AsyncParams<TConfig>) => DynamicModule

// Module structure matching
export function matchExpectedModuleStructure(
  module: Partial<DynamicModule>,
  expected: {
    moduleName?: string
    imports?: number | DynamicModule['imports']
    providers?: DynamicModule['providers']
    exports?: number | DynamicModule['exports']
    controllers?: DynamicModule['controllers']
    global?: boolean
  },
) {
  // Module name
  if (expected.moduleName) {
    expect((module.module as { name?: string }).name).toBe(expected.moduleName)
  }

  // Imports (default to 0 if not specified)
  const expectedImports = expected.imports ?? 0

  if (typeof expectedImports === 'number') {
    expect(module.imports || []).toHaveLength(expectedImports)
  } else if (expectedImports) {
    expect(module.imports).toEqual(expectedImports)
  }

  // Providers
  if (expected.providers !== undefined) {
    expect(module.providers).toEqual(expected.providers)
  } else {
    // If not specified, accept both undefined and []
    expect(module.providers === undefined || (Array.isArray(module.providers) && module.providers.length === 0)).toBe(
      true,
    )
  }

  // Exports (default to 0 if not specified)
  const expectedExports = expected.exports ?? 0

  if (typeof expectedExports === 'number') {
    expect(module.exports || []).toHaveLength(expectedExports)
  } else if (expectedExports) {
    expect(module.exports).toEqual(expectedExports)
  }

  // Controllers
  if (expected.controllers !== undefined) {
    expect(module.controllers).toEqual(expected.controllers)
  } else {
    // If not specified, accept both undefined and []
    expect(
      module.controllers === undefined || (Array.isArray(module.controllers) && module.controllers.length === 0),
    ).toBe(true)
  }

  // Global
  if (expected.global !== undefined) {
    expect(module.global).toBe(expected.global)
  }
}

// Helper to match configuration module structure
export function matchExpectedConfigModule<TValue = Record<string, unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configModule: DynamicModule | any, // Accepts modules from imports or exports arrays
  expected: {
    name: string
    token?: InjectionToken
    value: TValue
    isAsync?: boolean
  },
) {
  const module = configModule as DynamicModule

  expect((module.module as { name?: string }).name).toBe(expected.name)
  expect(module.providers).toHaveLength(1)
  expect(module.exports).toHaveLength(1)

  interface ConfigProvider<T = TValue> {
    provide?: InjectionToken
    useValue?: T
    useFactory?: (...args: unknown[]) => T
    inject?: InjectionToken[]
    imports?: DynamicModule['imports']
  }

  const provider = module.providers?.[0] as ConfigProvider<TValue>
  const exportedToken = module.exports?.[0]

  if (expected.token) {
    expect(provider.provide).toBe(expected.token)
    expect(exportedToken).toBe(expected.token)
  }

  if (expected.isAsync) {
    expect(provider.useFactory).toBeDefined()
    expect(typeof provider.useFactory).toBe('function')

    const value = provider.useFactory?.()

    if (value['then']) {
      return Promise.resolve(value).then(v => {
        expect(v).toEqual(expected.value)
      })
    } else {
      expect(value).toEqual(expected.value)
    }
  } else {
    expect(provider.useValue).toEqual(expected.value)
  }
}
