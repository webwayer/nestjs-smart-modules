import { Injectable, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { smartModule } from '../../src/smartModule'
import { Test } from '@nestjs/testing'
import { matchExpectedModuleStructure } from '../utils/spec-helpers'

// README: Advanced Usage > Asynchronous Configuration
// ConfigModule.forRoot() here is intentionally NOT global — the async `imports`
// of AsyncParams must make ConfigService resolvable inside the generated
// AuthConfigSmartConfigModule (regression for the provider-level imports bug).

// auth.service.ts
export class AuthConfig {
  jwtSecret: string
  expiresIn: string
}

@Injectable()
export class AuthService {
  static smartModule = smartModule({
    smartConfigs: [AuthConfig],
    providers: [AuthService],
    exports: [AuthService],
  })

  constructor(readonly config: AuthConfig) {}
}

// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot(), // Standard NestJS ConfigModule
    AuthService.smartModule({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        jwtSecret: configService.get('JWT_SECRET'),
        expiresIn: configService.get('JWT_EXPIRES_IN'),
      }),
    }),
  ],
})
export class AppModule {}

describe('Recipes: Asynchronous Configuration', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'jwt-secret-from-env'
    process.env.JWT_EXPIRES_IN = '1h'
  })

  afterAll(() => {
    delete process.env.JWT_SECRET
    delete process.env.JWT_EXPIRES_IN
  })

  it('should place async imports on the generated config module', () => {
    const module = AuthService.smartModule({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        jwtSecret: configService.get('JWT_SECRET'),
        expiresIn: configService.get('JWT_EXPIRES_IN'),
      }),
    })

    matchExpectedModuleStructure(module, {
      moduleName: 'AuthServiceSmartModule',
      imports: 1,
      providers: [AuthService],
      exports: [AuthService],
    })

    matchExpectedModuleStructure(module.imports[0] as never, {
      moduleName: 'AuthConfigSmartConfigModule',
      imports: [ConfigModule],
      exports: [AuthConfig],
      providers: [
        {
          provide: AuthConfig,
          useFactory: expect.any(Function),
          inject: [ConfigService],
        },
      ],
    })
  })

  it('should resolve async configuration from a non-global imported module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    const authService = moduleRef.get(AuthService)
    expect(authService).toBeInstanceOf(AuthService)
    expect(authService.config).toEqual({
      jwtSecret: 'jwt-secret-from-env',
      expiresIn: '1h',
    })

    const authConfig = moduleRef.get(AuthConfig)
    expect(authConfig).toEqual({
      jwtSecret: 'jwt-secret-from-env',
      expiresIn: '1h',
    })

    await moduleRef.close()
  })
})
