interface Map<K, V> {
    clear(): void;
    delete(key: K): boolean;
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): this;
    readonly size: number;
}

interface MapConstructor {
    new(): Map<any, any>;
    new<K, V>(entries?: ReadonlyArray<[K, V]> | null): Map<K, V>;
    readonly prototype: Map<any, any>;
}
declare var Map: MapConstructor;

interface ReadonlyMap<K, V> {
    forEach(callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void, thisArg?: any): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    readonly size: number;
}

interface WeakMap<K extends object, V> {
    delete(key: K): boolean;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): this;
}

interface WeakMapConstructor {
    new <K extends object = object, V = any>(entries?: ReadonlyArray<[K, V]> | null): WeakMap<K, V>;
    readonly prototype: WeakMap<object, any>;
}
declare var WeakMap: WeakMapConstructor;

interface Set<T> {
    add(value: T): this;
    clear(): void;
    delete(value: T): boolean;
    forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void;
    has(value: T): boolean;
    readonly size: number;
}

interface SetConstructor {
    new <T = any>(values?: ReadonlyArray<T> | null): Set<T>;
    readonly prototype: Set<any>;
}
declare var Set: SetConstructor;

interface ReadonlySet<T> {
    forEach(callbackfn: (value: T, value2: T, set: ReadonlySet<T>) => void, thisArg?: any): void;
    has(value: T): boolean;
    readonly size: number;
}

interface WeakSet<T extends object> {
    add(value: T): this;
    delete(value: T): boolean;
    has(value: T): boolean;
}

interface WeakSetConstructor {
    new <T extends object = object>(values?: ReadonlyArray<T> | null): WeakSet<T>;
    readonly prototype: WeakSet<object>;
}
declare var WeakSet: WeakSetConstructor;

interface Promise < T > {
    then < TResult1,
    TResult2 > (onfulfilled ? : ((value: T) => TResult1 | PromiseLike < TResult1 > ) | undefined | null, onrejected ? : ((reason: any) => TResult2 | PromiseLike < TResult2 > ) | undefined | null): Promise < TResult1 | TResult2 > ;
    catch < TResult > (onrejected ? : ((reason: any) => TResult | PromiseLike < TResult > ) | undefined | null): Promise < T | TResult > ;
}

interface PromiseConstructor {
    readonly prototype: Promise < any > ;
    new < T > (executor: (resolve: (value ? : T | PromiseLike < T > ) => void, reject: (reason ? : any) => void) => void): Promise < T > ;
    all < T1, T2, T3, T4, T5, T6, T7, T8, T9, T10 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > , T4 | PromiseLike < T4 > , T5 | PromiseLike < T5 > , T6 | PromiseLike < T6 > , T7 | PromiseLike < T7 > , T8 | PromiseLike < T8 > , T9 | PromiseLike < T9 > , T10 | PromiseLike < T10 > ]): Promise < [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10] > ;
    all < T1, T2, T3, T4, T5, T6, T7, T8, T9 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > , T4 | PromiseLike < T4 > , T5 | PromiseLike < T5 > , T6 | PromiseLike < T6 > , T7 | PromiseLike < T7 > , T8 | PromiseLike < T8 > , T9 | PromiseLike < T9 > ]): Promise < [T1, T2, T3, T4, T5, T6, T7, T8, T9] > ;
    all < T1, T2, T3, T4, T5, T6, T7, T8 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > , T4 | PromiseLike < T4 > , T5 | PromiseLike < T5 > , T6 | PromiseLike < T6 > , T7 | PromiseLike < T7 > , T8 | PromiseLike < T8 > ]): Promise < [T1, T2, T3, T4, T5, T6, T7, T8] > ;
    all < T1, T2, T3, T4, T5, T6, T7 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > , T4 | PromiseLike < T4 > , T5 | PromiseLike < T5 > , T6 | PromiseLike < T6 > , T7 | PromiseLike < T7 > ]): Promise < [T1, T2, T3, T4, T5, T6, T7] > ;
    all < T1, T2, T3, T4, T5, T6 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > , T4 | PromiseLike < T4 > , T5 | PromiseLike < T5 > , T6 | PromiseLike < T6 > ]): Promise < [T1, T2, T3, T4, T5, T6] > ;
    all < T1, T2, T3, T4, T5 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > , T4 | PromiseLike < T4 > , T5 | PromiseLike < T5 > ]): Promise < [T1, T2, T3, T4, T5] > ;
    all < T1, T2, T3, T4 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > , T4 | PromiseLike < T4 > ]): Promise < [T1, T2, T3, T4] > ;
    all < T1, T2, T3 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > ]): Promise < [T1, T2, T3] > ;
    all < T1, T2 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > ]): Promise < [T1, T2] > ;
    all < T > (values: (T | PromiseLike < T > )[]): Promise < T[] > ;
    race < T1, T2, T3, T4, T5, T6, T7, T8, T9, T10 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > , T4 | PromiseLike < T4 > , T5 | PromiseLike < T5 > , T6 | PromiseLike < T6 > , T7 | PromiseLike < T7 > , T8 | PromiseLike < T8 > , T9 | PromiseLike < T9 > , T10 | PromiseLike < T10 > ]): Promise < T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 > ;
    race < T1, T2, T3, T4, T5, T6, T7, T8, T9 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > , T4 | PromiseLike < T4 > , T5 | PromiseLike < T5 > , T6 | PromiseLike < T6 > , T7 | PromiseLike < T7 > , T8 | PromiseLike < T8 > , T9 | PromiseLike < T9 > ]): Promise < T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 > ;
    race < T1, T2, T3, T4, T5, T6, T7, T8 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > , T4 | PromiseLike < T4 > , T5 | PromiseLike < T5 > , T6 | PromiseLike < T6 > , T7 | PromiseLike < T7 > , T8 | PromiseLike < T8 > ]): Promise < T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 > ;
    race < T1, T2, T3, T4, T5, T6, T7 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > , T4 | PromiseLike < T4 > , T5 | PromiseLike < T5 > , T6 | PromiseLike < T6 > , T7 | PromiseLike < T7 > ]): Promise < T1 | T2 | T3 | T4 | T5 | T6 | T7 > ;
    race < T1, T2, T3, T4, T5, T6 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > , T4 | PromiseLike < T4 > , T5 | PromiseLike < T5 > , T6 | PromiseLike < T6 > ]): Promise < T1 | T2 | T3 | T4 | T5 | T6 > ;
    race < T1, T2, T3, T4, T5 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > , T4 | PromiseLike < T4 > , T5 | PromiseLike < T5 > ]): Promise < T1 | T2 | T3 | T4 | T5 > ;
    race < T1, T2, T3, T4 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > , T4 | PromiseLike < T4 > ]): Promise < T1 | T2 | T3 | T4 > ;
    race < T1, T2, T3 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > , T3 | PromiseLike < T3 > ]): Promise < T1 | T2 | T3 > ;
    race < T1, T2 > (values: [T1 | PromiseLike < T1 > , T2 | PromiseLike < T2 > ]): Promise < T1 | T2 > ;
    race < T > (values: (T | PromiseLike < T > )[]): Promise < T > ;
    reject(reason: any): Promise < never > ;
    reject < T > (reason: any): Promise < T > ;
    resolve < T > (value: T | PromiseLike < T > ): Promise < T > ;
    resolve(): Promise < void > ;
}

declare var Promise: PromiseConstructor;