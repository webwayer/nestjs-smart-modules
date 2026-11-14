import { Injectable } from '@nestjs/common'
import type { DynamicModule } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { smartModule } from '../src/smartModule'
import { typeAssert, TypeTest, ExpectedFactoryType, matchExpectedModuleStructure } from './utils/spec-helpers'

// A module that declares `shared: true` is built once per configuration
// object: every branch that imports it under the same configuration gets the
// SAME DynamicModule, which NestJS registers once — one provider instance. The
// configuration object's identity is the key, so these specs hold a
// configuration in a variable where the helper rules elsewhere inline it.

class DatabaseConfig {
  url: string
}

@Injectable()
class DatabaseService {
  static smartModule = smartModule({
    shared: true,
    smartConfigs: [DatabaseConfig],
    providers: [DatabaseService],
    exports: [DatabaseService],
  })

  constructor(readonly config: DatabaseConfig) {}
}

function importsOf(module: DynamicModule) {
  return (module.imports ?? []) as DynamicModule[]
}

describe('Shared Modules', () => {
  // ============================================================================
  // ONE MODULE PER CONFIGURATION OBJECT
  // ============================================================================

  describe('module identity', () => {
    it('should return the same module for the same configuration object', () => {
      typeAssert<TypeTest<typeof DatabaseService.smartModule, ExpectedFactoryType<{ url: string }>>>()

      const config = { url: 'postgres://shared' }
      const module = DatabaseService.smartModule(config)

      matchExpectedModuleStructure(module, {
        imports: 1,
        providers: [DatabaseService],
        exports: [DatabaseService],
      })

      expect(DatabaseService.smartModule(config)).toBe(module)
    })

    it('should build a module of its own for another configuration object, however equal', () => {
      const module = DatabaseService.smartModule({ url: 'postgres://shared' })

      expect(DatabaseService.smartModule({ url: 'postgres://shared' })).not.toBe(module)
    })

    it('should build a module per call when the definition does not declare shared', () => {
      const factory = smartModule({
        smartConfigs: [DatabaseConfig],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string }>>>()

      const config = { url: 'postgres://separate' }

      expect(factory(config)).not.toBe(factory(config))
    })

    it('should build a module per call when the definition declares shared false', () => {
      const factory = smartModule({
        shared: false,
        smartConfigs: [DatabaseConfig],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string }>>>()

      const config = { url: 'postgres://separate' }

      expect(factory(config)).not.toBe(factory(config))
    })

    it('should share a module whose definition is a factory function', () => {
      const factory = smartModule(DatabaseConfig, imports => ({
        shared: true,
        exports: imports,
      }))

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string }>>>()

      const config = { url: 'postgres://shared' }
      const module = factory(config)

      matchExpectedModuleStructure(module, { imports: 1, exports: 1 })

      expect(factory(config)).toBe(module)
    })

    it('should share a module configured asynchronously by the same parameters', () => {
      const asyncConfig = { useFactory: () => ({ url: 'postgres://async' }) }

      expect(DatabaseService.smartModule(asyncConfig)).toBe(DatabaseService.smartModule(asyncConfig))
    })
  })

  // ============================================================================
  // SHARING ACROSS THE BRANCHES OF ONE TREE
  // ============================================================================

  describe('composition', () => {
    it('should hand both importing branches the same module', () => {
      const users = smartModule({ smartImports: [DatabaseService.smartModule] })
      const books = smartModule({ smartImports: [DatabaseService.smartModule] })
      const factory = smartModule({ smartImports: [users, books] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string }>>>()

      const [usersModule, booksModule] = importsOf(factory({ url: 'postgres://shared' }))

      // a factory called as an import has no class to take a name from
      matchExpectedModuleStructure(usersModule, { moduleName: 'SmartModule', imports: 1 })
      matchExpectedModuleStructure(booksModule, { moduleName: 'SmartModule', imports: 1 })

      expect(importsOf(usersModule)[0]).toBe(importsOf(booksModule)[0])
    })

    it('should share inside a tree that takes no configuration, and not between two trees', () => {
      const cache = smartModule({ shared: true })
      const left = smartModule({ smartImports: [cache] })
      const right = smartModule({ smartImports: [cache] })
      const factory = smartModule({ smartImports: [left, right] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType>>()

      const [leftModule, rightModule] = importsOf(factory())
      const [otherLeftModule] = importsOf(factory())

      expect(importsOf(leftModule)[0]).toBe(importsOf(rightModule)[0])
      expect(importsOf(otherLeftModule)[0]).not.toBe(importsOf(leftModule)[0])
    })

    it('should share under one label and keep another label apart', () => {
      const primaryUsers = smartModule({
        smartImports: [{ smartImport: DatabaseService.smartModule, label: 'primary' as const }],
      })
      const primaryBooks = smartModule({
        smartImports: [{ smartImport: DatabaseService.smartModule, label: 'primary' as const }],
      })
      const replicaReports = smartModule({
        smartImports: [{ smartImport: DatabaseService.smartModule, label: 'replica' as const }],
      })
      const factory = smartModule({ smartImports: [primaryUsers, primaryBooks, replicaReports] })

      typeAssert<
        TypeTest<typeof factory, ExpectedFactoryType<{ primary: { url: string }; replica: { url: string } }>>
      >()

      const [usersModule, booksModule, reportsModule] = importsOf(
        factory({ primary: { url: 'postgres://primary' }, replica: { url: 'postgres://replica' } }),
      )

      expect(importsOf(usersModule)[0]).toBe(importsOf(booksModule)[0])
      expect(importsOf(reportsModule)[0]).not.toBe(importsOf(usersModule)[0])
    })

    it('should share under one prefix', () => {
      const users = smartModule({
        smartImports: [{ smartImport: DatabaseService.smartModule, prefix: 'db_' as const }],
      })
      const books = smartModule({
        smartImports: [{ smartImport: DatabaseService.smartModule, prefix: 'db_' as const }],
      })
      const factory = smartModule({ smartImports: [users, books] })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ db_url: string }>>>()

      const [usersModule, booksModule] = importsOf(factory({ db_url: 'postgres://prefixed' }))

      expect(importsOf(usersModule)[0]).toBe(importsOf(booksModule)[0])
    })

    it('should share under one label when the configuration is asynchronous', () => {
      const users = smartModule({
        smartImports: [{ smartImport: DatabaseService.smartModule, label: 'primary' as const }],
      })
      const books = smartModule({
        smartImports: [{ smartImport: DatabaseService.smartModule, label: 'primary' as const }],
      })
      const factory = smartModule({ smartImports: [users, books] })

      const [usersModule, booksModule] = importsOf(
        factory({ useFactory: () => ({ primary: { url: 'postgres://async' } }) }),
      )

      expect(importsOf(usersModule)[0]).toBe(importsOf(booksModule)[0])
    })
  })

  // ============================================================================
  // WHAT NESTJS IS HANDED
  // ============================================================================

  describe('the module handed to NestJS', () => {
    it('should carry none of the keys only smartModule reads', () => {
      const factory = smartModule({
        shared: true,
        smartConfigs: [DatabaseConfig],
        smartImports: [DatabaseService.smartModule],
      })

      typeAssert<TypeTest<typeof factory, ExpectedFactoryType<{ url: string }>>>()

      const module = factory({ url: 'postgres://shared' })

      matchExpectedModuleStructure(module, { imports: 2 })

      expect(Object.keys(module).sort()).toEqual(['imports', 'module'])
    })

    it('should build one provider instance for every branch that imports a shared module', async () => {
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

      const moduleRef = await Test.createTestingModule({
        imports: [BooksService.smartModule({ url: 'postgres://my-app-db' })],
      }).compile()

      const books = moduleRef.get(BooksService)

      expect(books.dbService).toBe(books.usersService.dbService)
      expect(books.dbService.config).toEqual({ url: 'postgres://my-app-db' })

      await moduleRef.close()
    })
  })
})
