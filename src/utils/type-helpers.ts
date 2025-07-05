// Just copy object type as a new type
// Use to produce clean object type with final props (it unboxing all intermediate types)
// Example:
// CombinedObjectFromTwo<Config2, CombinedObjectFromTwo<Pick<Config, "x"> & Pick<CombinedObjectFromTwo<ObjectWithPrefixesProps<ConfigP, "p">, unknown>, "py"> & Pick<...> & CombinedProperties<...>, unknown>>
// ->
// { f: string; x: number; py: number; }
export type Unbox<T> = T extends infer U ? { [K in keyof U]: Unbox<U[K]> } : never

// Combine list of object type in type that contains properties from all input types
// Spread<[{x: string}, {y: number}, ...]> -> {x: string, y: number, ...}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Spread<A extends [...any]> = A extends [infer L, ...infer R] ? L & Spread<R> : unknown
