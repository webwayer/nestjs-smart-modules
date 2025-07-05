import { DynamicModule, Injectable } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { smartModule } from '../../src/smartModule'
import { Test } from '@nestjs/testing'
import { matchExpectedConfigModule, matchExpectedModuleStructure } from '../utils/spec-helpers'

// Step 1: Define the Global Configuration and Module
// Define the shape of your global configuration.
export class GlobalConfig {
  appName: string
  isProduction: boolean
}

// Create a self-contained module for the config.
@Injectable()
export class GlobalConfigModule {
  // Use smartModule to create a configurable, global module.
  static forRoot = smartModule(GlobalConfig, imports => ({
    global: true, // This makes the providers available everywhere.
    exports: imports,
    // exports: [GlobalConfig], // will not work because smart config not injected into a smart module but into a new module that goes into imports array, we cant export others module exports only re export whole imported module
  }))
}

// Step 3: Inject the Global Config in a Feature Service
@Injectable()
export class FeatureService {
  constructor(private readonly config: GlobalConfig) {}

  doSomething() {
    if (!this.config.isProduction) {
      return 'not production'
    }
    return 'production'
  }
}

// app.module.ts (synchronous)
export class AppModule {
  static smartModule = smartModule({
    imports: [
      GlobalConfigModule.forRoot({
        appName: 'My Awesome App',
        isProduction: true,
      }),
    ],
    providers: [FeatureService],
  })
}

// app.module.ts (asynchronous)
export class AsyncAppModule {
  static smartModule = smartModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }), // Make the standard ConfigService available
      GlobalConfigModule.forRoot({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          appName: configService.get('APP_NAME') || 'My Async App',
          isProduction: configService.get('NODE_ENV') === 'production',
        }),
      }),
    ],
    providers: [FeatureService],
  })
}

describe('Recipes: Creating a Global Configuration Module (the `forRoot` pattern)', () => {
  it('should create a global configuration module with synchronous configuration', async () => {
    const module = AppModule.smartModule()

    // Test the complete AppModule structure
    matchExpectedModuleStructure(module, {
      moduleName: 'AppModuleSmartModule',
      imports: 1,
      providers: [FeatureService],
    })

    // Test the GlobalConfigModule structure (first import of AppModule)
    const globalConfigModule = module.imports[0] as DynamicModule
    matchExpectedModuleStructure(globalConfigModule, {
      moduleName: 'GlobalConfigModuleSmartModule',
      imports: 1,
      exports: 1,
      global: true,
    })

    // Test the GlobalConfig smart config module (first import of GlobalConfigModule)
    matchExpectedConfigModule(globalConfigModule.imports[0], {
      name: 'GlobalConfigSmartConfigModule',
      value: {
        appName: 'My Awesome App',
        isProduction: true,
      },
      token: GlobalConfig,
    })

    // Verify that the exported module is the same as the imported config module
    expect(globalConfigModule.exports[0]).toBe(globalConfigModule.imports[0])

    // Test with actual NestJS application
    const moduleRef = await Test.createTestingModule({
      imports: [module],
    }).compile()

    const service = moduleRef.get(FeatureService)
    expect(service.doSomething()).toEqual('production')

    await moduleRef.close()
  })

  it('should create a global configuration module with asynchronous configuration', async () => {
    const module = AsyncAppModule.smartModule()

    // Test the complete AsyncAppModule structure
    matchExpectedModuleStructure(module, {
      moduleName: 'AsyncAppModuleSmartModule',
      imports: 2, // ConfigModule + GlobalConfigModule
      providers: [FeatureService],
    })

    // Test the ConfigModule (first import - should be the standard NestJS ConfigModule)
    expect(module.imports[0]).toBeDefined()

    // Find the GlobalConfigModule in the imports (second import)
    const globalConfigModule = module.imports[1] as DynamicModule
    matchExpectedModuleStructure(globalConfigModule, {
      moduleName: 'GlobalConfigModuleSmartModule',
      imports: 1,
      exports: 1,
      global: true,
    })

    // Test the GlobalConfig smart config module with async configuration
    // Note: For async configs, we don't test the exact values since they depend on runtime execution
    matchExpectedModuleStructure(globalConfigModule.imports[0] as DynamicModule, {
      moduleName: 'GlobalConfigSmartConfigModule',
      exports: [GlobalConfig],
      providers: [
        expect.objectContaining({
          provide: GlobalConfig,
          useFactory: expect.any(Function),
          inject: [ConfigService],
          imports: [ConfigModule],
        }),
      ],
    })

    // Verify that the exported module is the same as the imported config module
    expect(globalConfigModule.exports[0]).toBe(globalConfigModule.imports[0])

    // Test with actual NestJS application
    const moduleRef = await Test.createTestingModule({
      imports: [module],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'APP_NAME') return 'My Async App'
          if (key === 'NODE_ENV') return 'production'
          return undefined
        }),
      })
      .compile()

    const service = moduleRef.get(FeatureService)
    expect(service.doSomething()).toEqual('production')

    await moduleRef.close()
  })
})
