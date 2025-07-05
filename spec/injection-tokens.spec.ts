import { smartModule } from '../src/smartModule'
import {
  matchExpectedModuleStructure,
  matchExpectedConfigModule,
  typeAssert,
  TypeTest,
  ExpectedFactoryType,
} from './utils/spec-helpers'

describe('Injection Tokens', () => {
  describe('Custom Token Configuration', () => {
    class Config {
      requiredProp: string
      defaultProp? = 'default'
    }

    it('should use custom token for config class', () => {
      const CUSTOM_TOKEN = 'CUSTOM_CONFIG_TOKEN'

      const factory = smartModule({
        smartConfigs: [{ smartConfig: Config, token: CUSTOM_TOKEN }],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>>()

      const module = factory({
        requiredProp: 'test',
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'test',
          defaultProp: 'default',
        },
        token: CUSTOM_TOKEN,
      })
    })

    it('should use custom token with providers and exports', () => {
      class ServiceWithTokenAndProviders {}

      const factory = smartModule({
        smartConfigs: [{ smartConfig: Config, token: 'SERVICE_CONFIG' }],
        providers: [ServiceWithTokenAndProviders],
        exports: [ServiceWithTokenAndProviders],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>>()

      const module = factory({
        requiredProp: 'test',
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [ServiceWithTokenAndProviders],
        exports: [ServiceWithTokenAndProviders],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'test',
          defaultProp: 'default',
        },
        token: 'SERVICE_CONFIG',
      })
    })
  })

  describe('Static Token Configuration', () => {
    class ConfigWithStaticToken {
      static token = 'STATIC_TOKEN' as const
      requiredProp: string
      defaultProp? = 'default'
    }

    it('should use static token from config class', () => {
      const factory = smartModule({
        smartConfigs: [ConfigWithStaticToken],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>>()

      const module = factory({
        requiredProp: 'test',
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigWithStaticTokenSmartConfigModule',
        value: {
          requiredProp: 'test',
          defaultProp: 'default',
        },
        token: 'STATIC_TOKEN',
      })
    })

    it('should use static token with providers and exports', () => {
      class ServiceWithStaticTokenAndProviders {}

      const factory = smartModule({
        smartConfigs: [ConfigWithStaticToken],
        providers: [ServiceWithStaticTokenAndProviders],
        exports: [ServiceWithStaticTokenAndProviders],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>>()

      const module = factory({
        requiredProp: 'test',
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [ServiceWithStaticTokenAndProviders],
        exports: [ServiceWithStaticTokenAndProviders],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigWithStaticTokenSmartConfigModule',
        value: {
          requiredProp: 'test',
          defaultProp: 'default',
        },
        token: 'STATIC_TOKEN',
      })
    })

    it('should handle basic token properties only', () => {
      class TokenConfig {
        static token = 'STATIC_TOKEN'
        value: string
      }

      const factory = smartModule({
        smartConfigs: [TokenConfig],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ value: string }>>>()

      const module = factory({ value: 'test' })

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'TokenConfigSmartConfigModule',
        value: { value: 'test' },
        token: 'STATIC_TOKEN',
      })
    })
  })

  describe('Token Override Behavior', () => {
    class ConfigWithStaticToken {
      static token = 'STATIC_TOKEN' as const
      requiredProp: string
      defaultProp? = 'default'
    }

    it('should override static token with inline token', () => {
      const factory = smartModule({
        smartConfigs: [
          {
            smartConfig: ConfigWithStaticToken,
            token: 'OVERRIDE_TOKEN',
          },
        ],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>>()

      const module = factory({
        requiredProp: 'test',
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigWithStaticTokenSmartConfigModule',
        value: {
          requiredProp: 'test',
          defaultProp: 'default',
        },
        token: 'OVERRIDE_TOKEN',
      })
    })

    it('should override static token with inline token and providers', () => {
      class ServiceWithOverrideAndProviders {}

      const factory = smartModule({
        smartConfigs: [
          {
            smartConfig: ConfigWithStaticToken,
            token: 'INLINE_OVERRIDE',
          },
        ],
        providers: [ServiceWithOverrideAndProviders],
        exports: [ServiceWithOverrideAndProviders],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ requiredProp: string; defaultProp?: string }>>>()

      const module = factory({
        requiredProp: 'test',
      })

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [ServiceWithOverrideAndProviders],
        exports: [ServiceWithOverrideAndProviders],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigWithStaticTokenSmartConfigModule',
        value: {
          requiredProp: 'test',
          defaultProp: 'default',
        },
        token: 'INLINE_OVERRIDE',
      })
    })
  })

  describe('Multiple Configurations with Tokens', () => {
    class FirstConfig {
      static token = 'FIRST_TOKEN'
      firstProp: string
    }

    class SecondConfig {
      static token = 'SECOND_TOKEN'
      secondProp: string
    }

    class NoTokenConfig {
      noTokenProp: string
    }

    it('should handle multiple configs with different tokens', () => {
      const factory = smartModule({
        smartConfigs: [FirstConfig, SecondConfig],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ firstProp: string; secondProp: string }>>>()

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
        },
        token: 'FIRST_TOKEN',
      })

      matchExpectedConfigModule(module.imports[1], {
        name: 'SecondConfigSmartConfigModule',
        value: {
          firstProp: 'first',
          secondProp: 'second',
        },
        token: 'SECOND_TOKEN',
      })
    })

    it('should handle mixed token types', () => {
      class ConfigWithStaticToken {
        static token = 'STATIC_TOKEN' as const
        requiredProp: string
        defaultProp? = 'default'
      }

      class Config {
        requiredProp: string
        defaultProp? = 'default'
      }

      const factory = smartModule({
        smartConfigs: [ConfigWithStaticToken, { smartConfig: NoTokenConfig, token: 'INLINE_TOKEN' }, Config],
      })

      typeAssert<
        TypeTest<
          typeof factory,
          ExpectedFactoryType<{ requiredProp: string; noTokenProp: string; defaultProp?: string }>
        >
      >()

      const module = factory({
        requiredProp: 'test',
        noTokenProp: 'no-token',
      })

      matchExpectedModuleStructure(module, {
        imports: 3,
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'ConfigWithStaticTokenSmartConfigModule',
        value: {
          requiredProp: 'test',
          noTokenProp: 'no-token',
          defaultProp: 'default',
        },
        token: 'STATIC_TOKEN',
      })

      matchExpectedConfigModule(module.imports[1], {
        name: 'NoTokenConfigSmartConfigModule',
        value: {
          requiredProp: 'test',
          noTokenProp: 'no-token',
        },
        token: 'INLINE_TOKEN',
      })

      matchExpectedConfigModule(module.imports[2], {
        name: 'ConfigSmartConfigModule',
        value: {
          requiredProp: 'test',
          noTokenProp: 'no-token',
          defaultProp: 'default',
        },
        token: Config,
      })
    })
  })

  describe('Advanced Token Features', () => {
    it('should handle extended smart config with token and async', async () => {
      class TokenConfig {
        prop: string
      }

      const factory = smartModule({
        smartConfigs: [
          {
            smartConfig: TokenConfig,
            token: 'CUSTOM_TOKEN',
            prefix: 'custom_' as const,
          },
        ],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ custom_prop: string }>>>()

      const asyncModule = factory({
        useFactory: () => ({ custom_prop: 'value' }),
      })

      matchExpectedModuleStructure(asyncModule, {
        imports: 1,
      })

      await matchExpectedConfigModule(asyncModule.imports[0], {
        name: 'TokenConfigSmartConfigModule',
        token: 'CUSTOM_TOKEN',
        isAsync: true,
        value: { prop: 'value' },
      })
    })
  })

  describe('NestJS Integration', () => {
    it('should handle providers with string injection tokens', () => {
      const STRING_TOKEN = 'STRING_TOKEN'
      const CONFIG_TOKEN = 'CONFIG_TOKEN'

      class TokenConfig {
        value: string
      }

      const factory = smartModule({
        smartConfigs: [{ smartConfig: TokenConfig, token: CONFIG_TOKEN }],
        providers: [
          {
            provide: STRING_TOKEN,
            useValue: 'test',
          },
        ],
        exports: [STRING_TOKEN],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ value: string }>>>()

      const module = factory({ value: 'test' })

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [{ provide: STRING_TOKEN, useValue: 'test' }],
        exports: [STRING_TOKEN],
      })

      matchExpectedConfigModule(module.imports[0], {
        name: 'TokenConfigSmartConfigModule',
        value: { value: 'test' },
        token: CONFIG_TOKEN,
      })
    })
  })
})
