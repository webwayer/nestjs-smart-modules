// Just copy object type as a new type
// Use to produce clean object type with final props (it unboxing all intermediate types)
// Example:
// CombinedObjectFromTwo<Config2, CombinedObjectFromTwo<Pick<Config, "x"> & Pick<CombinedObjectFromTwo<ObjectWithPrefixesProps<ConfigP, "p">, unknown>, "py"> & Pick<...> & CombinedProperties<...>, unknown>>
// ->
// { f: string; x: number; py: number; }
export type Unbox<T> = T extends infer U ? { [K in keyof U]: Unbox<U[K]> } : never

// Combine list of object type in type that contains properties from all input types
// Spread<[{x: string}, {y: number}, ...]> -> {x: string, y: number, ...}
//
// Tail-recursive on purpose: the intersection accumulates in `Acc` and the recursive
// reference is the whole result, so TypeScript evaluates it as a loop (its limit is
// about a thousand elements) rather than as nested instantiations, which it gives up
// on at about fifty — a `smartImports` list of forty-seven entries used to fail with
// TS2589 for this one type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Spread<A extends [...any], Acc = unknown> = A extends [infer L, ...infer R] ? Spread<R, Acc & L> : Acc

// `[] | [T] | [T, T] | … | [T × N] | T[]`: every fixed-length tuple of T up to N,
// then the plain array. An array literal checked against this is typed as the
// tuple of its own length, element by element, which is what keeps a class
// that lists itself in its own static `smartModule` out of TS7022 — see the
// comment on SmartModule's array properties in types.ts. Recursive on the
// accumulator's length, so N is a number rather than N hand-written lines.
export type ListOfUpTo<T, N extends number, Acc extends T[] = []> = Acc['length'] extends N
  ? Acc | T[]
  : Acc | ListOfUpTo<T, N, [...Acc, T]>
