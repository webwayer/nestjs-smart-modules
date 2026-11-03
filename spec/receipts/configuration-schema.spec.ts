import { Injectable } from '@nestjs/common'
import { smartModule } from '../../src/smartModule'
import type { SmartSchema } from '../../src/schema'
import { matchExpectedSchema } from '../utils/spec-helpers'

// Example: every setting an application reads
export class DatabaseConfig {
  static label = 'database' as const
  url?: string = 'postgres://localhost:5432'
  poolSize?: number = 10
}

@Injectable()
export class DatabaseService {
  static smartModule = smartModule({
    smartConfigs: [DatabaseConfig],
    providers: [DatabaseService],
    exports: [DatabaseService],
  })
}

export class ReportsConfig {
  static label = 'reports' as const
  pageSize?: number = 50
}

@Injectable()
export class ReportsService {
  static smartModule = smartModule({
    smartConfigs: [ReportsConfig],
    smartImports: [DatabaseService.smartModule],
    providers: [ReportsService],
  })
}

// Each setting as its path in the configuration object, with its default.
export function settingsOf(schema: SmartSchema, path: string[] = []): Record<string, unknown> {
  const own = schema.configs.map(({ config, label, prefix }) => {
    const at = label ? [...path, label] : path
    return Object.entries(new config()).map(([key, value]) => [[...at, `${prefix ?? ''}${key}`].join('.'), value])
  })
  const imported = schema.imports.map(({ label, schema: child }) =>
    child ? Object.entries(settingsOf(child, label ? [...path, label] : path)) : [],
  )
  return Object.fromEntries([...own, ...imported].flat())
}

describe('README: Reading the Configuration Tree', () => {
  it('should list every setting the tree reads, with its default', () => {
    matchExpectedSchema(ReportsService.smartModule, {
      configs: [{ config: ReportsConfig, label: 'reports', prefix: undefined }],
      imports: [{ schema: DatabaseService.smartModule.schema }],
    })

    expect(settingsOf(ReportsService.smartModule.schema)).toEqual({
      'reports.pageSize': 50,
      'database.url': 'postgres://localhost:5432',
      'database.poolSize': 10,
    })
  })
})
