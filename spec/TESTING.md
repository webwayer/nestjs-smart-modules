# Testing Guide

## Quick Reference

Every test follows this standard pattern:

```typescript
it('should describe behavior', () => {
  // 1. Create factory
  const factory = smartModule({
    smartConfigs: [ConfigClass],
    providers: [SomeService],
    exports: [SomeService],
  })

  // 2. Type assertion (REQUIRED)
  typeAssert<TypeTest<typeof factory, ExpectedFactoryType<ConfigShape>>>()

  // 3. Create and validate module
  const module = factory({ prop: 'value' })

  matchExpectedModuleStructure(module, {
    imports: 1, // Must specify if module has imports
    providers: [SomeService], // Must specify if module has providers
    exports: [SomeService], // Must specify if module has exports
  })

  // 4. Validate config modules
  matchExpectedConfigModule(module.imports[0], {
    name: 'ConfigClassSmartConfigModule',
    value: { prop: 'value' },
  })
})
```

## Core Rules

### 1. Always Use Helper Functions

- `matchExpectedModuleStructure()` for module validation
- `matchExpectedConfigModule()` for config validation
- `typeAssert()` for compile-time type checking

**Exception:** Only `utility-functions.spec.ts` uses direct `expect()` calls.

### 2. Always Validate Complete Module Tree

Validate every created module at all levels:

```typescript
// Main module
matchExpectedModuleStructure(module, { imports: 2, providers: [Service] })

// Imported modules
const importedModule = module.imports[1] as DynamicModule
matchExpectedModuleStructure(importedModule, { imports: 1 })
matchExpectedConfigModule(importedModule.imports[0], {
  /* ... */
})
```

### 3. Use Inline Test Data

```typescript
// ✅ DO: Inline data
const module = factory({ prop: 'test-value' })
matchExpectedConfigModule(module.imports[0], {
  value: { prop: 'test-value', defaultProp: 'default' },
})

// ❌ DON'T: Variables
const testProps = { prop: 'test-value' }
const expectedResult = { prop: 'test-value', defaultProp: 'default' }
```

## Helper Functions

### `matchExpectedModuleStructure(module, expected)`

Validates module structure with smart defaults:

```typescript
matchExpectedModuleStructure(module, {
  moduleName?: string,     // Optional, only for testing naming patterns
  imports?: number | array,  // Defaults to 0 - must specify if module has imports
  exports?: number | array,  // Defaults to 0 - must specify if module has exports
  providers?: array,       // If omitted, accepts undefined or []
  controllers?: array,     // If omitted, accepts undefined or []
  global?: boolean,        // Optional
})
```

**Key behavior:**

- **imports/exports**: Default to 0 (enforces explicitness)
- **providers/controllers**: Flexible - omit for undefined/empty arrays

### `matchExpectedConfigModule(configModule, expected)`

Validates config modules from imports or exports:

```typescript
matchExpectedConfigModule(module.imports[0], {
  name: 'ConfigClassSmartConfigModule',
  value: { prop: 'value' },
  token?: CustomToken,     // Optional custom injection token
  isAsync?: boolean,       // Optional, omit for sync (default)
})

// For async configs
await matchExpectedConfigModule(module.imports[0], {
  value: { prop: 'async-value' },
  isAsync: true,
})
```

## Patterns

### Factory Pattern (Recommended)

Use for most tests:

```typescript
const factory = smartModule({
  smartConfigs: [ConfigClass],
  providers: [SomeService],
})

const module = factory({ prop: 'value' })
```

### Service Pattern

Use only for testing module naming:

```typescript
@Injectable()
class DatabaseService {
  static smartModule = smartModule({
    smartConfigs: [DatabaseConfig],
    providers: [DatabaseService],
  })
}

// Test specific naming pattern
matchExpectedModuleStructure(module, {
  moduleName: 'DatabaseServiceSmartModule',
})
```

### Dynamic Module Pattern

For advanced module composition:

```typescript
const factory = smartModule(ConfigClass, (imports, config) => ({
  imports,
  providers: [{ provide: 'TOKEN', useValue: config.value }],
}))
```

## File Organization

```
spec/
├── *.spec.ts              # Feature tests by functionality
├── receipts/              # README examples (excluded from coverage)
└── utils/spec-helpers.ts  # Test helper functions
```

### File Structure

```typescript
describe('Feature Name', () => {
  describe('Sub-feature', () => {
    // Config classes should be placed in the closest describe block
    // that encompasses all tests using them
    class Config {
      requiredProp: string
      optionalProp?: string = 'default'
    }

    it('should describe specific behavior', () => {
      // Test implementation
    })
  })
})
```

## Receipts Tests

Located in `spec/receipts/`, these test README examples:

**Rules:**

- Must use helper functions for module validation
- Must line-by-line match README examples
- Use Service classes when README uses Service classes
- NestJS integration testing may use direct `expect()` calls
- Type assertions optional for integration tests
- Excluded from coverage

## Naming Conventions

- **Classes:** `DatabaseService`, `BasicConfig`, `AsyncConfig`
- **Variables:** `factory`, `module`, `importedModule`, `configModule`
- **Tests:** Use descriptive behavior-focused names

## Checklist

- [ ] Used factory pattern (create module without creating a class that holds factory)
- [ ] Added type assertion after factory creation
- [ ] Used helper functions (no direct `expect()`)
- [ ] Validated complete module tree
- [ ] Used inline test data
- [ ] Used `await` for async configs
- [ ] Organized file with comment separators
- [ ] Used descriptive test names

## Running Tests

```bash
npm test                    # Run all tests
npm test -- spec/receipts   # Run only receipts
npm run coverage           # Run coverage (excludes receipts)
```
