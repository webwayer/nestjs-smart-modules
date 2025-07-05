import { DynamicModule } from '@nestjs/common'
import { smartModule } from '../src/smartModule'
import {
  matchExpectedModuleStructure,
  matchExpectedConfigModule,
  typeAssert,
  TypeTest,
  ExpectedFactoryType,
} from './utils/spec-helpers'

// ===== Mock Third-Party Modules =====

class JwtModule {
  static register(options: { secret: string; signOptions: { expiresIn: string } }) {
    return {
      module: JwtModule,
      providers: [{ provide: 'JWT_SERVICE', useValue: `JWT configured with ${options.secret}` }],
      exports: ['JWT_SERVICE'],
    }
  }
}

describe('Module Definition Factory', () => {
  describe('Basic Factory Pattern', () => {
    class ReportingConfig {
      apiUrl: string
    }

    class DbConfig {
      url: string
    }

    class CacheConfig {
      host: string
    }

    it('should create providers with config-dependent values', () => {
      class ReportingService {}

      const factory = smartModule(
        ReportingConfig, // Passed inline to be available in the factory
        (imports, reportingConfig: ReportingConfig) => ({
          imports,
          providers: [
            ReportingService,
            {
              provide: 'REPORTING_SERVICE_URL',
              // Use the config value at definition time
              useValue: `${reportingConfig.apiUrl}/reports`,
            },
          ],
          exports: [ReportingService],
        }),
      )

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ apiUrl: string }>>>()

      const module = factory({
        apiUrl: 'http://api.service.com',
      })

      matchExpectedModuleStructure(module, {
        imports: 2,
        providers: [
          ReportingService,
          {
            provide: 'REPORTING_SERVICE_URL',
            useValue: 'http://api.service.com/reports',
          },
        ],
        exports: [ReportingService],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ReportingConfigSmartConfigModule',
        value: { apiUrl: 'http://api.service.com' },
      })

      matchExpectedConfigModule(module.imports[1], {
        name: 'ReportingConfigSmartConfigModule',
        value: { apiUrl: 'http://api.service.com' },
      })
    })

    it('should handle multiple configs in factory pattern', () => {
      class MultiConfigService {}

      const factory = smartModule(DbConfig, CacheConfig, (imports, dbConfig: DbConfig, cacheConfig: CacheConfig) => ({
        imports,
        providers: [
          MultiConfigService,
          {
            provide: 'CONNECTION_STRING',
            useValue: `${dbConfig.url}:${cacheConfig.host}`,
          },
        ],
        exports: [MultiConfigService],
      }))

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string; host: string }>>>()

      const module = factory({
        url: 'postgres://localhost:5432',
        host: 'redis://localhost:6379',
      })

      matchExpectedModuleStructure(module, {
        imports: 4,
        providers: [
          MultiConfigService,
          {
            provide: 'CONNECTION_STRING',
            useValue: 'postgres://localhost:5432:redis://localhost:6379',
          },
        ],
        exports: [MultiConfigService],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'DbConfigSmartConfigModule',
        value: { url: 'postgres://localhost:5432', host: 'redis://localhost:6379' },
      })

      matchExpectedConfigModule(module.imports[1], {
        name: 'CacheConfigSmartConfigModule',
        value: { url: 'postgres://localhost:5432', host: 'redis://localhost:6379' },
      })
      matchExpectedConfigModule(module.imports[2], {
        name: 'DbConfigSmartConfigModule',
        value: { url: 'postgres://localhost:5432', host: 'redis://localhost:6379' },
      })
      matchExpectedConfigModule(module.imports[3], {
        name: 'CacheConfigSmartConfigModule',
        value: { url: 'postgres://localhost:5432', host: 'redis://localhost:6379' },
      })
    })
  })

  describe('Third-Party Module Integration', () => {
    class JwtConfig {
      secret: string
      signOptions: { expiresIn: string }
    }

    it('should wrap traditional NestJS modules', () => {
      class JwtWrapperService {}

      const factory = smartModule(
        JwtConfig, // Pass config inline to access it in the factory
        (imports, jwtConfig) => {
          // Dynamically register the third-party module using the config
          const jwtModule = JwtModule.register({
            secret: jwtConfig.secret,
            signOptions: jwtConfig.signOptions,
          })
          return {
            imports: [...imports, jwtModule],
            providers: [JwtWrapperService],
            // Export both your service and the third-party module
            exports: [JwtWrapperService, jwtModule],
          }
        },
      )

      typeAssert<
        TypeTest<typeof factory, ExpectedFactoryType<{ secret: string; signOptions: { expiresIn: string } }>>
      >()

      const module = factory({
        secret: 'your-secret-key',
        signOptions: { expiresIn: '60s' },
      })

      matchExpectedModuleStructure(module, {
        imports: 3,
        providers: [JwtWrapperService],
        exports: [
          JwtWrapperService,
          {
            module: JwtModule,
            providers: [{ provide: 'JWT_SERVICE', useValue: 'JWT configured with your-secret-key' }],
            exports: ['JWT_SERVICE'],
          },
        ],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'JwtConfigSmartConfigModule',
        value: { secret: 'your-secret-key', signOptions: { expiresIn: '60s' } },
      })
      matchExpectedConfigModule(module.imports[2], {
        name: 'JwtConfigSmartConfigModule',
        value: { secret: 'your-secret-key', signOptions: { expiresIn: '60s' } },
      })
    })

    it('should handle conditional module imports based on config', () => {
      class ConditionalConfig {
        enableFeature: boolean
        apiUrl: string
      }

      class OptionalModule {
        static forRoot() {
          return { module: OptionalModule }
        }
      }
      class ConditionalService {}

      const factory = smartModule(ConditionalConfig, (imports, config: ConditionalConfig) => {
        const conditionalImports = config.enableFeature ? [...imports, OptionalModule.forRoot()] : imports
        return {
          imports: conditionalImports,
          providers: [
            ConditionalService,
            {
              provide: 'FEATURE_ENABLED',
              useValue: config.enableFeature,
            },
          ],
          exports: [ConditionalService],
        }
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ enableFeature: boolean; apiUrl: string }>>>()
      const moduleWithFeature = factory({
        enableFeature: true,
        apiUrl: 'http://api.com',
      })

      matchExpectedModuleStructure(moduleWithFeature, {
        imports: 3,
        providers: [
          ConditionalService,
          {
            provide: 'FEATURE_ENABLED',
            useValue: true,
          },
        ],
        exports: [ConditionalService],
      })

      matchExpectedConfigModule(moduleWithFeature.imports[0], {
        name: 'ConditionalConfigSmartConfigModule',
        value: { enableFeature: true, apiUrl: 'http://api.com' },
      })

      matchExpectedConfigModule(moduleWithFeature.imports[2], {
        name: 'ConditionalConfigSmartConfigModule',
        value: { enableFeature: true, apiUrl: 'http://api.com' },
      })
      const moduleWithoutFeature = factory({
        enableFeature: false,
        apiUrl: 'http://api.com',
      })

      matchExpectedModuleStructure(moduleWithoutFeature, {
        imports: 2,
        providers: [
          ConditionalService,
          {
            provide: 'FEATURE_ENABLED',
            useValue: false,
          },
        ],
        exports: [ConditionalService],
      })

      matchExpectedConfigModule(moduleWithoutFeature.imports[0], {
        name: 'ConditionalConfigSmartConfigModule',
        value: { enableFeature: false, apiUrl: 'http://api.com' },
      })

      matchExpectedConfigModule(moduleWithoutFeature.imports[1], {
        name: 'ConditionalConfigSmartConfigModule',
        value: { enableFeature: false, apiUrl: 'http://api.com' },
      })
    })
  })

  describe('Advanced Factory Features', () => {
    class DbConfig {
      url: string
    }

    class CacheConfig {
      host: string
    }

    class Config {
      requiredProp: string
      defaultProp? = 'default'
    }

    it('should re-export config modules for other modules', () => {
      class MyService {}

      const factory = smartModule(
        DbConfig, // Pass SmartConfig classes inline
        CacheConfig,
        (imports, _dbConfig: DbConfig, _cacheConfig: CacheConfig) => ({
          providers: [MyService],
          // Re-export the config modules so other modules can access them
          exports: [MyService, ...imports],
        }),
      )

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string; host: string }>>>()

      const module = factory({
        url: 'postgres://localhost:5432',
        host: 'redis://localhost:6379',
      })

      matchExpectedModuleStructure(module, {
        imports: 2,
        providers: [MyService],
        exports: 3, // MyService + 2 config modules
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'DbConfigSmartConfigModule',
        value: { url: 'postgres://localhost:5432', host: 'redis://localhost:6379' },
      })

      matchExpectedConfigModule(module.imports[1], {
        name: 'CacheConfigSmartConfigModule',
        value: { url: 'postgres://localhost:5432', host: 'redis://localhost:6379' },
      })

      // Validate that the first export is MyService
      expect(module.exports?.[0]).toBe(MyService)

      matchExpectedConfigModule(module.exports?.[1], {
        name: 'DbConfigSmartConfigModule',
        value: { url: 'postgres://localhost:5432', host: 'redis://localhost:6379' },
        token: DbConfig,
      })

      matchExpectedConfigModule(module.exports?.[2], {
        name: 'CacheConfigSmartConfigModule',
        value: { url: 'postgres://localhost:5432', host: 'redis://localhost:6379' },
        token: CacheConfig,
      })
    })

    it('should allow access to imports array for advanced use cases', () => {
      class AdvancedService {}

      const factory = smartModule(Config, (imports, _config: Config) => {
        // Access the imports array containing generated config modules
        return {
          imports,
          providers: [
            AdvancedService,
            {
              provide: 'CONFIG_COUNT',
              useValue: imports.length,
            },
          ],
          exports: [AdvancedService],
        }
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>>()

      const module = factory({
        requiredProp: 'required',
      })

      matchExpectedModuleStructure(module, {
        imports: 2,
        providers: [
          AdvancedService,
          {
            provide: 'CONFIG_COUNT',
            useValue: 1,
          },
        ],
        exports: [AdvancedService],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'required',
          defaultProp: 'default',
        },
      })

      matchExpectedConfigModule(module.imports[1], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'required',
          defaultProp: 'default',
        },
      })
    })

    it('should combine factory with smartConfigs and smartImports (sync)', () => {
      class FactoryConfig {
        factoryValue = 'default'
      }

      class AdditionalConfig {
        additionalValue = 'extra'
      }

      class ImportedService {}

      const importedFactory = smartModule({
        providers: [ImportedService, { provide: 'IMPORTED_SERVICE', useValue: 'imported' }],
        exports: [ImportedService, 'IMPORTED_SERVICE'],
      })

      const factory = smartModule(FactoryConfig, (imports, config) => ({
        imports,
        providers: [{ provide: 'FACTORY_CONFIG', useValue: config }],
        exports: ['FACTORY_CONFIG'],
        smartConfigs: [AdditionalConfig],
        smartImports: [importedFactory],
      }))

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ factoryValue: string; additionalValue: string }>>>()

      const module = factory({ factoryValue: 'configured', additionalValue: 'extra_configured' })

      matchExpectedModuleStructure(module, {
        imports: 4,
        providers: [
          {
            provide: 'FACTORY_CONFIG',
            useValue: { factoryValue: 'configured', additionalValue: 'extra_configured' },
          },
        ],
        exports: ['FACTORY_CONFIG'],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'FactoryConfigSmartConfigModule',
        value: { factoryValue: 'configured', additionalValue: 'extra_configured' },
      })

      matchExpectedConfigModule(module.imports[1], {
        name: 'FactoryConfigSmartConfigModule',
        value: { factoryValue: 'configured', additionalValue: 'extra_configured' },
      })
      matchExpectedConfigModule(module.imports[2], {
        name: 'AdditionalConfigSmartConfigModule',
        value: { factoryValue: 'configured', additionalValue: 'extra_configured' },
      })

      const importedModule = module.imports[3] as DynamicModule

      matchExpectedModuleStructure(importedModule, {
        providers: [ImportedService, { provide: 'IMPORTED_SERVICE', useValue: 'imported' }],
        exports: [ImportedService, 'IMPORTED_SERVICE'],
      })
    })

    it('should combine factory with smartConfigs and smartImports (async)', async () => {
      class AsyncFactoryConfig {
        asyncValue = 'default'
      }

      class AsyncAdditionalConfig {
        asyncExtra = 'extra'
      }

      class AsyncImportedService {}

      const asyncImportedFactory = smartModule({
        providers: [AsyncImportedService, { provide: 'ASYNC_IMPORTED_SERVICE', useValue: 'async_imported' }],
        exports: [AsyncImportedService, 'ASYNC_IMPORTED_SERVICE'],
      })

      const factory = smartModule(AsyncFactoryConfig, (imports, config) => ({
        imports,
        providers: [{ provide: 'ASYNC_FACTORY_CONFIG', useValue: config }],
        exports: ['ASYNC_FACTORY_CONFIG'],
        smartConfigs: [AsyncAdditionalConfig],
        smartImports: [asyncImportedFactory],
      }))

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ asyncValue: string; asyncExtra: string }>>>()

      const module = factory({
        imports: [{ module: class ExternalModule {} }],
        inject: ['EXTERNAL_SERVICE'],
        useFactory: async () => ({ asyncValue: 'async_configured', asyncExtra: 'async_extra_configured' }),
      })

      matchExpectedModuleStructure(module, {
        imports: 4,
        providers: [{ provide: 'ASYNC_FACTORY_CONFIG', useValue: undefined }],
        exports: ['ASYNC_FACTORY_CONFIG'],
      })

      await matchExpectedConfigModule(module.imports[0], {
        name: 'AsyncFactoryConfigSmartConfigModule',
        value: { asyncValue: 'async_configured', asyncExtra: 'async_extra_configured' },
        isAsync: true,
      })

      await matchExpectedConfigModule(module.imports[1], {
        name: 'AsyncFactoryConfigSmartConfigModule',
        value: { asyncValue: 'async_configured', asyncExtra: 'async_extra_configured' },
        isAsync: true,
      })
      await matchExpectedConfigModule(module.imports[2], {
        name: 'AsyncAdditionalConfigSmartConfigModule',
        value: { asyncValue: 'async_configured', asyncExtra: 'async_extra_configured' },
        isAsync: true,
      })

      const importedModule = module.imports[3] as DynamicModule

      matchExpectedModuleStructure(importedModule, {
        providers: [AsyncImportedService, { provide: 'ASYNC_IMPORTED_SERVICE', useValue: 'async_imported' }],
        exports: [AsyncImportedService, 'ASYNC_IMPORTED_SERVICE'],
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid inline smart config', () => {
      const invalidConfig = 'string' as any

      try {
        const factory = smartModule(invalidConfig, (_imports, _config) => ({}))
        typeAssert<TypeTest<typeof factory, ExpectedFactoryType>>()
        const factoryAsAny = factory as any
        factoryAsAny({ test: 'value' })
        throw new Error('Should have thrown error')
      } catch (error: any) {
        if (!error.message.includes('not valid smart config base for module')) {
          throw new Error('Wrong error message')
        }
      }
    })

    it('should handle extended smart config as inline config', () => {
      class BaseConfig {
        value = 'default'
      }

      const factory = smartModule(
        {
          smartConfig: BaseConfig,
          label: 'extended' as const,
          prefix: 'ext_' as const,
        },
        (imports, config) => ({
          providers: [{ provide: 'EXTENDED_CONFIG', useValue: config }],
          exports: ['EXTENDED_CONFIG'],
        }),
      )

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ extended: { ext_value: string } }>>>()

      const module = factory({ extended: { ext_value: 'configured' } })

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [{ provide: 'EXTENDED_CONFIG', useValue: { value: 'configured' } }],
        exports: ['EXTENDED_CONFIG'],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'BaseConfigSmartConfigModule',
        value: { value: 'configured' },
      })
    })
  })

  describe('Factory Limitations and Best Practices', () => {
    class Config {
      requiredProp: string
      defaultProp? = 'default'
    }

    it('should work only with synchronous module creation', () => {
      class SyncOnlyService {}

      const factory = smartModule(Config, (imports, config: Config) => ({
        imports,
        providers: [
          SyncOnlyService,
          {
            provide: 'SYNC_VALUE',
            useValue: config.requiredProp,
          },
        ],
        exports: [SyncOnlyService],
      }))

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>>()

      const module = factory({
        requiredProp: 'required',
      })

      matchExpectedModuleStructure(module, {
        imports: 2,
        providers: [
          SyncOnlyService,
          {
            provide: 'SYNC_VALUE',
            useValue: 'required',
          },
        ],
        exports: [SyncOnlyService],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'required',
          defaultProp: 'default',
        },
      })

      matchExpectedConfigModule(module.imports[1], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'required',
          defaultProp: 'default',
        },
      })
    })

    it('should support accessing config in factory function', () => {
      class ConfigurableModule {
        value: string
      }

      const factory = smartModule(ConfigurableModule, (_imports, _config: ConfigurableModule) => ({
        imports: _imports,
      }))

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ value: string }>>>()

      const module = factory({ value: 'test-value' })

      matchExpectedModuleStructure(module, {
        imports: 2, // Factory pattern with inline config adds the config twice
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigurableModuleSmartConfigModule',
        value: { value: 'test-value' },
      })

      matchExpectedConfigModule(module.imports[1], {
        name: 'ConfigurableModuleSmartConfigModule',
        value: { value: 'test-value' },
      })
    })
  })

  describe('Factory Pattern Edge Cases', () => {
    it('should handle factory with no inline configs', () => {
      class DummyConfig {
        dummy?: string = 'dummy'
      }

      const factory = smartModule(DummyConfig, _imports => ({
        imports: _imports,
      }))

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ dummy?: string }>>>()

      const module = factory({ dummy: 'test' })

      matchExpectedModuleStructure(module, {
        imports: 2, // Factory pattern with inline config creates config twice
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'DummyConfigSmartConfigModule',
        value: { dummy: 'test' },
      })

      matchExpectedConfigModule(module.imports[1], {
        name: 'DummyConfigSmartConfigModule',
        value: { dummy: 'test' },
      })
    })

    it('should handle factory pattern with async configuration', async () => {
      class AsyncConfig {
        value: string
      }

      const factory = smartModule(AsyncConfig, imports => ({
        imports,
      }))

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ value: string }>>>()

      const asyncConfig = {
        useFactory: async () => ({ value: 'async-value' }),
      }

      const module = factory(asyncConfig)

      matchExpectedModuleStructure(module, {
        imports: 2, // Factory pattern with inline config adds the config twice
      })

      await matchExpectedConfigModule(module.imports[0], {
        name: 'AsyncConfigSmartConfigModule',
        value: { value: 'async-value' },
        isAsync: true,
      })

      await matchExpectedConfigModule(module.imports[1], {
        name: 'AsyncConfigSmartConfigModule',
        value: { value: 'async-value' },
        isAsync: true,
      })
    })
  })
})
