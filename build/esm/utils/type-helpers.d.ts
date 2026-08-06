export type Unbox<T> = T extends infer U ? {
    [K in keyof U]: Unbox<U[K]>;
} : never;
export type Spread<A extends [...any]> = A extends [infer L, ...infer R] ? L & Spread<R> : unknown;
//# sourceMappingURL=type-helpers.d.ts.map