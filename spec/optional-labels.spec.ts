import type { DynamicModule } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { smartModule } from '../src/smartModule'
import type { TypeTest, ExpectedFactoryType } from './utils/spec-helpers'
import { matchExpectedModuleStructure, matchExpectedConfigModule, typeAssert } from './utils/spec-helpers'

describe('Optional Labels', () => {
  class TuningConfig {
    static label = 'tuning' as const
    timeZone?: string = 'UTC'
  }

  class DatabaseConfig {
    static label = 'database' as const
    url: string
    poolSize?: number = 10
  }

  describe('Labelled Configs', () => {
    it('should default a missing label whose config has no required field', () => {
      const factory = smartModule({ smartConfigs: [TuningConfig] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ tuning?: { timeZone?: string } }>>>()

      const module = factory({})

      matchExpectedModuleStructure(module, { imports: 1 })
      matchExpectedConfigModule(module.imports![0], {
        name: 'TuningConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
      })
    })

    it('should still accept the label as an empty object or with values', () => {
      const factory = smartModule({ smartConfigs: [TuningConfig] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ tuning?: { timeZone?: string } }>>>()

      matchExpectedConfigModule(factory({ tuning: {} }).imports![0], {
        name: 'TuningConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
      })
      matchExpectedConfigModule(factory({ tuning: { timeZone: 'Asia/Tokyo' } }).imports![0], {
        name: 'TuningConfigSmartConfigModule',
        value: { timeZone: 'Asia/Tokyo' },
      })
    })

    it('should read an explicitly undefined label like a missing one', () => {
      const factory = smartModule({ smartConfigs: [TuningConfig] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ tuning?: { timeZone?: string } }>>>()

      matchExpectedConfigModule(factory({ tuning: undefined }).imports![0], {
        name: 'TuningConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
      })
    })

    it('should make the label of a config with no fields optional', () => {
      class MarkerConfig {
        static label = 'marker' as const
      }

      const factory = smartModule({ smartConfigs: [MarkerConfig] })

      // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- the shape of a class with no fields
      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ marker?: {} }>>>()

      matchExpectedConfigModule(factory({}).imports![0], {
        name: 'MarkerConfigSmartConfigModule',
        value: {},
      })
    })

    it('should apply to an inline label', () => {
      class InlineConfig {
        timeZone?: string = 'UTC'
      }

      const factory = smartModule({ smartConfigs: [{ smartConfig: InlineConfig, label: 'inline' as const }] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ inline?: { timeZone?: string } }>>>()

      matchExpectedConfigModule(factory({}).imports![0], {
        name: 'InlineConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
      })
    })

    it('should apply to a label combined with a prefix', () => {
      const factory = smartModule({ smartConfigs: [{ smartConfig: TuningConfig, prefix: 'tz_' as const }] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ tuning?: { tz_timeZone?: string } }>>>()

      matchExpectedConfigModule(factory({}).imports![0], {
        name: 'TuningConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
      })
      matchExpectedConfigModule(factory({ tuning: { tz_timeZone: 'Asia/Tokyo' } }).imports![0], {
        name: 'TuningConfigSmartConfigModule',
        value: { timeZone: 'Asia/Tokyo' },
      })
    })

    it('should hand the defaults to a definition factory', () => {
      const factory = smartModule(TuningConfig, (imports, tuning) => ({
        imports,
        providers: [{ provide: 'TIME_ZONE', useValue: tuning.timeZone }],
      }))

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ tuning?: { timeZone?: string } }>>>()

      const module = factory({})

      matchExpectedModuleStructure(module, {
        imports: 2,
        providers: [{ provide: 'TIME_ZONE', useValue: 'UTC' }],
      })
      matchExpectedConfigModule(module.imports![0], {
        name: 'TuningConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
      })
    })
  })

  describe('Required Fields', () => {
    it('should keep the label of a config with a required field required', () => {
      const factory = smartModule({ smartConfigs: [DatabaseConfig] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ database: { url: string; poolSize?: number } }>>>()

      const module = factory({ database: { url: 'postgres://db' } })

      matchExpectedModuleStructure(module, { imports: 1 })
      matchExpectedConfigModule(module.imports![0], {
        name: 'DatabaseConfigSmartConfigModule',
        value: { url: 'postgres://db', poolSize: 10 },
      })
    })

    it('should reject a missing required label at compile time and read it as empty at run time', () => {
      const factory = smartModule({ smartConfigs: [DatabaseConfig] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ database: { url: string; poolSize?: number } }>>>()

      // @ts-expect-error the required label must be stated (a class cannot tell at run time)
      const module = factory({})

      matchExpectedConfigModule(module.imports![0], {
        name: 'DatabaseConfigSmartConfigModule',
        value: { poolSize: 10 },
      })
    })

    it('should reject a label stated without its required field', () => {
      const factory = smartModule({ smartConfigs: [DatabaseConfig] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ database: { url: string; poolSize?: number } }>>>()

      // @ts-expect-error `url` is required inside the label
      const module = factory({ database: {} })

      matchExpectedConfigModule(module.imports![0], {
        name: 'DatabaseConfigSmartConfigModule',
        value: { poolSize: 10 },
      })
    })

    it('should require only the labels that need it when both kinds are listed', () => {
      const factory = smartModule({ smartConfigs: [TuningConfig, DatabaseConfig] })

      typeAssert<
        TypeTest<
          typeof factory,
          ExpectedFactoryType<{ tuning?: { timeZone?: string }; database: { url: string; poolSize?: number } }>
        >
      >()

      const module = factory({ database: { url: 'postgres://db' } })

      matchExpectedModuleStructure(module, { imports: 2 })
      matchExpectedConfigModule(module.imports![0], {
        name: 'TuningConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
      })
      matchExpectedConfigModule(module.imports![1], {
        name: 'DatabaseConfigSmartConfigModule',
        value: { url: 'postgres://db', poolSize: 10 },
      })
    })

    it('should keep a label two configs share required when either one needs it', () => {
      class SharedOptionalConfig {
        static label = 'shared' as const
        timeZone?: string = 'UTC'
      }
      class SharedRequiredConfig {
        static label = 'shared' as const
        url: string
      }

      const factory = smartModule({ smartConfigs: [SharedOptionalConfig, SharedRequiredConfig] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ shared: { timeZone?: string; url: string } }>>>()

      const module = factory({ shared: { url: 'postgres://db' } })

      matchExpectedModuleStructure(module, { imports: 2 })
      matchExpectedConfigModule(module.imports![0], {
        name: 'SharedOptionalConfigSmartConfigModule',
        value: { timeZone: 'UTC', url: 'postgres://db' },
      })
      matchExpectedConfigModule(module.imports![1], {
        name: 'SharedRequiredConfigSmartConfigModule',
        value: { url: 'postgres://db' },
      })
    })

    it('should leave a label two configs share optional when neither needs it', () => {
      class SharedTimeZoneConfig {
        static label = 'shared' as const
        timeZone?: string = 'UTC'
      }
      class SharedLocaleConfig {
        static label = 'shared' as const
        locale?: string = 'en'
      }

      const factory = smartModule({ smartConfigs: [SharedTimeZoneConfig, SharedLocaleConfig] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ shared?: { timeZone?: string; locale?: string } }>>>()

      const module = factory({})

      matchExpectedModuleStructure(module, { imports: 2 })
      matchExpectedConfigModule(module.imports![0], {
        name: 'SharedTimeZoneConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
      })
      matchExpectedConfigModule(module.imports![1], {
        name: 'SharedLocaleConfigSmartConfigModule',
        value: { locale: 'en' },
      })
    })
  })

  describe('Labelled Imports', () => {
    it('should default a missing label whose whole subtree is optional', () => {
      const inner = smartModule({ smartConfigs: [TuningConfig] })
      const factory = smartModule({ smartImports: [{ smartImport: inner, label: 'inner' as const }] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ inner?: { tuning?: { timeZone?: string } } }>>>()

      const module = factory({})

      matchExpectedModuleStructure(module, { imports: 1 })

      const importedModule = module.imports![0] as DynamicModule

      matchExpectedModuleStructure(importedModule, { imports: 1 })
      matchExpectedConfigModule(importedModule.imports![0], {
        name: 'TuningConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
      })
    })

    it('should apply through every level of labelled imports', () => {
      const inner = smartModule({ smartConfigs: [TuningConfig] })
      const middle = smartModule({ smartImports: [{ smartImport: inner, label: 'inner' as const }] })
      const factory = smartModule({ smartImports: [{ smartImport: middle, label: 'middle' as const }] })

      typeAssert<
        TypeTest<typeof factory, ExpectedFactoryType<{ middle?: { inner?: { tuning?: { timeZone?: string } } } }>>
      >()

      const module = factory({})

      matchExpectedModuleStructure(module, { imports: 1 })

      const middleModule = module.imports![0] as DynamicModule

      matchExpectedModuleStructure(middleModule, { imports: 1 })

      const innerModule = middleModule.imports![0] as DynamicModule

      matchExpectedModuleStructure(innerModule, { imports: 1 })
      matchExpectedConfigModule(innerModule.imports![0], {
        name: 'TuningConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
      })
    })

    it('should apply to a labelled and prefixed import', () => {
      class PlainConfig {
        timeZone?: string = 'UTC'
      }

      const inner = smartModule({ smartConfigs: [PlainConfig] })
      const factory = smartModule({
        smartImports: [{ smartImport: inner, label: 'inner' as const, prefix: 'tz_' as const }],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ inner?: { tz_timeZone?: string } }>>>()

      const module = factory({})

      matchExpectedModuleStructure(module, { imports: 1 })

      const importedModule = module.imports![0] as DynamicModule

      matchExpectedModuleStructure(importedModule, { imports: 1 })
      matchExpectedConfigModule(importedModule.imports![0], {
        name: 'PlainConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
      })
    })

    it('should keep the label required when anything in the subtree is required', () => {
      const inner = smartModule({ smartConfigs: [TuningConfig, DatabaseConfig] })
      const factory = smartModule({ smartImports: [{ smartImport: inner, label: 'inner' as const }] })

      typeAssert<
        TypeTest<
          typeof factory,
          ExpectedFactoryType<{
            inner: { tuning?: { timeZone?: string }; database: { url: string; poolSize?: number } }
          }>
        >
      >()

      const module = factory({ inner: { database: { url: 'postgres://db' } } })

      matchExpectedModuleStructure(module, { imports: 1 })

      const importedModule = module.imports![0] as DynamicModule

      matchExpectedModuleStructure(importedModule, { imports: 2 })
      matchExpectedConfigModule(importedModule.imports![0], {
        name: 'TuningConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
      })
      matchExpectedConfigModule(importedModule.imports![1], {
        name: 'DatabaseConfigSmartConfigModule',
        value: { url: 'postgres://db', poolSize: 10 },
      })
    })

    it('should carry an optional label up through an unlabelled import', () => {
      const inner = smartModule({ smartConfigs: [TuningConfig] })
      const factory = smartModule({ smartImports: [inner] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ tuning?: { timeZone?: string } }>>>()

      const module = factory({})

      matchExpectedModuleStructure(module, { imports: 1 })

      const importedModule = module.imports![0] as DynamicModule

      matchExpectedModuleStructure(importedModule, { imports: 1 })
      matchExpectedConfigModule(importedModule.imports![0], {
        name: 'TuningConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
      })
    })

    describe('Without Any Configuration', () => {
      @Injectable()
      class PlainService {}

      it('should make the label of an object definition optional', () => {
        const inner = smartModule({ providers: [PlainService], exports: [PlainService] })
        const factory = smartModule({ smartImports: [{ smartImport: inner, label: 'plain' as const }] })

        typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ plain?: null }>>>()

        const module = factory({})

        matchExpectedModuleStructure(module, { imports: 1 })
        matchExpectedModuleStructure(module.imports![0] as DynamicModule, {
          providers: [PlainService],
          exports: [PlainService],
        })
      })

      it('should make the label of a definition factory optional', () => {
        const inner = smartModule(() => ({ providers: [PlainService], exports: [PlainService] }))
        const factory = smartModule({ smartImports: [{ smartImport: inner, label: 'plain' as const }] })

        typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ plain?: null }>>>()

        const module = factory({})

        matchExpectedModuleStructure(module, { imports: 1 })
        matchExpectedModuleStructure(module.imports![0] as DynamicModule, {
          providers: [PlainService],
          exports: [PlainService],
        })
      })

      it('should still accept the null the label used to require', () => {
        const inner = smartModule(() => ({ providers: [PlainService], exports: [PlainService] }))
        const factory = smartModule({ smartImports: [{ smartImport: inner, label: 'plain' as const }] })

        typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ plain?: null }>>>()

        const module = factory({ plain: null })

        matchExpectedModuleStructure(module, { imports: 1 })
        matchExpectedModuleStructure(module.imports![0] as DynamicModule, {
          providers: [PlainService],
          exports: [PlainService],
        })
      })
    })
  })

  describe('Async Configuration', () => {
    it('should default a label the async factory leaves out', async () => {
      const factory = smartModule({ smartConfigs: [TuningConfig] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ tuning?: { timeZone?: string } }>>>()

      const module = factory({ useFactory: () => ({}) })

      matchExpectedModuleStructure(module, { imports: 1 })
      await matchExpectedConfigModule(module.imports![0], {
        name: 'TuningConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
        isAsync: true,
      })
    })

    it('should default a labelled import the async factory leaves out', async () => {
      const inner = smartModule({ smartConfigs: [TuningConfig] })
      const factory = smartModule({ smartImports: [{ smartImport: inner, label: 'inner' as const }] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ inner?: { tuning?: { timeZone?: string } } }>>>()

      const module = factory({ useFactory: async () => ({}) })

      matchExpectedModuleStructure(module, { imports: 1 })

      const importedModule = module.imports![0] as DynamicModule

      matchExpectedModuleStructure(importedModule, { imports: 1 })
      await matchExpectedConfigModule(importedModule.imports![0], {
        name: 'TuningConfigSmartConfigModule',
        value: { timeZone: 'UTC' },
        isAsync: true,
      })
    })

    it('should reject an async factory that leaves out a required label', async () => {
      const factory = smartModule({ smartConfigs: [DatabaseConfig] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ database: { url: string; poolSize?: number } }>>>()

      // @ts-expect-error the factory's result must state the required label
      const module = factory({ useFactory: () => ({}) })

      await matchExpectedConfigModule(module.imports![0], {
        name: 'DatabaseConfigSmartConfigModule',
        value: { poolSize: 10 },
        isAsync: true,
      })
    })
  })
})
