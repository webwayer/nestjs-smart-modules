// Compile-time probe (no runtime tests): guards factory inference against
// any-collapse. Historically, factories returning modules with more than one
// provider/export made TypeScript infer the smart factory as `any` unless
// SmartModule's array properties were declared as tuple unions; typeAssert
// cannot catch that regression (any satisfies TypeTest), but the
// expect-error directives below stop erroring — and fail the typecheck —
// if inference ever collapses again.
import { smartModule } from '../src/index.js'

class ProbeService {}
class ProbeConfig {
  x: string
}
class ProbeConfig2 {
  y: string
}

const factory = smartModule(ProbeConfig, (imports, _c: ProbeConfig) => ({
  imports,
  providers: [ProbeService, { provide: 'T', useValue: 1 }],
  exports: [ProbeService, 'T'],
}))

// Valid usage must compile:
factory({ x: 'ok' })

// @ts-expect-error missing required prop must be rejected (fails if factory is any)
factory({})

// @ts-expect-error wrong prop type must be rejected (fails if factory is any)
factory({ x: 1 })

// The heaviest shape: inline config + smartConfigs + smartImports in a factory
// definition with multiple providers, exports and controllers.
const dep = smartModule({ providers: [ProbeService], exports: [ProbeService] })

const heavy = smartModule(ProbeConfig, (imports, _c: ProbeConfig) => ({
  imports,
  controllers: [ProbeService],
  providers: [ProbeService, { provide: 'A', useValue: 1 }, { provide: 'B', useValue: 2 }],
  exports: [ProbeService, 'A', 'B'],
  smartConfigs: [ProbeConfig2],
  smartImports: [dep],
}))

// Valid merged config must compile:
heavy({ x: 'ok', y: 'ok' })

// @ts-expect-error missing prop from smartConfigs must be rejected
heavy({ x: 'ok' })

// @ts-expect-error missing prop from the inline config must be rejected
heavy({ y: 'ok' })

export {}
