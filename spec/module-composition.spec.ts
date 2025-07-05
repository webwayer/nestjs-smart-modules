import { Injectable, DynamicModule } from '@nestjs/common'
import { smartModule } from '../src/smartModule'
import {
  matchExpectedModuleStructure,
  matchExpectedConfigModule,
  typeAssert,
  TypeTest,
  ExpectedFactoryType,
} from './utils/spec-helpers'

describe('Module Composition', () => {
  // Config used across multiple describe blocks
  class Config {
    requiredProp: string
    defaultProp? = 'default'
  }

  describe('Basic Smart Module Imports', () => {
    // Configs used in this section
    class DbConfig {
      url: string
    }

    class CacheConfig {
      host: string
    }

    it('should import single smart module', () => {
      const dependencyFactory = smartModule({
        smartConfigs: [Config],
      })

      const factory = smartModule({
        smartImports: [dependencyFactory],
      })

      typeAssert<
        TypeTest<typeof dependencyFactory, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>
      >()

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>>()

      const module = factory({
        requiredProp: 'test',
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      const importedModule = module.imports[0] as DynamicModule

      matchExpectedModuleStructure(importedModule, {
        imports: 1,
      })

      matchExpectedConfigModule(importedModule.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'test',
          defaultProp: 'default',
        },
      })
    })

    it('should combine smartConfigs and smartImports', () => {
      const dependencyFactory = smartModule({
        smartConfigs: [Config],
      })

      const factory = smartModule({
        smartConfigs: [Config],
        smartImports: [dependencyFactory],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>>()

      const module = factory({
        requiredProp: 'test',
      })

      matchExpectedModuleStructure(module, {
        imports: 2,
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'test',
          defaultProp: 'default',
        },
      })

      const importedModule = module.imports[1] as DynamicModule

      matchExpectedModuleStructure(importedModule, {
        imports: 1,
      })

      matchExpectedConfigModule(importedModule.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'test',
          defaultProp: 'default',
        },
      })
    })

    it('should handle multiple smart imports', () => {
      class DatabaseService {}

      class CacheService {}

      class AppService {}

      const databaseFactory = smartModule({
        smartConfigs: [DbConfig],
        providers: [DatabaseService],
        exports: [DatabaseService],
      })

      const cacheFactory = smartModule({
        smartConfigs: [CacheConfig],
        providers: [CacheService],
        exports: [CacheService],
      })

      const factory = smartModule({
        smartImports: [databaseFactory, cacheFactory],
        providers: [AppService],
        exports: [AppService],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string; host: string }>>>()

      const module = factory({
        url: 'postgres://localhost',
        host: 'redis://localhost',
      })

      matchExpectedModuleStructure(module, {
        imports: 2,
        providers: [AppService],
        exports: [AppService],
      })

      const dbImport = module.imports[0] as DynamicModule

      matchExpectedModuleStructure(dbImport, {
        imports: 1,
        providers: [DatabaseService],
        exports: [DatabaseService],
      })

      matchExpectedConfigModule(dbImport.imports[0], {
        name: 'DbConfigSmartConfigModule',
        value: {
          url: 'postgres://localhost',
          host: 'redis://localhost',
        },
      })

      const cacheImport = module.imports[1] as DynamicModule

      matchExpectedModuleStructure(cacheImport, {
        imports: 1,
        providers: [CacheService],
        exports: [CacheService],
      })

      matchExpectedConfigModule(cacheImport.imports[0], {
        name: 'CacheConfigSmartConfigModule',
        value: {
          url: 'postgres://localhost',
          host: 'redis://localhost',
        },
      })
    })

    it('should handle nested smart imports', () => {
      class BaseService {}

      class MiddleService {}

      class TopService {}

      const baseFactory = smartModule({
        smartConfigs: [DbConfig],
        providers: [BaseService],
        exports: [BaseService],
      })

      const middleFactory = smartModule({
        smartImports: [baseFactory],
        providers: [MiddleService],
        exports: [MiddleService],
      })

      const factory = smartModule({
        smartImports: [middleFactory],
        providers: [TopService],
        exports: [TopService],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string }>>>()

      const module = factory({
        url: 'postgres://nested',
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [TopService],
        exports: [TopService],
      })

      const middleImport = module.imports[0] as DynamicModule

      matchExpectedModuleStructure(middleImport, {
        imports: 1,
        providers: [MiddleService],
        exports: [MiddleService],
      })

      const baseImport = middleImport.imports[0] as DynamicModule

      matchExpectedModuleStructure(baseImport, {
        imports: 1,
        providers: [BaseService],
        exports: [BaseService],
      })

      matchExpectedConfigModule(baseImport.imports[0], {
        name: 'DbConfigSmartConfigModule',
        value: {
          url: 'postgres://nested',
        },
      })
    })
  })

  describe('Advanced Smart Import Features', () => {
    class LogConfig {
      logLevel: string
    }

    class MetricsConfig {
      metricsUrl: string
    }

    it('should handle labeled smart imports', () => {
      class AnalyticsService {}

      class AppService {}

      const analyticsFactory = smartModule({
        smartConfigs: [LogConfig, MetricsConfig],
        providers: [AnalyticsService],
        exports: [AnalyticsService],
      })

      const factory = smartModule({
        smartImports: [
          {
            smartImport: analyticsFactory,
            label: 'analytics' as const,
          },
        ],
        providers: [AppService],
        exports: [AppService],
      })

      typeAssert<
        TypeTest<typeof factory, ExpectedFactoryType<{ analytics: { logLevel: string; metricsUrl: string } }>>
      >()

      const module = factory({
        analytics: {
          logLevel: 'debug',
          metricsUrl: 'http://metrics.com',
        },
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [AppService],
        exports: [AppService],
      })

      const analyticsImport = module.imports[0] as DynamicModule

      matchExpectedModuleStructure(analyticsImport, {
        imports: 2,
        providers: [AnalyticsService],
        exports: [AnalyticsService],
      })

      matchExpectedConfigModule(analyticsImport.imports[0], {
        name: 'LogConfigSmartConfigModule',
        value: {
          logLevel: 'debug',
          metricsUrl: 'http://metrics.com',
        },
      })

      matchExpectedConfigModule(analyticsImport.imports[1], {
        name: 'MetricsConfigSmartConfigModule',
        value: {
          logLevel: 'debug',
          metricsUrl: 'http://metrics.com',
        },
      })
    })

    it('should handle prefixed smart imports', () => {
      class LogService {}

      class PrefixedService {}

      const logFactory = smartModule({
        smartConfigs: [LogConfig],
        providers: [LogService],
        exports: [LogService],
      })

      const factory = smartModule({
        smartImports: [
          {
            smartImport: logFactory,
            prefix: 'app_' as const,
          },
        ],
        providers: [PrefixedService],
        exports: [PrefixedService],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ app_logLevel: string }>>>()

      const module = factory({
        app_logLevel: 'info',
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [PrefixedService],
        exports: [PrefixedService],
      })

      const logImport = module.imports[0] as DynamicModule

      matchExpectedModuleStructure(logImport, {
        imports: 1,
        providers: [LogService],
        exports: [LogService],
      })

      matchExpectedConfigModule(logImport.imports[0], {
        name: 'LogConfigSmartConfigModule',
        value: {
          logLevel: 'info',
        },
      })
    })

    it('should handle labeled and prefixed smart imports', () => {
      class ConfigService {}

      class ComplexService {}

      const configFactory = smartModule({
        smartConfigs: [Config],
        providers: [ConfigService],
        exports: [ConfigService],
      })

      const factory = smartModule({
        smartImports: [
          {
            smartImport: configFactory,
            label: 'config' as const,
            prefix: 'cfg_' as const,
          },
        ],
        providers: [ComplexService],
        exports: [ComplexService],
      })

      typeAssert<
        TypeTest<
          typeof factory,
          ExpectedFactoryType<{ config: { cfg_requiredProp: string; cfg_defaultProp?: string } }>
        >
      >()

      const module = factory({
        config: {
          cfg_requiredProp: 'test',
        },
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [ComplexService],
        exports: [ComplexService],
      })

      const complexImport = module.imports[0] as DynamicModule

      matchExpectedModuleStructure(complexImport, {
        imports: 1,
        providers: [ConfigService],
        exports: [ConfigService],
      })

      matchExpectedConfigModule(complexImport.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'test',
          defaultProp: 'default',
        },
      })
    })
  })

  describe('Module Naming Patterns', () => {
    it('should support smartModule naming pattern', () => {
      @Injectable()
      class FeatureService {
        static smartModule = smartModule({
          smartConfigs: [Config],
          providers: [FeatureService],
          exports: [FeatureService],
        })
        constructor(private readonly config: Config) {}
      }

      typeAssert<
        TypeTest<typeof FeatureService.smartModule, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>
      >()

      const module = FeatureService.smartModule({
        requiredProp: 'test',
      })

      matchExpectedModuleStructure(module, {
        moduleName: 'FeatureServiceSmartModule',
        imports: 1,
        providers: [FeatureService],
        exports: [FeatureService],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'test',
          defaultProp: 'default',
        },
      })
    })

    it('should support forRoot naming pattern', () => {
      class GlobalModule {
        static forRoot = smartModule({
          global: true,
          smartConfigs: [Config],
          exports: [Config],
        })
      }

      typeAssert<
        TypeTest<typeof GlobalModule.forRoot, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>
      >()
      const module = GlobalModule.forRoot({
        requiredProp: 'global',
      })

      matchExpectedModuleStructure(module, {
        moduleName: 'GlobalModuleSmartModule',
        global: true,
        imports: 1,
        exports: [Config],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'global',
          defaultProp: 'default',
        },
      })
    })
  })
})
