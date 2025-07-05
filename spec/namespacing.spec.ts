import { DynamicModule } from '@nestjs/common'
import { smartModule } from '../src/smartModule'
import {
  matchExpectedModuleStructure,
  matchExpectedConfigModule,
  typeAssert,
  TypeTest,
  ExpectedFactoryType,
} from './utils/spec-helpers'

describe('Configuration Namespacing', () => {
  describe('Label-Based Namespacing', () => {
    class Config {
      requiredProp: string
      optionalProp?: string
      defaultProp?: string = 'default'
    }

    class ConfigLabeled extends Config {
      static label = 'static_label' as const
    }

    it('should handle label functionality including static, inline, and overrides', async () => {
      // Test static label from config class
      const staticFactory = smartModule({ smartConfigs: [ConfigLabeled] })

      typeAssert<
        TypeTest<
          typeof staticFactory,
          ExpectedFactoryType<{ static_label: { requiredProp: string; optionalProp?: string; defaultProp?: string } }>
        >
      >()

      const staticModule = staticFactory({
        static_label: { requiredProp: 'static-test' },
      })

      matchExpectedModuleStructure(staticModule, { imports: 1 })
      matchExpectedConfigModule(staticModule.imports[0], {
        name: 'ConfigLabeledSmartConfigModule',
        value: { requiredProp: 'static-test', defaultProp: 'default' },
      })

      // Test inline label override
      const inlineFactory = smartModule({
        smartConfigs: [{ label: 'custom_label' as const, smartConfig: Config }],
      })

      const inlineModule = inlineFactory({
        custom_label: { requiredProp: 'inline-test', optionalProp: 'optional' },
      })

      matchExpectedModuleStructure(inlineModule, { imports: 1 })
      matchExpectedConfigModule(inlineModule.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: { requiredProp: 'inline-test', optionalProp: 'optional', defaultProp: 'default' },
      })

      // Test inline override of static label
      const overrideFactory = smartModule({
        smartConfigs: [{ label: 'override_label' as const, smartConfig: ConfigLabeled }],
      })

      const overrideModule = overrideFactory({
        override_label: { requiredProp: 'override-test' },
      })

      matchExpectedModuleStructure(overrideModule, { imports: 1 })
      matchExpectedConfigModule(overrideModule.imports[0], {
        name: 'ConfigLabeledSmartConfigModule',
        value: { requiredProp: 'override-test', defaultProp: 'default' },
      })

      // Test async configuration with labels
      const asyncModule = staticFactory({
        imports: [{ module: class MockImportModule {} }],
        inject: [class MockInjectService {}],
        useFactory: () => ({ static_label: { requiredProp: 'async-test' } }),
      })

      matchExpectedModuleStructure(asyncModule, { imports: 1 })
      await matchExpectedConfigModule(asyncModule.imports[0], {
        name: 'ConfigLabeledSmartConfigModule',
        value: { requiredProp: 'async-test', defaultProp: 'default' },
        isAsync: true,
      })
    })
  })

  describe('Prefix-Based Namespacing', () => {
    class Config {
      requiredProp: string
      optionalProp?: string
      defaultProp?: string = 'default'
    }

    class ConfigPrefixed extends Config {
      static prefix = 'static_prefix_' as const
    }

    it('should handle prefix functionality including static, inline, and overrides', async () => {
      // Test static prefix from config class
      const staticFactory = smartModule({ smartConfigs: [ConfigPrefixed] })

      typeAssert<
        TypeTest<
          typeof staticFactory,
          ExpectedFactoryType<{
            static_prefix_requiredProp: string
            static_prefix_optionalProp?: string
            static_prefix_defaultProp?: string
          }>
        >
      >()

      const staticModule = staticFactory({
        static_prefix_requiredProp: 'static-test',
        static_prefix_optionalProp: 'optional',
      })

      matchExpectedModuleStructure(staticModule, { imports: 1 })
      matchExpectedConfigModule(staticModule.imports[0], {
        name: 'ConfigPrefixedSmartConfigModule',
        value: { requiredProp: 'static-test', optionalProp: 'optional', defaultProp: 'default' },
      })

      // Test inline prefix override
      const inlineFactory = smartModule({
        smartConfigs: [{ prefix: 'custom_prefix_' as const, smartConfig: Config }],
      })

      const inlineModule = inlineFactory({
        custom_prefix_requiredProp: 'inline-test',
      })

      matchExpectedModuleStructure(inlineModule, { imports: 1 })
      matchExpectedConfigModule(inlineModule.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: { requiredProp: 'inline-test', defaultProp: 'default' },
      })

      // Test inline override of static prefix
      const overrideFactory = smartModule({
        smartConfigs: [{ prefix: 'override_prefix_' as const, smartConfig: ConfigPrefixed }],
      })

      const overrideModule = overrideFactory({
        override_prefix_requiredProp: 'override-test',
      })

      matchExpectedModuleStructure(overrideModule, { imports: 1 })
      matchExpectedConfigModule(overrideModule.imports[0], {
        name: 'ConfigPrefixedSmartConfigModule',
        value: { requiredProp: 'override-test', defaultProp: 'default' },
      })

      // Test async configuration with prefixes
      const asyncModule = staticFactory({
        useFactory: () => ({
          static_prefix_requiredProp: 'async-test',
        }),
      })

      matchExpectedModuleStructure(asyncModule, { imports: 1 })
      await matchExpectedConfigModule(asyncModule.imports[0], {
        name: 'ConfigPrefixedSmartConfigModule',
        value: { requiredProp: 'async-test', defaultProp: 'default' },
        isAsync: true,
      })
    })
  })

  describe('Label and Prefix Combinations', () => {
    it('should handle labels and prefixes together with conflict resolution', () => {
      class ApiConfig {
        url: string
        timeout: number
      }

      class DbConfig {
        port: number
      }

      class CacheConfig {
        port: number
      }

      // Test combining labels and prefixes
      const combinedFactory = smartModule({
        smartConfigs: [
          { smartConfig: ApiConfig, label: 'api' as const },
          { smartConfig: DbConfig, prefix: 'db_' as const },
        ],
      })

      typeAssert<
        TypeTest<
          typeof combinedFactory,
          ExpectedFactoryType<{ api: { url: string; timeout: number }; db_port: number }>
        >
      >()

      const combinedModule = combinedFactory({
        api: { url: 'http://api.com', timeout: 5000 },
        db_port: 5432,
      })

      matchExpectedModuleStructure(combinedModule, { imports: 2 })
      matchExpectedConfigModule(combinedModule.imports[0], {
        name: 'ApiConfigSmartConfigModule',
        value: { url: 'http://api.com', timeout: 5000 },
      })
      matchExpectedConfigModule(combinedModule.imports[1], {
        name: 'DbConfigSmartConfigModule',
        value: { port: 5432 },
      })

      // Test conflict resolution with prefixes
      const conflictFactory = smartModule({
        smartConfigs: [
          { smartConfig: DbConfig, prefix: 'db_' as const },
          { smartConfig: CacheConfig, prefix: 'cache_' as const },
        ],
      })

      typeAssert<TypeTest<typeof conflictFactory, ExpectedFactoryType<{ db_port: number; cache_port: number }>>>()

      const conflictModule = conflictFactory({
        db_port: 5432,
        cache_port: 6379,
      })

      matchExpectedModuleStructure(conflictModule, { imports: 2 })
      matchExpectedConfigModule(conflictModule.imports[0], {
        name: 'DbConfigSmartConfigModule',
        value: { port: 5432 },
      })
      matchExpectedConfigModule(conflictModule.imports[1], {
        name: 'CacheConfigSmartConfigModule',
        value: { port: 6379 },
      })

      // Test conflict resolution with labels
      const labelConflictFactory = smartModule({
        smartConfigs: [
          { smartConfig: DbConfig, label: 'db' as const },
          { smartConfig: CacheConfig, label: 'cache' as const },
        ],
      })

      const labelConflictModule = labelConflictFactory({
        db: { port: 5432 },
        cache: { port: 6379 },
      })

      matchExpectedModuleStructure(labelConflictModule, { imports: 2 })
      matchExpectedConfigModule(labelConflictModule.imports[0], {
        name: 'DbConfigSmartConfigModule',
        value: { port: 5432 },
      })
      matchExpectedConfigModule(labelConflictModule.imports[1], {
        name: 'CacheConfigSmartConfigModule',
        value: { port: 6379 },
      })
    })
  })

  describe('Smart Import Namespacing Integration', () => {
    it('should respect namespacing when importing from other smart modules', () => {
      class ConfigA {
        prop: string
      }

      class ConfigB {
        prop: string
      }

      class ServiceA {}
      class ServiceB {}

      const serviceAFactory = smartModule({
        smartConfigs: [{ smartConfig: ConfigA, label: 'configA' as const }],
        providers: [ServiceA],
        exports: [ServiceA],
      })

      const serviceBFactory = smartModule({
        smartConfigs: [{ smartConfig: ConfigB, prefix: 'configB_' as const }],
        providers: [ServiceB],
        exports: [ServiceB],
      })

      const mainFactory = smartModule({
        smartImports: [serviceAFactory, serviceBFactory],
      })

      typeAssert<
        TypeTest<typeof mainFactory, ExpectedFactoryType<{ configA: { prop: string }; configB_prop: string }>>
      >()

      const module = mainFactory({
        configA: { prop: 'value-a' },
        configB_prop: 'value-b',
      })

      matchExpectedModuleStructure(module, { imports: 2 })

      const serviceAModule = module.imports[0] as DynamicModule
      matchExpectedModuleStructure(serviceAModule, {
        imports: 1,
        providers: [ServiceA],
        exports: [ServiceA],
      })
      matchExpectedConfigModule(serviceAModule.imports[0], {
        name: 'ConfigASmartConfigModule',
        value: { prop: 'value-a' },
      })

      const serviceBModule = module.imports[1] as DynamicModule
      matchExpectedModuleStructure(serviceBModule, {
        imports: 1,
        providers: [ServiceB],
        exports: [ServiceB],
      })
      matchExpectedConfigModule(serviceBModule.imports[0], {
        name: 'ConfigBSmartConfigModule',
        value: { prop: 'value-b' },
      })
    })
  })

  describe('Static Properties Integration', () => {
    it('should handle all static properties (token, label, prefix) together', () => {
      class FullStaticConfig {
        static token = 'FULL_TOKEN'
        static label = 'full_label' as const
        static prefix = 'full_' as const
        value: string
      }

      const factory = smartModule({
        smartConfigs: [FullStaticConfig],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ full_label: { full_value: string } }>>>()

      const module = factory({
        full_label: { full_value: 'test' },
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'FullStaticConfigSmartConfigModule',
        value: { value: 'test' },
        token: 'FULL_TOKEN',
      })
    })

    it('should override static properties with extended config properties', () => {
      class StaticConfig {
        static label = 'static_label' as const
        static prefix = 'static_' as const
        static token = 'STATIC_TOKEN'
        value: string
      }

      const factory = smartModule({
        smartConfigs: [
          {
            smartConfig: StaticConfig,
            label: 'override_label' as const,
            prefix: 'override_' as const,
            token: 'OVERRIDE_TOKEN',
          },
        ],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ override_label: { override_value: string } }>>>()

      const module = factory({
        override_label: { override_value: 'test' },
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'StaticConfigSmartConfigModule',
        value: { value: 'test' },
        token: 'OVERRIDE_TOKEN',
      })
    })
  })
})
