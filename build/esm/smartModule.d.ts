import type { DynamicModule } from '@nestjs/common';
import type { AnySmartConfig, AnySmartImport, SmartModuleOrFactory } from './types.js';
import type { InferSmartFactory } from './infer.js';
/**
 * Turns a module definition into a configurable module factory.
 *
 * The returned factory accepts the merged configuration of every
 * `smartConfigs` class and every composed `smartImports` factory in the
 * tree, and produces a NestJS {@link DynamicModule}. Configuration can be
 * passed synchronously (a plain object) or asynchronously (an
 * {@link AsyncParams} object with `useFactory`/`inject`/`imports`).
 *
 * Inline config classes may precede the definition when it is a factory
 * function — their instantiated values are passed to the factory so the
 * module definition can depend on resolved configuration.
 *
 * Each factory call creates its own `DynamicModule` (and therefore its own
 * provider instances); the merged configuration is delivered identically to
 * every branch of the tree.
 *
 * @example
 * ```ts
 * class DatabaseConfig {
 *   url: string
 * }
 *
 * @Injectable()
 * class DatabaseService {
 *   static smartModule = smartModule({
 *     smartConfigs: [DatabaseConfig],
 *     providers: [DatabaseService],
 *     exports: [DatabaseService],
 *   })
 *
 *   constructor(private readonly config: DatabaseConfig) {}
 * }
 *
 * // in AppModule: imports: [DatabaseService.smartModule({ url: 'postgres://…' })]
 * ```
 *
 * @param args - Optional inline {@link AnySmartConfig} classes followed by a
 *   module definition object or a definition factory
 *   `(imports, ...configs) => SmartModule`.
 * @returns A factory `(config) => DynamicModule` whose parameter type is
 *   inferred from every config class and composed import in the definition.
 */
export declare function smartModule<T extends AnySmartConfig[] = [], TC extends AnySmartConfig[] = [], TI extends AnySmartImport[] = []>(...args: [...T, SmartModuleOrFactory<[...T], [...TC], [...TI]>]): InferSmartFactory<[...T, ...TC, ...TI]>;
/**
 * Definition without smart configs or smart imports: the returned factory
 * takes no configuration argument.
 */
export declare function smartModule(moduleOrModuleDefinitionFn: SmartModuleOrFactory<[], [], []>): () => DynamicModule;
//# sourceMappingURL=smartModule.d.ts.map