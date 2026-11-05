import { Injectable } from '@nestjs/common'
import type {
  BeforeApplicationShutdown,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { readFileSync } from 'node:fs'
import { smartModule } from '../src/smartModule'

// Lifecycle hooks across smart module boundaries, on every supported NestJS
// major. Two things here belong to the framework and vary by major:
//
// - Order INSIDE one module is deliberately not asserted. NestJS 12
//   (nestjs/nest#14900) runs providers level by level along their dependencies,
//   where earlier majors start them all at once.
// - The DIRECTION of teardown across modules: NestJS 11 reversed it, so from
//   there on importers go first; before that, imported modules did.
//
// What the library relies on holds on all of them: an imported smart module is
// fully set up before its importer starts, modules take their turn one at a
// time during teardown too, and the configuration is there by the first hook.

const SETUP_HOOKS = ['onModuleInit', 'onApplicationBootstrap'] as const
const TEARDOWN_HOOKS = ['onModuleDestroy', 'beforeApplicationShutdown', 'onApplicationShutdown'] as const

// Read from disk: this spec runs in both Jest modes, and require() is
// unavailable in the native ESM one.
const nestMajor = Number(
  JSON.parse(readFileSync('node_modules/@nestjs/common/package.json', 'utf8')).version.split('.')[0],
)

let events: string[] = []

abstract class Recorder
  implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy, BeforeApplicationShutdown, OnApplicationShutdown
{
  protected abstract readonly label: string

  // A real turn of the event loop, so a hook that was only started before the
  // next one begins is told apart from one that had settled.
  private async record(hook: string) {
    events.push(`${hook} start ${this.label}`)
    await new Promise(resolve => setImmediate(resolve))
    events.push(`${hook} end ${this.label}`)
  }

  onModuleInit() {
    return this.record('onModuleInit')
  }
  onApplicationBootstrap() {
    return this.record('onApplicationBootstrap')
  }
  onModuleDestroy() {
    return this.record('onModuleDestroy')
  }
  beforeApplicationShutdown() {
    return this.record('beforeApplicationShutdown')
  }
  onApplicationShutdown() {
    return this.record('onApplicationShutdown')
  }
}

class LeafConfig {
  url: string
}

@Injectable()
class LeafService extends Recorder {
  static smartModule = smartModule({
    smartConfigs: [LeafConfig],
    providers: [LeafService],
    exports: [LeafService],
  })

  readonly label = 'leaf'
  urlSeenInHook?: string

  constructor(readonly config: LeafConfig) {
    super()
  }

  override onModuleInit() {
    this.urlSeenInHook = this.config.url
    return super.onModuleInit()
  }
}

@Injectable()
class MidHelper extends Recorder {
  readonly label = 'midHelper'

  constructor(readonly leaf: LeafService) {
    super()
  }
}

@Injectable()
class MidService extends Recorder {
  static smartModule = smartModule({
    smartImports: [LeafService.smartModule],
    providers: [MidHelper, MidService],
    exports: [MidService],
  })

  readonly label = 'mid'

  constructor(readonly helper: MidHelper) {
    super()
  }
}

@Injectable()
class RootService extends Recorder {
  static smartModule = smartModule({
    smartImports: [MidService.smartModule],
    providers: [RootService],
    exports: [RootService],
  })

  readonly label = 'root'

  constructor(readonly mid: MidService) {
    super()
  }
}

// The README composition diamond: `DiamondService` imports LeafService both
// directly and through a branch, so the two instances sit at different depths.
@Injectable()
class BranchService extends Recorder {
  static smartModule = smartModule({
    smartImports: [LeafService.smartModule],
    providers: [BranchService],
    exports: [BranchService],
  })

  readonly label = 'branch'

  constructor(readonly leaf: LeafService) {
    super()
  }
}

@Injectable()
class DiamondService extends Recorder {
  static smartModule = smartModule({
    smartImports: [BranchService.smartModule, LeafService.smartModule],
    providers: [DiamondService],
    exports: [DiamondService],
  })

  readonly label = 'diamond'

  constructor(
    readonly branch: BranchService,
    readonly leaf: LeafService,
  ) {
    super()
  }
}

function indexOf(event: string) {
  const index = events.indexOf(event)
  expect(index).toBeGreaterThanOrEqual(0)
  return index
}

function expectSettledBeforeStart(hook: string, first: string, then: string) {
  expect(indexOf(`${hook} end ${first}`)).toBeLessThan(indexOf(`${hook} start ${then}`))
}

// Each tier settles completely before any label of the next one starts.
function expectTiersInOrder(hook: string, tiers: string[][]) {
  for (let i = 1; i < tiers.length; i++) {
    for (const first of tiers[i - 1]) {
      for (const then of tiers[i]) {
        expectSettledBeforeStart(hook, first, then)
      }
    }
  }
}

const TIERS_FROM_DEEPEST = [['leaf'], ['mid', 'midHelper'], ['root']]

describe('Lifecycle hooks across smart modules', () => {
  beforeEach(() => {
    events = []
  })

  it('should settle the setup hooks of an imported module before the importer starts its own', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RootService.smartModule({ url: 'postgres://db' })],
    }).compile()

    await moduleRef.init()

    for (const hook of SETUP_HOOKS) {
      expectTiersInOrder(hook, TIERS_FROM_DEEPEST)
    }

    await moduleRef.close()
  })

  it('should tear modules down one at a time, importers first from NestJS 11 on', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RootService.smartModule({ url: 'postgres://db' })],
    }).compile()

    await moduleRef.init()
    await moduleRef.close()

    const tiers = nestMajor >= 11 ? [...TIERS_FROM_DEEPEST].reverse() : TIERS_FROM_DEEPEST
    for (const hook of TEARDOWN_HOOKS) {
      expectTiersInOrder(hook, tiers)
    }
  })

  it('should run the phases in order: setup hooks, then teardown hooks', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RootService.smartModule({ url: 'postgres://db' })],
    }).compile()

    await moduleRef.init()
    await moduleRef.close()

    const phases: string[] = [...SETUP_HOOKS, ...TEARDOWN_HOOKS]
    const phaseOfEachEvent = events.map(event => phases.indexOf(event.split(' ')[0]))

    expect(new Set(phaseOfEachEvent).size).toBe(phases.length)
    expect(phaseOfEachEvent).toEqual([...phaseOfEachEvent].sort((a, b) => a - b))
  })

  it('should resolve asynchronous configuration before the first hook runs', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        RootService.smartModule({
          useFactory: async () => {
            await new Promise(resolve => setImmediate(resolve))
            events.push('configuration resolved')
            return { url: 'postgres://async' }
          },
        }),
      ],
    }).compile()

    await moduleRef.init()

    expect(events[0]).toBe('configuration resolved')
    expect(moduleRef.get(RootService, { strict: false }).mid.helper.leaf.urlSeenInHook).toBe('postgres://async')

    await moduleRef.close()
  })

  it('should run the hooks of each instance of a module imported twice, each with the merged configuration', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DiamondService.smartModule({ url: 'postgres://db' })],
    }).compile()

    await moduleRef.init()

    const diamond = moduleRef.get(DiamondService, { strict: false })
    expect(diamond.leaf).not.toBe(diamond.branch.leaf)
    expect(diamond.leaf.urlSeenInHook).toBe('postgres://db')
    expect(diamond.branch.leaf.urlSeenInHook).toBe('postgres://db')
    expect(events.filter(event => event === 'onModuleInit end leaf')).toHaveLength(2)

    await moduleRef.close()

    expect(events.filter(event => event === 'onApplicationShutdown end leaf')).toHaveLength(2)
  })
})
