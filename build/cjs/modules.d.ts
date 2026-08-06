import type { AsyncParams, AnySmartConfig, AnySmartImport, ExtendedSmartConfig, SmartConfig } from './types.js';
export declare function moduleFromSmartConfig(smartConfigBase: AnySmartConfig, arg: AsyncParams<object> | object): {
    module: {
        new (): {};
    };
    imports: (import("@nestjs/common").Type<any> | import("@nestjs/common").DynamicModule | Promise<import("@nestjs/common").DynamicModule> | import("@nestjs/common").ForwardReference<any>)[];
    providers: {
        inject: any[] | undefined;
        useFactory(...args: unknown[]): Promise<unknown>;
        provide: string | symbol | SmartConfig<any>;
    }[];
    exports: (string | symbol | SmartConfig<any>)[];
} | {
    module: {
        new (): {};
    };
    providers: {
        useValue: unknown;
        provide: string | symbol | SmartConfig<any>;
    }[];
    exports: (string | symbol | SmartConfig<any>)[];
    imports?: undefined;
};
export declare function moduleFromSmartImport(smartImportBase: AnySmartImport, arg: AsyncParams<object> | object): import("@nestjs/common").DynamicModule;
export declare function applyPropsToSmartConfig<T>(config: SmartConfig, overrideObj: object): T;
export declare function instantiateSmartConfig(config: SmartConfig, arg?: object): unknown;
export declare function instantiateExtendedSmartConfig(config: ExtendedSmartConfig, arg?: object): unknown;
//# sourceMappingURL=modules.d.ts.map