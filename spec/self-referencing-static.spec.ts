import { Injectable } from '@nestjs/common'

import { smartModule } from '../src/smartModule'
import type { TypeTest, ExpectedFactoryType } from './utils/spec-helpers'
import { matchExpectedModuleStructure, typeAssert } from './utils/spec-helpers'

// A class whose static `smartModule` lists the class itself AND something
// else — a `useExisting` alias of itself, a sibling class, a value provider.
// This is the shape every hub, resolver and service of a real application
// takes, and it is the one this library's own suite never held: with
// `providers` typed as a plain array, TypeScript built the union of the
// literal's element types and, subtype-reducing it, read `typeof Hub` while
// `smartModule` was still being inferred — TS7022, the static became `any`,
// and every `Hub.smartModule(config)` downstream answered TS2554. The tuple
// unions on SmartModule's array properties are what keep this file
// compiling; the runtime assertions below are what keep it a test.
describe('A class listed in its own static smartModule', () => {
  const ALIAS = 'HUB_ALIAS'
  const VALUE = 'HUB_VALUE'

  @Injectable()
  class Hub {
    static smartModule = smartModule({
      providers: [Hub, { provide: ALIAS, useExisting: Hub }],
      exports: [Hub, ALIAS],
    })
  }

  @Injectable()
  class Sibling {}

  @Injectable()
  class Service {
    static smartModule = smartModule({
      providers: [Service, Sibling],
      exports: [Service, Sibling],
    })
  }

  @Injectable()
  class Store {
    static smartModule = smartModule({
      providers: [Store, { provide: VALUE, useValue: 1 }],
    })
  }

  class HubConfig {
    level: string
  }

  @Injectable()
  class ConfiguredHub {
    static smartModule = smartModule({
      smartConfigs: [HubConfig],
      providers: [ConfiguredHub, { provide: ALIAS, useExisting: ConfiguredHub }],
      exports: [ConfiguredHub, ALIAS],
    })
  }

  it('should type the static as a configuration-free factory beside a useExisting alias of itself', () => {
    typeAssert<TypeTest<typeof Hub.smartModule, ExpectedFactoryType>>()

    matchExpectedModuleStructure(Hub.smartModule(), {
      providers: [Hub, { provide: ALIAS, useExisting: Hub }],
      exports: [Hub, ALIAS],
    })
  })

  it('should type the static as a configuration-free factory beside a sibling class', () => {
    typeAssert<TypeTest<typeof Service.smartModule, ExpectedFactoryType>>()

    matchExpectedModuleStructure(Service.smartModule(), {
      providers: [Service, Sibling],
      exports: [Service, Sibling],
    })
  })

  it('should type the static as a configuration-free factory beside a value provider', () => {
    typeAssert<TypeTest<typeof Store.smartModule, ExpectedFactoryType>>()

    matchExpectedModuleStructure(Store.smartModule(), {
      providers: [Store, { provide: VALUE, useValue: 1 }],
    })
  })

  it('should still require the config a smartConfigs class declares', () => {
    typeAssert<TypeTest<typeof ConfiguredHub.smartModule, ExpectedFactoryType<{ level: string }>>>()

    matchExpectedModuleStructure(ConfiguredHub.smartModule({ level: 'info' }), {
      imports: 1,
      providers: [ConfiguredHub, { provide: ALIAS, useExisting: ConfiguredHub }],
      exports: [ConfiguredHub, ALIAS],
    })
  })
})
