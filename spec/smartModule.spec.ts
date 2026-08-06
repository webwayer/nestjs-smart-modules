import { smartModule } from '../src/smartModule'
import { smartModule as smartModuleFromIndex } from '../src/index'
import type { TypeTest, ExpectedFactoryType } from './utils/spec-helpers'
import { matchExpectedConfigModule, matchExpectedModuleStructure, typeAssert } from './utils/spec-helpers'

describe('SmartModule Core Infrastructure', () => {
  describe('Module Exports', () => {
    it('should export smartModule function from index', () => {
      // Validate that smartModule is exported from index and functions correctly
      if (!smartModuleFromIndex || typeof smartModuleFromIndex !== 'function' || smartModuleFromIndex !== smartModule) {
        throw new Error('smartModule not properly exported from index')
      }
    })
  })

  describe('Factory Reuse', () => {
    it('should not leak generated modules into the definition imports across factory calls', () => {
      class ImportedModule {}

      class Config {
        static label = 'config' as const
        url: string
      }

      const definitionImports = [ImportedModule]

      const factory = smartModule({
        imports: definitionImports,
        smartConfigs: [Config],
      })

      const first = factory({ config: { url: 'one' } })
      const second = factory({ config: { url: 'two' } })

      // the definition's own array stays untouched
      expect(definitionImports).toEqual([ImportedModule])

      // each produced module carries exactly its own generated config module,
      // and the second call's config value wins in the second module
      matchExpectedModuleStructure(first, { imports: 2 })
      matchExpectedModuleStructure(second, { imports: 2 })
      matchExpectedConfigModule(first.imports?.[1], {
        name: 'ConfigSmartConfigModule',
        value: { url: 'one' },
      })
      matchExpectedConfigModule(second.imports?.[1], {
        name: 'ConfigSmartConfigModule',
        value: { url: 'two' },
      })
    })
  })

  describe('Error Handling and Validation', () => {
    it('should handle empty module definition', () => {
      const factory = smartModule({})

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType>>()

      const module = factory()

      matchExpectedModuleStructure(module, {})
    })

    it('should handle invalid smartConfigs with appropriate error messages', () => {
      const invalidConfigs = [null, undefined, 123, 'string', {}, { notAConfig: true }] as any

      invalidConfigs.forEach((invalid: any) => {
        const factory = smartModule({
          smartConfigs: [invalid],
        })

        typeAssert<TypeTest<typeof factory, ExpectedFactoryType>>()

        try {
          const factoryAsAny = factory as any
          factoryAsAny({})
          throw new Error('Should have thrown error')
        } catch (error: any) {
          if (
            !error.message.includes('not valid smart config') &&
            !error.message.includes('is not valid smart config') &&
            !error.message.includes('Cannot read properties of null') &&
            !error.message.includes('Cannot read properties of undefined')
          ) {
            throw new Error('Wrong error message')
          }
        }
      })

      // Test invalid config in factory pattern
      const invalidConfig = { notAValidConfig: true } as any

      try {
        const factory = smartModule(invalidConfig, imports => ({
          imports,
        }))

        const factoryAsAny = factory as any
        typeAssert<TypeTest<typeof factory, ExpectedFactoryType>>()
        factoryAsAny({})

        throw new Error('Should have thrown error')
      } catch (error: any) {
        if (!error.message.includes('is not valid smart config base for module')) {
          throw new Error('Wrong error message')
        }
      }
    })

    it('should handle invalid smartImports with appropriate error messages', () => {
      const invalidImports = ['not-an-import', { notAFunction: true }, 123, null, undefined] as any

      invalidImports.forEach((invalid: any) => {
        const factory = smartModule({
          smartImports: [invalid],
        })

        try {
          const factoryAsAny = factory as any
          factoryAsAny({})
          throw new Error('Should have thrown error')
        } catch (error: any) {
          if (
            !error.message.includes('not valid smart import') &&
            !error.message.includes('not a function') &&
            !error.message.includes('Cannot read properties of null') &&
            !error.message.includes('Cannot read properties of undefined')
          ) {
            throw new Error(`Wrong error message: ${error.message}`)
          }
        }
      })
    })

    it('should handle smartImport that throws during execution', () => {
      const throwingImport = (_config: any) => {
        throw new Error('Import execution failed')
      }

      const factory = smartModule({
        smartImports: [throwingImport],
      })

      try {
        const factoryAsAny = factory as any
        factoryAsAny({})

        throw new Error('Should have thrown error')
      } catch (error: any) {
        if (!error.message.includes('Import execution failed')) {
          throw new Error('Wrong error message')
        }
      }
    })
  })
})
