import { DynamicModule, Inject, Injectable } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { smartModule } from '../../src/smartModule'
import {
  matchExpectedModuleStructure,
  matchExpectedConfigModule,
  typeAssert,
  TypeTest,
  ExpectedFactoryType,
} from '../utils/spec-helpers'

// Step 1: Enhance the Base Service
export class DatabaseConfig {
  url: string
}

@Injectable()
export class DatabaseService {
  // The base smartModule for a single, default instance.
  static smartModule = smartModule({
    smartConfigs: [DatabaseConfig],
    providers: [DatabaseService],
    exports: [DatabaseService],
  })

  static getTokenForLabel(label: string) {
    return `${label.toUpperCase()}_DATABASE_SERVICE`
  }

  static Inject = (label: string) => Inject(DatabaseService.getTokenForLabel(label))

  static smartModuleCustom = function (label: string) {
    const token = this.getTokenForLabel(label)
    return smartModule({
      smartConfigs: [DatabaseConfig],
      providers: [
        DatabaseService, // Provide the base service...
        {
          provide: token,
          useClass: DatabaseService, // ...and create a new instance for the unique token.
        },
      ],
      exports: [token],
    })
  }

  constructor(private readonly config: DatabaseConfig) {}

  find(query: string) {
    return `${this.config.url} for ${query}`
  }
}

// Step 2: Create a Higher-Level Service
@Injectable()
export class DatabasesService {
  // This service becomes a self-contained smart module.
  static smartModule = smartModule({
    // It declares its dependencies on the labeled database modules.
    smartImports: [
      {
        smartImport: DatabaseService.smartModuleCustom('primary'),
        label: 'primary' as const,
      },
      {
        smartImport: DatabaseService.smartModuleCustom('replica'),
        label: 'replica' as const,
      },
    ],
    providers: [DatabasesService],
    exports: [DatabasesService],
  })

  constructor(
    @DatabaseService.Inject('primary')
    private readonly primaryDb: DatabaseService,
    @DatabaseService.Inject('replica')
    private readonly replicaDb: DatabaseService,
  ) {}

  // Example method that uses both database connections.
  find(query: string) {
    return [this.primaryDb.find(query), this.replicaDb.find(query)]
  }
}

describe('Recipes: Creating and Using Multiple Instances of a Module', () => {
  it('should create and configure multiple instances of a database service', async () => {
    typeAssert<
      TypeTest<
        typeof DatabasesService.smartModule,
        ExpectedFactoryType<{
          primary: { url: string }
          replica: { url: string }
        }>
      >
    >()

    const module = DatabasesService.smartModule({
      primary: {
        url: 'postgres://primary-db',
      },
      replica: {
        url: 'postgres://replica-db',
      },
    })

    // Validate the complete DatabasesService module structure
    matchExpectedModuleStructure(module, {
      moduleName: 'DatabasesServiceSmartModule',
      imports: 2,
      providers: [DatabasesService],
      exports: [DatabasesService],
    })

    // Validate the primary database module (first import)
    const primaryModule = module.imports[0] as DynamicModule
    matchExpectedModuleStructure(primaryModule, {
      imports: 1,
      providers: [
        DatabaseService,
        {
          provide: 'PRIMARY_DATABASE_SERVICE',
          useClass: DatabaseService,
        },
      ],
      exports: ['PRIMARY_DATABASE_SERVICE'],
    })

    // Validate the replica database module (second import)
    const replicaModule = module.imports[1] as DynamicModule
    matchExpectedModuleStructure(replicaModule, {
      imports: 1,
      providers: [
        DatabaseService,
        {
          provide: 'REPLICA_DATABASE_SERVICE',
          useClass: DatabaseService,
        },
      ],
      exports: ['REPLICA_DATABASE_SERVICE'],
    })

    // Validate the primary config module (import of primary database module)
    matchExpectedConfigModule(primaryModule.imports[0], {
      name: 'DatabaseConfigSmartConfigModule',
      value: { url: 'postgres://primary-db' },
      token: DatabaseConfig,
    })

    // Validate the replica config module (import of replica database module)
    matchExpectedConfigModule(replicaModule.imports[0], {
      name: 'DatabaseConfigSmartConfigModule',
      value: { url: 'postgres://replica-db' },
      token: DatabaseConfig,
    })

    // Test with actual NestJS application
    const moduleRef = await Test.createTestingModule({
      imports: [module],
    }).compile()

    const service = moduleRef.get(DatabasesService)
    expect(service.find('test')).toEqual(['postgres://primary-db for test', 'postgres://replica-db for test'])

    await moduleRef.close()
  })
})
