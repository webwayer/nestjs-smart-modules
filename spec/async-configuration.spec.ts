import { DynamicModule } from '@nestjs/common'
import { smartModule } from '../src/smartModule'
import {
  typeAssert,
  TypeTest,
  ExpectedFactoryType,
  matchExpectedModuleStructure,
  matchExpectedConfigModule,
} from './utils/spec-helpers'

describe('Asynchronous Configuration', () => {
  describe('Basic Async Configuration', () => {
    class Config {
      requiredProp: string
      defaultProp? = 'default'
    }

    class AuthConfig {
      jwtSecret: string
      expiresIn: string
    }

    it('should create module with async factory', async () => {
      const factory = smartModule({
        smartConfigs: [Config],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>>()

      const module = factory({
        useFactory: () => ({
          requiredProp: 'async-value',
        }),
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      await matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'async-value',
          defaultProp: 'default',
        },
        isAsync: true,
      })
    })

    it('should create module with async factory and providers', async () => {
      class AsyncServiceWithProviders {}

      const factory = smartModule({
        smartConfigs: [AuthConfig],
        providers: [AsyncServiceWithProviders],
        exports: [AsyncServiceWithProviders],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ jwtSecret: string; expiresIn: string }>>>()

      const module = factory({
        useFactory: () => ({
          jwtSecret: 'secret-key',
          expiresIn: '1h',
        }),
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [AsyncServiceWithProviders],
        exports: [AsyncServiceWithProviders],
      })

      await matchExpectedConfigModule(module.imports[0], {
        name: 'AuthConfigSmartConfigModule',
        value: {
          jwtSecret: 'secret-key',
          expiresIn: '1h',
        },
        isAsync: true,
      })
    })

    it('should handle async factory with dependencies', async () => {
      class DatabaseConfig {
        url: string
        poolSize?: number = 10
      }

      class MockDbService {}

      const factory = smartModule({
        smartConfigs: [DatabaseConfig],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string; poolSize?: number }>>>()

      const module = factory({
        imports: [{ module: MockDbService }],
        inject: [MockDbService],
        useFactory: (_dbService: MockDbService) => ({
          url: 'postgres://localhost',
          poolSize: 20,
        }),
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      await matchExpectedConfigModule(module.imports[0], {
        name: 'DatabaseConfigSmartConfigModule',
        value: {
          url: 'postgres://localhost',
          poolSize: 20,
        },
        isAsync: true,
      })
    })
  })

  describe('Advanced Async Configuration', () => {
    it('should handle async config with labels', async () => {
      class LabeledConfig {
        value: string
        flag?: boolean
      }

      const factory = smartModule({
        smartConfigs: [{ smartConfig: LabeledConfig, label: 'labeled' as const }],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ labeled: { value: string; flag?: boolean } }>>>()

      const module = factory({
        useFactory: () => ({
          labeled: { value: 'async-labeled', flag: true },
        }),
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      await matchExpectedConfigModule(module.imports[0], {
        name: 'LabeledConfigSmartConfigModule',
        value: { value: 'async-labeled', flag: true },
        isAsync: true,
      })
    })

    it('should handle async config with custom token', async () => {
      class TokenConfig {
        value: string
      }

      const factory = smartModule({
        smartConfigs: [
          {
            smartConfig: TokenConfig,
            token: 'CUSTOM_TOKEN',
          },
        ],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ value: string }>>>()

      const module = factory({
        useFactory: () => ({ value: 'async-token-value' }),
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      await matchExpectedConfigModule(module.imports[0], {
        name: 'TokenConfigSmartConfigModule',
        token: 'CUSTOM_TOKEN',
        value: { value: 'async-token-value' },
        isAsync: true,
      })
    })

    it('should handle async config with smart imports', async () => {
      class Config {
        requiredProp: string
        defaultProp? = 'default'
      }

      class ImportConfig {
        importValue = 'default'
      }

      class ImportedAsyncService {}

      class MainServiceWithImport {}

      const importedFactory = smartModule({
        smartConfigs: [ImportConfig],
        providers: [ImportedAsyncService],
        exports: [ImportedAsyncService],
      })

      const mainFactory = smartModule({
        smartConfigs: [Config],
        smartImports: [
          {
            smartImport: importedFactory,
            label: 'imported' as const,
          },
        ],
        providers: [MainServiceWithImport],
        exports: [MainServiceWithImport],
      })

      typeAssert<
        TypeTest<
          typeof mainFactory,
          ExpectedFactoryType<{
            requiredProp: string
            defaultProp?: string
            imported: { importValue: string }
          }>
        >
      >()

      const module = mainFactory({
        useFactory: async () => ({
          requiredProp: 'async-main',
          defaultProp: 'async-default',
          imported: { importValue: 'async-imported' },
        }),
      })

      matchExpectedModuleStructure(module, {
        imports: 2,
        providers: [MainServiceWithImport],
        exports: [MainServiceWithImport],
      })

      await matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'async-main',
          defaultProp: 'async-default',
          imported: { importValue: 'async-imported' },
        },
        isAsync: true,
      })

      const importedModule = module.imports[1] as DynamicModule

      matchExpectedModuleStructure(importedModule, {
        imports: 1,
        providers: [ImportedAsyncService],
        exports: [ImportedAsyncService],
      })

      await matchExpectedConfigModule(importedModule.imports[0], {
        name: 'ImportConfigSmartConfigModule',
        value: { importValue: 'async-imported' },
        isAsync: true,
      })
    })
  })

  describe('Multiple Async Configurations', () => {
    class DbConfig {
      url: string
    }

    class CacheConfig {
      host: string
    }

    it('should handle multiple async config classes', async () => {
      const factory = smartModule({
        smartConfigs: [DbConfig, CacheConfig],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string; host: string }>>>()

      const module = factory({
        useFactory: () => ({
          url: 'postgres://localhost:5432',
          host: 'redis://localhost:6379',
        }),
      })

      matchExpectedModuleStructure(module, {
        imports: 2,
      })

      await matchExpectedConfigModule(module.imports[0], {
        name: 'DbConfigSmartConfigModule',
        value: {
          url: 'postgres://localhost:5432',
          host: 'redis://localhost:6379',
        },
        isAsync: true,
      })

      await matchExpectedConfigModule(module.imports[1], {
        name: 'CacheConfigSmartConfigModule',
        value: {
          url: 'postgres://localhost:5432',
          host: 'redis://localhost:6379',
        },
        isAsync: true,
      })
    })
  })

  describe('Sync vs Async Best Practices', () => {
    class Config {
      requiredProp: string
      defaultProp? = 'default'
    }

    class AuthConfig {
      jwtSecret: string
      expiresIn: string
    }

    it('should demonstrate sync configuration (preferred approach)', () => {
      class SyncService {}

      const factory = smartModule({
        smartConfigs: [Config],
        providers: [SyncService],
        exports: [SyncService],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>>()

      const gatheredConfig = {
        requiredProp: process.env.REQUIRED_PROP || 'sync-default',
      }

      const module = factory(gatheredConfig)

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [SyncService],
        exports: [SyncService],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'sync-default',
          defaultProp: 'default',
        },
      })
    })

    it('should demonstrate async configuration (when necessary)', async () => {
      class AsyncOnlyService {}

      const factory = smartModule({
        smartConfigs: [AuthConfig],
        providers: [AsyncOnlyService],
        exports: [AsyncOnlyService],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ jwtSecret: string; expiresIn: string }>>>()

      const asyncConfig = {
        useFactory: () => ({
          jwtSecret: 'runtime-secret',
          expiresIn: '24h',
        }),
      }

      const module = factory(asyncConfig)

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [AsyncOnlyService],
        exports: [AsyncOnlyService],
      })

      await matchExpectedConfigModule(module.imports[0], {
        name: 'AuthConfigSmartConfigModule',
        value: {
          jwtSecret: 'runtime-secret',
          expiresIn: '24h',
        },
        isAsync: true,
      })
    })
  })

  describe('Async with Extended SmartConfig Syntax', () => {
    it('should handle extended smart config with async parameters', async () => {
      class ExtendedConfig {
        value: string
      }

      const factory = smartModule({
        smartConfigs: [{ smartConfig: ExtendedConfig, label: 'extended' as const }],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ extended: { value: string } }>>>()

      const asyncModule = factory({
        useFactory: () => ({ extended: { value: 'async-extended' } }),
      })

      matchExpectedModuleStructure(asyncModule, {
        imports: 1,
      })

      await matchExpectedConfigModule(asyncModule.imports[0], {
        name: 'ExtendedConfigSmartConfigModule',
        value: { value: 'async-extended' },
        isAsync: true,
      })
    })
  })

  describe('Asynchronous Configuration Edge Cases', () => {
    it('should handle async config with missing dependencies', async () => {
      class AsyncConfig {
        value: string
      }

      const factory = smartModule({
        smartConfigs: [AsyncConfig],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ value: string }>>>()

      const asyncModule = factory({
        useFactory: () => ({ value: 'test' }),
      })

      matchExpectedModuleStructure(asyncModule, {
        imports: 1,
      })

      await matchExpectedConfigModule(asyncModule.imports[0], {
        name: 'AsyncConfigSmartConfigModule',
        value: { value: 'test' },
        isAsync: true,
      })
    })

    it('should handle async config with throwing factory', () => {
      class ThrowingConfig {
        value: string
      }

      const factory = smartModule({
        smartConfigs: [ThrowingConfig],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ value: string }>>>()

      const asyncModule = factory({
        useFactory: () => {
          throw new Error('Factory error')
        },
      })

      matchExpectedModuleStructure(asyncModule, {
        imports: 1,
        providers: undefined,
      })

      const configModule = asyncModule.imports[0] as DynamicModule

      matchExpectedModuleStructure(configModule, {
        exports: 1,
        providers: [
          expect.objectContaining({
            provide: ThrowingConfig,
            useFactory: expect.any(Function),
          }),
        ],
      })
    })
  })
})
