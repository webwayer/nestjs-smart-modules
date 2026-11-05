import type { DynamicModule } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { smartModule } from '../src/smartModule'
import type { AsyncParams } from '../src/types'
import type { TypeTest, ExpectedFactoryType } from './utils/spec-helpers'
import { matchExpectedModuleStructure, matchExpectedConfigModule, typeAssert } from './utils/spec-helpers'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- what a config-less import takes when alone
type Alone = {} | null
type AloneFactory = (arg: Alone | AsyncParams<Alone>) => DynamicModule

describe('Extended Imports Without Configuration', () => {
  @Injectable()
  class PlainService {}

  class RequiredConfig {
    url: string
  }

  const plain = smartModule({ providers: [PlainService], exports: [PlainService] })
  const plainFromFunction = smartModule(() => ({ providers: [PlainService], exports: [PlainService] }))

  describe('Alone', () => {
    it('should accept an empty object for an object definition', () => {
      const factory = smartModule({ smartImports: [{ smartImport: plain }] })

      typeAssert<TypeTest<typeof factory, AloneFactory>>()

      const module = factory({})

      matchExpectedModuleStructure(module, { imports: 1 })
      matchExpectedModuleStructure(module.imports![0] as DynamicModule, {
        providers: [PlainService],
        exports: [PlainService],
      })
    })

    it('should accept an empty object for a definition factory', () => {
      const factory = smartModule({ smartImports: [{ smartImport: plainFromFunction }] })

      typeAssert<TypeTest<typeof factory, AloneFactory>>()

      const module = factory({})

      matchExpectedModuleStructure(module, { imports: 1 })
      matchExpectedModuleStructure(module.imports![0] as DynamicModule, {
        providers: [PlainService],
        exports: [PlainService],
      })
    })

    it('should ignore a prefix, there being nothing to prefix', () => {
      const factory = smartModule({ smartImports: [{ smartImport: plain, prefix: 'app_' as const }] })

      typeAssert<TypeTest<typeof factory, AloneFactory>>()

      const module = factory({})

      matchExpectedModuleStructure(module, { imports: 1 })
      matchExpectedModuleStructure(module.imports![0] as DynamicModule, {
        providers: [PlainService],
        exports: [PlainService],
      })
    })

    it('should keep accepting the async null this type used to require', () => {
      const factory = smartModule({ smartImports: [{ smartImport: plainFromFunction }] })

      typeAssert<TypeTest<typeof factory, AloneFactory>>()

      const module = factory({ useFactory: () => null })

      matchExpectedModuleStructure(module, { imports: 1 })
      matchExpectedModuleStructure(module.imports![0] as DynamicModule, {
        providers: [PlainService],
        exports: [PlainService],
      })
    })
  })

  describe('Beside Other Entries', () => {
    it('should contribute nothing beside a config', () => {
      const factory = smartModule({
        smartConfigs: [RequiredConfig],
        smartImports: [{ smartImport: plain }],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string }>>>()

      const module = factory({ url: 'postgres://db' })

      matchExpectedModuleStructure(module, { imports: 2 })
      matchExpectedConfigModule(module.imports![0], {
        name: 'RequiredConfigSmartConfigModule',
        value: { url: 'postgres://db' },
      })
      matchExpectedModuleStructure(module.imports![1] as DynamicModule, {
        providers: [PlainService],
        exports: [PlainService],
      })
    })

    it('should contribute nothing beside a config with a prefix', () => {
      const factory = smartModule({
        smartConfigs: [RequiredConfig],
        smartImports: [{ smartImport: plain, prefix: 'app_' as const }],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string }>>>()

      const module = factory({ url: 'postgres://db' })

      matchExpectedModuleStructure(module, { imports: 2 })
      matchExpectedConfigModule(module.imports![0], {
        name: 'RequiredConfigSmartConfigModule',
        value: { url: 'postgres://db' },
      })
    })

    it('should still require what the config beside it requires', () => {
      const factory = smartModule({
        smartConfigs: [RequiredConfig],
        smartImports: [{ smartImport: plain }],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string }>>>()

      // @ts-expect-error `url` is required by the config beside the import
      const module = factory({})

      matchExpectedModuleStructure(module, { imports: 2 })
    })

    it('should contribute nothing beside the plain form', () => {
      const factory = smartModule({ smartImports: [plain, { smartImport: plainFromFunction }] })

      // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- the plain form contributes {}
      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{}>>>()

      const module = factory({})

      matchExpectedModuleStructure(module, { imports: 2 })
    })

    it('should stay the same with several of them', () => {
      const factory = smartModule({
        smartImports: [{ smartImport: plain }, { smartImport: plainFromFunction, prefix: 'app_' as const }],
      })

      typeAssert<TypeTest<typeof factory, AloneFactory>>()

      const module = factory({})

      matchExpectedModuleStructure(module, { imports: 2 })
    })

    it('should contribute nothing through a module that composes one', () => {
      const inner = smartModule({ smartImports: [{ smartImport: plain }] })
      const factory = smartModule({ smartConfigs: [RequiredConfig], smartImports: [inner] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string }>>>()

      const module = factory({ url: 'postgres://db' })

      matchExpectedModuleStructure(module, { imports: 2 })

      const importedModule = module.imports![1] as DynamicModule

      matchExpectedModuleStructure(importedModule, { imports: 1 })
      matchExpectedModuleStructure(importedModule.imports![0] as DynamicModule, {
        providers: [PlainService],
        exports: [PlainService],
      })
    })
  })

  describe('What Stays As It Was', () => {
    class PlainModule {}

    it('should keep the configuration of a factory with an optional parameter', () => {
      function forRoot(_options?: { url?: string } | AsyncParams<{ url?: string }>): DynamicModule {
        return { module: PlainModule }
      }

      const factory = smartModule({ smartImports: [{ smartImport: forRoot }] })

      matchExpectedModuleStructure(factory({ url: 'postgres://db' }), { imports: 1 })

      // @ts-expect-error `port` is not a field of the factory's configuration
      matchExpectedModuleStructure(factory({ port: 5432 }), { imports: 1 })
    })

    it('should keep the configuration of a factory with a required parameter', () => {
      function forRoot(_options: { url: string } | AsyncParams<{ url: string }>): DynamicModule {
        return { module: PlainModule }
      }

      const factory = smartModule({ smartImports: [{ smartImport: forRoot }] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string }>>>()

      matchExpectedModuleStructure(factory({ url: 'postgres://db' }), { imports: 1 })

      // @ts-expect-error `url` is required by the factory
      matchExpectedModuleStructure(factory({}), { imports: 1 })
    })

    it('should keep accepting null for a labelled import', () => {
      const factory = smartModule({ smartImports: [{ smartImport: plain, label: 'plain' as const }] })

      const module = factory({ plain: null })

      matchExpectedModuleStructure(module, { imports: 1 })
      matchExpectedModuleStructure(module.imports![0] as DynamicModule, {
        providers: [PlainService],
        exports: [PlainService],
      })
    })
  })
})
