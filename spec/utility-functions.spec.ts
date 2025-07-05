import { isFunction, isClass, isSmartModule, isSmartModuleFactory } from '../src/types'
import { pickLabeledAndPrefixed, appendImports } from '../src/utils/helpers'
import {
  applyPropsToSmartConfig,
  instantiateSmartConfig,
  instantiateExtendedSmartConfig,
  moduleFromSmartImport,
  moduleFromSmartConfig,
} from '../src/modules'

describe('Utility Functions', () => {
  describe('Type Checking Functions', () => {
    it('should test isFunction with various inputs', () => {
      expect(isFunction(() => {})).toBe(true)
      expect(isFunction(class TestClass {})).toBe(true)
      expect(isFunction('not a function')).toBe(false)
      expect(isFunction(null)).toBe(false)
      expect(isFunction(undefined)).toBe(false)
    })

    it('should test isClass with various inputs', () => {
      expect(isClass(class TestClass {})).toBe(true)
      expect(isClass(() => {})).toBe(false)
      expect(isClass('not a class')).toBe(false)
    })

    it('should test isSmartModule with various inputs', () => {
      const smartModuleObj = { exports: [] }

      expect(isSmartModule(smartModuleObj as any)).toBe(true)
      expect(isSmartModule((() => {}) as any)).toBe(false)
    })

    it('should test isSmartModuleFactory with various inputs', () => {
      expect(isSmartModuleFactory((() => {}) as any)).toBe(true)
      expect(isSmartModuleFactory({} as any)).toBe(false)
    })
  })

  describe('Helper Functions', () => {
    it('should test pickLabeledAndPrefixed with various combinations', () => {
      const testObj = {
        prefix_value: 'test',
        other_value: 'other',
        nested: { prefix_nested: 'nested_test' },
      }

      // Test with no label or prefix
      expect(pickLabeledAndPrefixed(testObj)).toEqual(testObj)

      // Test with prefix only
      expect(pickLabeledAndPrefixed(testObj, undefined, 'prefix_')).toEqual({ value: 'test' })

      // Test with label only
      expect(pickLabeledAndPrefixed({ labeled: testObj }, 'labeled')).toEqual(testObj)
    })

    it('should test appendImports with existing imports', () => {
      const moduleWithImports = { imports: [{ module: class ExistingModule {} }] }
      const newImports = [{ module: class NewModule {} }]
      const result = appendImports(moduleWithImports as any, newImports as any)

      expect(result.imports).toHaveLength(2)
    })

    it('should test applyPropsToSmartConfig with undefined values', () => {
      class Config {
        value = 'default'
        optionalValue?: string
      }

      const result = applyPropsToSmartConfig(Config, {
        value: 'overridden',
        optionalValue: undefined,
        extraValue: 'should be filtered',
      }) as Config & { extraValue: string }

      expect(result.value).toBe('overridden')
      expect(result.optionalValue).toBeUndefined()
      expect(result.extraValue).toBe('should be filtered')
    })

    it('should test instantiateSmartConfig with no arguments', () => {
      class SimpleConfig {
        value = 'default'
      }

      const instance = instantiateSmartConfig(SimpleConfig as any, {}) as SimpleConfig

      expect(instance.value).toBe('default')
    })

    it('should test instantiateExtendedSmartConfig with string label/prefix fallback', () => {
      class SimpleConfig {
        value = 'default'
      }

      const extendedConfig = {
        smartConfig: SimpleConfig,
        label: 'testLabel',
        prefix: 'test_',
      }

      const extendedInstance = instantiateExtendedSmartConfig(extendedConfig as any, {
        testLabel: { test_value: 'extended' },
      }) as SimpleConfig

      expect(extendedInstance.value).toBe('extended')
    })
  })

  describe('Error Path Testing', () => {
    it('should throw error for invalid smart import base', () => {
      const invalidImportBase = { notAValidImport: true } as any

      expect(() => {
        moduleFromSmartImport(invalidImportBase, { test: 'value' })
      }).toThrow(/not valid smart import base for module/)
    })

    it('should throw error for invalid smart config base', () => {
      const invalidConfigBase = { notAValidConfig: true } as any

      expect(() => {
        moduleFromSmartConfig(invalidConfigBase, { test: 'value' })
      }).toThrow(/not valid smart config base for module/)
    })
  })
})
