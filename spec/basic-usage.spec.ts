import { smartModule } from '../src/smartModule'
import {
  matchExpectedModuleStructure,
  matchExpectedConfigModule,
  typeAssert,
  TypeTest,
  ExpectedFactoryType,
} from './utils/spec-helpers'

describe('Basic Usage', () => {
  describe('Module Creation Without Configuration', () => {
    it('should create empty module', () => {
      const factory = smartModule({})

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType>>()

      const module = factory()

      matchExpectedModuleStructure(module, {})
    })

    it('should create module with providers and exports', () => {
      class ServiceWithProviders {}

      const factory = smartModule({
        providers: [ServiceWithProviders],
        exports: [ServiceWithProviders],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType>>()

      const module = factory()

      matchExpectedModuleStructure(module, {
        providers: [ServiceWithProviders],
        exports: [ServiceWithProviders],
      })
    })

    it('should create global module', () => {
      class GlobalService {}

      const factory = smartModule({
        global: true,
        providers: [GlobalService],
        exports: [GlobalService],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType>>()

      const module = factory()

      matchExpectedModuleStructure(module, {
        providers: [GlobalService],
        exports: [GlobalService],
        global: true,
      })
    })

    it('should create module with standard imports', () => {
      class ExternalModule {}

      class ServiceWithImports {}

      const factory = smartModule({
        imports: [ExternalModule],
        providers: [ServiceWithImports],
        exports: [ServiceWithImports],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType>>()

      const module = factory()

      matchExpectedModuleStructure(module, {
        imports: [ExternalModule],
        providers: [ServiceWithImports],
        exports: [ServiceWithImports],
      })
    })

    it('should create module with controllers', () => {
      class TestController {}

      class ServiceWithControllers {}

      const factory = smartModule({
        controllers: [TestController],
        providers: [ServiceWithControllers],
        exports: [ServiceWithControllers],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType>>()

      const module = factory()

      matchExpectedModuleStructure(module, {
        controllers: [TestController],
        providers: [ServiceWithControllers],
        exports: [ServiceWithControllers],
      })
    })
  })

  describe('Single Configuration', () => {
    class Config {
      requiredProp: string
      optionalProp?: string
      defaultProp?: string = 'default'
    }

    it('should handle configuration with defaults, overrides, and all properties', () => {
      const factory = smartModule({
        smartConfigs: [Config],
      })

      typeAssert<
        TypeTest<
          typeof factory,
          ExpectedFactoryType<{ requiredProp: string; optionalProp?: string; defaultProp?: string }>
        >
      >()

      // Test with only required prop (defaults applied)
      const moduleWithDefaults = factory({
        requiredProp: 'test-defaults',
      })

      matchExpectedModuleStructure(moduleWithDefaults, { imports: 1 })
      matchExpectedConfigModule(moduleWithDefaults.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: { requiredProp: 'test-defaults', defaultProp: 'default' },
      })

      // Test with default override
      const moduleWithOverride = factory({
        requiredProp: 'test-override',
        defaultProp: 'overridden',
      })

      matchExpectedModuleStructure(moduleWithOverride, { imports: 1 })
      matchExpectedConfigModule(moduleWithOverride.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'test-override',
          defaultProp: 'overridden',
        },
      })

      // Test with all properties
      const moduleWithAll = factory({
        requiredProp: 'test-all',
        optionalProp: 'optional-value',
        defaultProp: 'custom-default',
      })

      matchExpectedModuleStructure(moduleWithAll, { imports: 1 })
      matchExpectedConfigModule(moduleWithAll.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'test-all',
          optionalProp: 'optional-value',
          defaultProp: 'custom-default',
        },
      })
    })

    it('should handle complex configuration types', () => {
      class ComplexConfig {
        required: string
        optional?: number
        defaultString?: string = 'default'
        defaultNumber?: number = 42
        defaultBoolean?: boolean = true
        defaultArray?: string[] = ['a', 'b']
        defaultObject?: { key: string } = { key: 'value' }
      }

      const factory = smartModule({
        smartConfigs: [ComplexConfig],
      })

      typeAssert<
        TypeTest<
          typeof factory,
          ExpectedFactoryType<{
            required: string
            optional?: number
            defaultString?: string
            defaultNumber?: number
            defaultBoolean?: boolean
            defaultArray?: string[]
            defaultObject?: { key: string }
          }>
        >
      >()

      const module = factory({
        required: 'test',
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ComplexConfigSmartConfigModule',
        value: {
          required: 'test',
          defaultString: 'default',
          defaultNumber: 42,
          defaultBoolean: true,
          defaultArray: ['a', 'b'],
          defaultObject: { key: 'value' },
        },
      })
    })
  })

  describe('Multiple Configurations', () => {
    it('should handle multiple config classes', () => {
      class FirstConfig {
        firstProp: string
        firstDefault?: string = 'first-default'
      }

      class SecondConfig {
        secondProp: string
        secondDefault?: string = 'second-default'
      }

      const factory = smartModule({
        smartConfigs: [FirstConfig, SecondConfig],
      })

      typeAssert<
        TypeTest<
          typeof factory,
          ExpectedFactoryType<{
            firstProp: string
            firstDefault?: string
            secondProp: string
            secondDefault?: string
          }>
        >
      >()

      const module = factory({
        firstProp: 'first',
        secondProp: 'second',
      })

      matchExpectedModuleStructure(module, {
        imports: 2,
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'FirstConfigSmartConfigModule',
        value: {
          firstProp: 'first',
          secondProp: 'second',
          firstDefault: 'first-default',
        },
      })

      matchExpectedConfigModule(module.imports[1], {
        name: 'SecondConfigSmartConfigModule',
        value: {
          firstProp: 'first',
          secondProp: 'second',
          secondDefault: 'second-default',
        },
      })
    })
  })

  describe('Configuration Combined with Module Features', () => {
    class Config {
      requiredProp: string
      optionalProp?: string
      defaultProp?: string = 'default'
    }

    it('should combine configuration with providers and exports', () => {
      class ConfiguredService {}

      const factory = smartModule({
        smartConfigs: [Config],
        providers: [ConfiguredService],
        exports: [ConfiguredService],
      })

      typeAssert<
        TypeTest<
          typeof factory,
          ExpectedFactoryType<{ requiredProp: string; optionalProp?: string; defaultProp?: string }>
        >
      >()

      const module = factory({
        requiredProp: 'test',
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [ConfiguredService],
        exports: [ConfiguredService],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'test',
          defaultProp: 'default',
        },
      })
    })

    it('should handle extended smart config syntax', () => {
      class ExtendedConfigService {}

      const factory = smartModule({
        smartConfigs: [{ smartConfig: Config }],
        providers: [ExtendedConfigService],
        exports: [ExtendedConfigService],
      })

      typeAssert<
        TypeTest<
          typeof factory,
          ExpectedFactoryType<{ requiredProp: string; optionalProp?: string; defaultProp?: string }>
        >
      >()

      const module = factory({
        requiredProp: 'test',
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [ExtendedConfigService],
        exports: [ExtendedConfigService],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'test',
          defaultProp: 'default',
        },
      })
    })
  })

  describe('Configuration Value Handling', () => {
    it('should not modify original configuration object', () => {
      class Config {
        requiredProp: string
        optionalProp?: string
        defaultProp?: string = 'default'
      }

      const factory = smartModule({
        smartConfigs: [Config],
      })

      typeAssert<
        TypeTest<
          typeof factory,
          ExpectedFactoryType<{ requiredProp: string; optionalProp?: string; defaultProp?: string }>
        >
      >()

      const originalConfig = { requiredProp: 'original' }

      const module = factory(originalConfig)

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'original',
          defaultProp: 'default',
        },
      })
    })

    it('should handle missing required properties gracefully', () => {
      class ConfigWithRequired {
        requiredProp: string
        optionalProp?: string
        defaultProp?: string = 'default'
      }

      const factory = smartModule({
        smartConfigs: [ConfigWithRequired],
      })

      typeAssert<
        TypeTest<
          typeof factory,
          ExpectedFactoryType<{ requiredProp: string; optionalProp?: string; defaultProp?: string }>
        >
      >()

      const module = factory({
        requiredProp: 'test',
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigWithRequiredSmartConfigModule',
        value: {
          requiredProp: 'test',
          defaultProp: 'default',
        },
      })
    })

    it('should handle null and undefined config values', () => {
      class NullableConfig {
        nullable?: string | null
        optional?: string
        required: string
      }

      const factory = smartModule({
        smartConfigs: [NullableConfig],
      })

      typeAssert<
        TypeTest<typeof factory, ExpectedFactoryType<{ nullable?: string | null; optional?: string; required: string }>>
      >()

      const module = factory({
        required: 'test',
        nullable: null,
        optional: undefined,
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'NullableConfigSmartConfigModule',
        value: {
          required: 'test',
          nullable: null,
          optional: undefined,
        },
      })
    })

    it('should handle extra properties in configuration', () => {
      class StrictConfig {
        allowedProp: string
      }

      const factory = smartModule({
        smartConfigs: [StrictConfig],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ allowedProp: string }>>>()

      const configWithExtra = {
        allowedProp: 'test',
        extraProp: 'should be ignored',
        anotherExtra: 123,
      } as any

      const module = factory(configWithExtra)

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'StrictConfigSmartConfigModule',
        value: {
          allowedProp: 'test',
          extraProp: 'should be ignored',
          anotherExtra: 123,
        },
      })
    })
  })

  describe('Type Safety and Generics', () => {
    it('should maintain type safety with generic configurations', () => {
      class GenericConfig<T> {
        value: T
        transform?: (val: T) => string
      }

      type StringConfig = GenericConfig<string>
      type NumberConfig = GenericConfig<number>

      const stringFactory = smartModule({
        smartConfigs: [GenericConfig as new () => StringConfig],
      })

      typeAssert<TypeTest<typeof stringFactory, ExpectedFactoryType<{ value: string }>>>()

      const numberFactory = smartModule({
        smartConfigs: [GenericConfig as new () => NumberConfig],
      })

      typeAssert<TypeTest<typeof numberFactory, ExpectedFactoryType<{ value: number }>>>()

      const stringModule = stringFactory({ value: 'test' })

      matchExpectedModuleStructure(stringModule, {
        imports: 1,
      })

      matchExpectedConfigModule(stringModule.imports[0], {
        name: 'GenericConfigSmartConfigModule',
        value: { value: 'test' },
      })

      const numberModule = numberFactory({ value: 42 })

      matchExpectedModuleStructure(numberModule, {
        imports: 1,
      })

      matchExpectedConfigModule(numberModule.imports[0], {
        name: 'GenericConfigSmartConfigModule',
        value: { value: 42 },
      })
    })

    it('should handle union types in configuration', () => {
      class UnionConfig {
        mode: 'development' | 'production' | 'test'
        level: 1 | 2 | 3
        feature?: boolean | 'auto'
      }

      const factory = smartModule({
        smartConfigs: [UnionConfig],
      })

      typeAssert<
        TypeTest<
          typeof factory,
          ExpectedFactoryType<{
            mode: 'development' | 'production' | 'test'
            level: 1 | 2 | 3
            feature?: boolean | 'auto'
          }>
        >
      >()

      const validConfigs = [
        { mode: 'development', level: 1 },
        { mode: 'production', level: 3, feature: true },
        { mode: 'test', level: 2, feature: 'auto' },
      ] as const

      validConfigs.forEach(config => {
        const module = factory(config)
        matchExpectedModuleStructure(module, {
          imports: 1,
        })

        matchExpectedConfigModule(module.imports[0], {
          name: 'UnionConfigSmartConfigModule',
          value: config,
        })
      })
    })
  })
})
