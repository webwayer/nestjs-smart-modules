import type { DynamicModule } from '@nestjs/common'
import { smartModule } from '../src/smartModule'
import type { SmartSchema, SmartSchemaConfig, SmartSchemaImport } from '../src/schema'
import type { TypeTest, ExpectedFactoryType } from './utils/spec-helpers'
import {
  matchExpectedModuleStructure,
  matchExpectedConfigModule,
  matchExpectedSchema,
  typeAssert,
} from './utils/spec-helpers'

describe('Factory Schema', () => {
  // Configs used across multiple describe blocks
  class PlainConfig {
    url?: string = 'postgres://localhost'
  }

  class LabeledConfig {
    static label = 'db' as const
    poolSize?: number = 10
  }

  class PrefixedConfig {
    static prefix = 'cache_' as const
    ttl?: number = 60
  }

  describe('Configuration Classes', () => {
    it('should record each class with the label and prefix it is read under', () => {
      const factory = smartModule({ smartConfigs: [PlainConfig, LabeledConfig, PrefixedConfig] })

      typeAssert<
        TypeTest<
          typeof factory.schema,
          SmartSchema<
            [
              SmartSchemaConfig<typeof PlainConfig>,
              SmartSchemaConfig<typeof LabeledConfig>,
              SmartSchemaConfig<typeof PrefixedConfig>,
            ],
            []
          >
        >
      >()

      matchExpectedSchema(factory, {
        configs: [
          { config: PlainConfig, label: undefined, prefix: undefined },
          { config: LabeledConfig, label: 'db', prefix: undefined },
          { config: PrefixedConfig, label: undefined, prefix: 'cache_' },
        ],
        imports: [],
      })
    })

    it('should resolve an inline override against the class statics', () => {
      const factory = smartModule({
        smartConfigs: [
          { smartConfig: LabeledConfig, label: 'replica' as const },
          { smartConfig: PrefixedConfig, prefix: 'session_' as const },
          { smartConfig: LabeledConfig },
        ],
      })

      typeAssert<
        TypeTest<
          typeof factory.schema,
          SmartSchema<
            [
              SmartSchemaConfig<typeof LabeledConfig>,
              SmartSchemaConfig<typeof PrefixedConfig>,
              SmartSchemaConfig<typeof LabeledConfig>,
            ],
            []
          >
        >
      >()

      matchExpectedSchema(factory, {
        configs: [
          { config: LabeledConfig, label: 'replica', prefix: undefined },
          { config: PrefixedConfig, label: undefined, prefix: 'session_' },
          { config: LabeledConfig, label: 'db', prefix: undefined },
        ],
        imports: [],
      })
    })

    it('should put inline configuration classes first, in the order they are instantiated', () => {
      const factory = smartModule(LabeledConfig, { smartConfigs: [PlainConfig] })

      typeAssert<
        TypeTest<
          typeof factory.schema,
          SmartSchema<[SmartSchemaConfig<typeof LabeledConfig>, SmartSchemaConfig<typeof PlainConfig>], []>
        >
      >()

      matchExpectedSchema(factory, {
        configs: [
          { config: LabeledConfig, label: 'db', prefix: undefined },
          { config: PlainConfig, label: undefined, prefix: undefined },
        ],
        imports: [],
      })
    })
  })

  describe('Composed Imports', () => {
    it('should nest the schema of every smart import under the namespace it was imported with', () => {
      const database = smartModule({ smartConfigs: [LabeledConfig] })
      const cache = smartModule({ smartConfigs: [PrefixedConfig] })

      const factory = smartModule({
        smartConfigs: [PlainConfig],
        smartImports: [database, { smartImport: cache, label: 'primary' as const, prefix: 'p_' as const }],
      })

      typeAssert<
        TypeTest<
          typeof factory.schema,
          SmartSchema<
            [SmartSchemaConfig<typeof PlainConfig>],
            [
              SmartSchemaImport<SmartSchema<[SmartSchemaConfig<typeof LabeledConfig>], []>>,
              SmartSchemaImport<SmartSchema<[SmartSchemaConfig<typeof PrefixedConfig>], []>>,
            ]
          >
        >
      >()

      matchExpectedSchema(factory, {
        configs: [{ config: PlainConfig, label: undefined, prefix: undefined }],
        imports: [
          { schema: { configs: [{ config: LabeledConfig, label: 'db', prefix: undefined }], imports: [] } },
          {
            label: 'primary',
            prefix: 'p_',
            schema: { configs: [{ config: PrefixedConfig, label: undefined, prefix: 'cache_' }], imports: [] },
          },
        ],
      })
    })

    it('should record no schema for a plain factory smartModule did not build', () => {
      const plain = (): DynamicModule => ({ module: class PlainModule {} })

      const factory = smartModule({ smartImports: [plain, { smartImport: plain, label: 'other' as const }] })

      typeAssert<
        TypeTest<typeof factory.schema, SmartSchema<[], [SmartSchemaImport<undefined>, SmartSchemaImport<undefined>]>>
      >()

      matchExpectedSchema(factory, {
        configs: [],
        imports: [{ schema: undefined }, { label: 'other', prefix: undefined, schema: undefined }],
      })
    })
  })

  describe('Definition Factory', () => {
    it('should hold only the inline configuration classes, without running the function', () => {
      // Reading the schema must not call the definition: this one refuses.
      const factory = smartModule(LabeledConfig, (): { smartConfigs: [typeof PlainConfig] } => {
        throw new Error('the definition factory ran')
      })

      typeAssert<TypeTest<typeof factory.schema, SmartSchema<[SmartSchemaConfig<typeof LabeledConfig>], []>>>()

      matchExpectedSchema(factory, {
        configs: [{ config: LabeledConfig, label: 'db', prefix: undefined }],
        imports: [],
      })
    })
  })

  describe('Factory Behaviour', () => {
    it('should leave the module the factory builds as it was', () => {
      const factory = smartModule({ smartConfigs: [LabeledConfig] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ db?: { poolSize?: number } }>>>()

      const module = factory({ db: { poolSize: 5 } })

      matchExpectedModuleStructure(module, { imports: 1 })
      matchExpectedConfigModule(module.imports![0], {
        name: 'LabeledConfigSmartConfigModule',
        value: { poolSize: 5 },
      })
    })

    it('should give a module without configs or imports an empty schema', () => {
      const factory = smartModule({ providers: [] })

      typeAssert<TypeTest<typeof factory.schema, SmartSchema<[], []>>>()

      matchExpectedSchema(factory, { configs: [], imports: [] })
    })
  })
})
