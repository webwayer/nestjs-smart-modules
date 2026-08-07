import { Injectable } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { smartModule } from '../src/smartModule'
import { typeAssert, TypeTest, ExpectedFactoryType, matchExpectedModuleStructure } from './utils/spec-helpers'

// Characterization of module identity semantics (README composition diamond):
// every smartModule factory call produces its own DynamicModule, so each
// importing branch gets its OWN service instance while the merged
// configuration is delivered identically to all of them. This holds on
// NestJS 10 and 11 under both module id algorithms (deep-hash / reference) —
// the generated module class is a fresh named class per call, so modules are
// never deduplicated by the framework.

class DatabaseConfig {
  url: string
}

@Injectable()
class DatabaseService {
  static smartModule = smartModule({
    smartConfigs: [DatabaseConfig],
    providers: [DatabaseService],
    exports: [DatabaseService],
  })

  constructor(readonly config: DatabaseConfig) {}
}

@Injectable()
class UsersService {
  static smartModule = smartModule({
    smartImports: [DatabaseService.smartModule],
    providers: [UsersService],
    exports: [UsersService],
  })

  constructor(readonly dbService: DatabaseService) {}
}

@Injectable()
class BooksService {
  static smartModule = smartModule({
    smartImports: [UsersService.smartModule, DatabaseService.smartModule],
    providers: [BooksService],
    exports: [BooksService],
  })

  constructor(
    readonly usersService: UsersService,
    readonly dbService: DatabaseService,
  ) {}
}

describe('Module Identity (characterization)', () => {
  it('should give each importing branch its own service instance while sharing configuration', async () => {
    typeAssert<TypeTest<typeof BooksService.smartModule, ExpectedFactoryType<{ url: string }>>>()

    const module = BooksService.smartModule({ url: 'postgres://my-app-db' })

    matchExpectedModuleStructure(module, {
      moduleName: 'BooksServiceSmartModule',
      imports: 2,
      providers: [BooksService],
      exports: [BooksService],
    })

    const moduleRef = await Test.createTestingModule({
      imports: [module],
    }).compile()

    const books = moduleRef.get(BooksService)

    // Two factory calls -> two DynamicModules -> two DatabaseService instances.
    expect(books.dbService).not.toBe(books.usersService.dbService)

    // The merged configuration is delivered identically to both instances.
    expect(books.dbService.config).toEqual({ url: 'postgres://my-app-db' })
    expect(books.usersService.dbService.config).toEqual({ url: 'postgres://my-app-db' })

    await moduleRef.close()
  })
})
