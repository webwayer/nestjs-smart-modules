import type { DynamicModule } from '@nestjs/common';
export declare function createNamedClass(name: string): {
    new (): {};
};
type PlainObject = Record<string, unknown>;
export declare function pickLabeledAndPrefixed(obj: object | undefined, label?: string, prefix?: string): PlainObject;
export declare function appendImports(module: DynamicModule, imports: DynamicModule[]): DynamicModule;
export {};
//# sourceMappingURL=helpers.d.ts.map