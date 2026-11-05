import { Injectable, ParseIntPipe } from '@nestjs/common'
import type { ArgumentMetadata, PipeTransform } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { smartModule } from '../src/smartModule'
import type { TypeTest, ExpectedFactoryType } from './utils/spec-helpers'
import { typeAssert } from './utils/spec-helpers'

// Pipes as smart module providers. NestJS 12 (nestjs/nest#16147) retyped the
// built-in pipes' `transform` to take `unknown` and to include null/undefined
// in its result. The library only sees a pipe as a provider, so this holds the
// provider lists and factory inference to both the old and the new shape; the
// suite's typecheck runs on the lockfile NestJS and on NestJS 12.

const metadata: ArgumentMetadata = { type: 'param' }

class ClampConfig {
  max: number
}

@Injectable()
class ClampPipe implements PipeTransform<unknown, number> {
  constructor(readonly config: ClampConfig) {}

  transform(value: unknown) {
    return Math.min(Number(value), this.config.max)
  }
}

const pipesModule = smartModule({
  smartConfigs: [ClampConfig],
  providers: [ClampPipe, ParseIntPipe],
  exports: [ClampPipe, ParseIntPipe],
})

describe('Pipes as smart module providers', () => {
  it('should infer the factory from the configuration alone, whatever the pipes look like', () => {
    typeAssert<TypeTest<typeof pipesModule, ExpectedFactoryType<{ max: number }>>>()
  })

  it('should inject the configuration into a custom pipe and resolve a built-in one', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [pipesModule({ max: 10 })],
    }).compile()

    expect(moduleRef.get(ClampPipe, { strict: false }).transform('42')).toBe(10)
    await expect(moduleRef.get(ParseIntPipe, { strict: false }).transform('42', metadata)).resolves.toBe(42)

    await moduleRef.close()
  })
})
