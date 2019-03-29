declare module field {
    /**获取版本号*/
    function version(): string;

    /**静态编码函数 */
    function To(value: any, writer?: Writer): Uint8Array;
    function ToShell(value: RootSettler<any>, writer?: Writer): Uint8Array;
    /**静态解码函数 */
    function From<T>(data: Uint8Array, reader?: Reader): T;
    function FromShell<T extends RootObject<T>>(data: Uint8Array, reader?: Reader): RootSettler<T>;
    /**静态JSON转换方法*/
    function Parse<T>(value: any): T;
    function ParseShell<T extends RootObject<T>>(value: any): RootSettler<T>;
    /**静态字符串转换方法*/
    function Stringify(value: any): string;
    function StringifyShell(value: RootSettler<any>): string;
    /**转换规则装饰器 */
    function Convert(cls: Function, type?: string);
    /**类型标记装饰器 */
    function Type(type: string): Function;
    /**构造函数，根据指定的名称构造对应的实例 */
    function Ctor(cls: new () => any): any;
    function Ctor(type: string): any;
    function Ctor(value: any);
    /**通过类型名称获取构造函数 */
    function GetCtorByType(type: string): Function;
    /**获取类型名称 */
    function GetType(serial: number): string;
    function GetType(cls: new (...any:any[]) => any): string;
    /**获取构造类型 */
    function GetCtorByValue(value: any): new () => any;
    /**获取类型名称 */
    function GetTypeByValue(value: any): string;
    function GetSerial(value: Object):number;
    function GetSerial(cls: Function):number;

    function GetSerialByValue(value:any):number;

    function GetCtor(serial: number): new (...any: any[]) => any;
    function GetCtor(type: string): new (...any: any[]) => any;
    
    /**转换规则属性标记 */
    function Field(type: Function, identifyName: string, structure?: Function): Function;
    /**状态属性标记 */
    function Status(status: StatusEnum | number): Function;
    /**结算类标记 */
    function Settle(cls: Function);
    /**复杂属性标记 */
    function Attr(identifyName: string): Function;
    /**行为属性标记 */
    function Behav(cls: Function): Function;
    function Behav(identifyName: string): Function;

    /**获取规则转换器 */
    function GetConverter<T>(name: string): ISettleConverter<T>;
    function GetConverter<T>(cls: Function): ISettleConverter<T>;
    function GetConverter<T>(serial: number): ISettleConverter<T>;

    /**获取结算规则创建方法 */
    function GetCtorOfSettler(cls: Function): new (value: any, index: number, parent: IParent<any>) => IOperate<any>;
    /**获取结算规则 */
    function GetSettler<T>(value: T, cls: Function, index?: number, parent?: IParent<T>): IOperate<T>;

    interface IConverter<T> {
        cls: new () => T;
        /**转换对象为字节数组方法 */
        to(writer: Writer, value: T, cls?: Function): void;
        /**转换字节数组为对象方法 */
        from(reader: Reader, cls?: Function): T;
        /**解析对象方法 */
        parse(obj: any, cls?: Function): T;
        /**转为JSON文本 */
        json(obj: any, cls?: Function): string;
    }
    interface ISettleConverter<T> extends IConverter<T> {
        serial: number;
        settler: (value: T, index?: number, parent?: IParent<T>) => IOperate<T>;
        /**转换封装对象为字节数组的方法 */
        toShell(writer: Writer, value: IOperate<T>, cls?: Function);
        /**转换字节数组为对象并且封装的方法 */
        fromShell(reader: Reader, cls?: Function, index?: number, parent?: IParent<T>): IOperate<T>;
        /**解析对象并封装在可结算外壳内的方法 */
        parseShell(obj: any, cls?: Function, index?: number, parent?: IParent<T>): IOperate<T>;
        /**转为JSON文本 */
        jsonShell(obj: IOperate<T>, cls?: Function): string;
    }
    interface IBehavior<T extends RootObject<T>> {
        isInit: IOperate<boolean>;
        /**根结算点 */
        root: RootSettler<T>;
        /**继承类型 */
        class: IOperate<string>;
        /**更新周期性检查函数 */
        update(delta: number);
        /**首次初始化执行函数 */
        init();
        /**数据载入时执行函数 */
        enable();
    }
    interface IParent<T> {
        /**类型索引值 */
        serial: number;
        /**父级引用 */
        parent: IParent<any>;
        /**处于父级中的索引序号 */
        index: number;
    }
    /**事件驱动外壳 */
    interface IEvent<T> extends IParent<T> {
        /**监听修改 */
        on(caller: any, listener: (value: any, old?: any) => void);
        /**汇报事件 */
        report(serial: number, value: IValue<T>, oldValue: T, index?: number[]);
        /**发布事件 */
        emit(event?: EventData<T>);
    }
    interface IValue<T> extends IEvent<T> {
        value: T;
        /**初始化函数 */
        init(): void;
    }
    //结算驱动外壳
    interface ISettler<T> extends IValue<T> {
        /**获取结算修改操作 */
        change<T>(serial: number, arr?: number[]): PropData<T>;
        /**执行结算属性的操作 */
        execute(cache?: any[]);
        /**检视所有结算属性 */
        inspect(cache?: PropData<any>);
        /**合并操作依据优先级进行，在处理异步的操作过程时，可以使用一个值作为优先级判定标准，一般推荐使用UUID值 */
        merge(data: DataSettle<T>, cache?: PropData<T>);
    }
    /**
     * 结算属性，这里相当于接口，主要提供代码提示部分
     * 所有经过Field解码的公共值都会被封装进结算属性里
     * 结算属性有+，-，*，/，=，几种操作方法，任何操作均不改变Get值，只在统一时刻进行结算
     */
    interface IOperate<T> extends ISettler<T> {
        //对于不同的值类型应该有不同的操作方法
        add(value?: T): IOperate<T>;
        sub(value?: T): IOperate<T>;
        mul(value?: T): IOperate<T>;
        div(value?: T): IOperate<T>;

        /**等于方法优先度最高，如果使用了等于，则会在结算时忽略其他操作，优先级高的将会作为实际结果 */
        eq(value: T): IOperate<T>;
    }
    interface IEventArray<T> extends Array<IEvent<T>>, IParent<T> {

    }
    interface IOperateArray<T> extends Array<IOperate<T>>, IEvent<T> {
        /**添加对象到数组队尾 */
        add(value: T, index?: number): IOperateArray<T>;
        /**移除数组指定索引的值 */
        remove(index: number): IOperateArray<T>;

        on(caller: any, listener: (value: IValue<T>, old: T, index: number) => void);
    }
    interface INumber {
        value: number;
        add(v: INumber): INumber;
        sub(v: INumber): INumber;
        mul(v: INumber): INumber;
        div(v: INumber): INumber;
        neg(): INumber;
        rec(): INumber;
    }
    interface Long {
        /** Low bits */
        low: number;

        /** High bits */
        high: number;

        /** Whether unsigned or not */
        unsigned: boolean;
    }
    class CustomNumber implements INumber {
        readonly MAX_VALUE: number;
        readonly MIN_VALUE: number;
        value: number
        add(v: INumber): INumber;
        sub(v: INumber): INumber;
        mul(v: INumber): INumber;
        div(v: INumber): INumber;
        neg(): INumber;
        rec(): INumber;
        valueOf(): number;
        /**
        * Returns a string representation of an object.
        * @param radix Specifies a radix for converting numeric values to strings. This value is only used for numbers.
        */
        toString(radix?: number): string;
        constructor(v: number | INumber);
        /**静态数字转换方法 */
        static Parse(v: number): number;
    }
    class Integer extends CustomNumber { }
    class Float extends CustomNumber { }
    class Long {
        /**
         * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as signed integers. See the from* functions below for more convenient ways of constructing Longs.
         */
        constructor(low: number, high?: number, unsigned?: boolean);

        /**
         * Maximum unsigned value.
         */
        static MAX_UNSIGNED_VALUE: Long;

        /**
         * Maximum signed value.
         */
        static MAX_VALUE: Long;

        /**
         * Minimum signed value.
         */
        static MIN_VALUE: Long;

        /**
         * Signed negative one.
         */
        static NEG_ONE: Long;

        /**
         * Signed one.
         */
        static ONE: Long;

        /**
         * Unsigned one.
         */
        static UONE: Long;

        /**
         * Unsigned zero.
         */
        static UZERO: Long;

        /**
         * Signed zero
         */
        static ZERO: Long;

        /**
         * The high 32 bits as a signed value.
         */
        high: number;

        /**
         * The low 32 bits as a signed value.
         */
        low: number;

        /**
         * Whether unsigned or not.
         */
        unsigned: boolean;

        /**
         * Returns a Long representing the 64 bit integer that comes by concatenating the given low and high bits. Each is assumed to use 32 bits.
         */
        static fromBits(lowBits: number, highBits: number, unsigned?: boolean): Long;

        /**
         * Returns a Long representing the given 32 bit integer value.
         */
        static fromInt(value: number, unsigned?: boolean): Long;

        /**
         * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
         */
        static fromNumber(value: number, unsigned?: boolean): Long;

        /**
         * Returns a Long representation of the given string, written using the specified radix.
         */
        static fromString(str: string, unsigned?: boolean | number, radix?: number): Long;

        /**
         * Creates a Long from its byte representation.
         */
        static fromBytes(bytes: number[], unsigned?: boolean, le?: boolean): Long;

        /**
         * Creates a Long from its little endian byte representation.
         */
        static fromBytesLE(bytes: number[], unsigned?: boolean): Long;

        /**
         * Creates a Long from its little endian byte representation.
         */
        static fromBytesBE(bytes: number[], unsigned?: boolean): Long;

        /**
         * Tests if the specified object is a Long.
         */
        static isLong(obj: any): boolean;

        /**
         * Converts the specified value to a Long.
         */
        static fromValue(val: Long | number | string | { low: number, high: number, unsigned: boolean }): Long;

        /**
         * Returns the sum of this and the specified Long.
         */
        add(addend: number | Long | string): Long;

        /**
         * Returns the bitwise AND of this Long and the specified.
         */
        and(other: Long | number | string): Long;

        /**
         * Compares this Long's value with the specified's.
         */
        compare(other: Long | number | string): number;

        /**
         * Compares this Long's value with the specified's.
         */
        comp(other: Long | number | string): number;

        /**
         * Returns this Long divided by the specified.
         */
        divide(divisor: Long | number | string): Long;

        /**
         * Returns this Long divided by the specified.
         */
        div(divisor: Long | number | string): Long;

        /**
         * Tests if this Long's value equals the specified's.
         */
        equals(other: Long | number | string): boolean;

        /**
         * Tests if this Long's value equals the specified's.
         */
        eq(other: Long | number | string): boolean;

        /**
         * Gets the high 32 bits as a signed integer.
         */
        getHighBits(): number;

        /**
         * Gets the high 32 bits as an unsigned integer.
         */
        getHighBitsUnsigned(): number;

        /**
         * Gets the low 32 bits as a signed integer.
         */
        getLowBits(): number;

        /**
         * Gets the low 32 bits as an unsigned integer.
         */
        getLowBitsUnsigned(): number;

        /**
         * Gets the number of bits needed to represent the absolute value of this Long.
         */
        getNumBitsAbs(): number;

        /**
         * Tests if this Long's value is greater than the specified's.
         */
        greaterThan(other: Long | number | string): boolean;

        /**
         * Tests if this Long's value is greater than the specified's.
         */
        gt(other: Long | number | string): boolean;

        /**
         * Tests if this Long's value is greater than or equal the specified's.
         */
        greaterThanOrEqual(other: Long | number | string): boolean;

        /**
         * Tests if this Long's value is greater than or equal the specified's.
         */
        gte(other: Long | number | string): boolean;

        /**
         * Tests if this Long's value is even.
         */
        isEven(): boolean;

        /**
         * Tests if this Long's value is negative.
         */
        isNegative(): boolean;

        /**
         * Tests if this Long's value is odd.
         */
        isOdd(): boolean;

        /**
         * Tests if this Long's value is positive.
         */
        isPositive(): boolean;

        /**
         * Tests if this Long's value equals zero.
         */
        isZero(): boolean;

        /**
         * Tests if this Long's value is less than the specified's.
         */
        lessThan(other: Long | number | string): boolean;

        /**
         * Tests if this Long's value is less than the specified's.
         */
        lt(other: Long | number | string): boolean;

        /**
         * Tests if this Long's value is less than or equal the specified's.
         */
        lessThanOrEqual(other: Long | number | string): boolean;

        /**
         * Tests if this Long's value is less than or equal the specified's.
         */
        lte(other: Long | number | string): boolean;

        /**
         * Returns this Long modulo the specified.
         */
        modulo(other: Long | number | string): Long;

        /**
         * Returns this Long modulo the specified.
         */
        mod(other: Long | number | string): Long;

        /**
         * Returns the product of this and the specified Long.
         */
        multiply(multiplier: Long | number | string): Long;

        /**
         * Returns the product of this and the specified Long.
         */
        mul(multiplier: Long | number | string): Long;

        /**
         * Negates this Long's value.
         */
        negate(): Long;

        /**
         * Negates this Long's value.
         */
        neg(): Long;

        /**
         * Returns the bitwise NOT of this Long.
         */
        not(): Long;

        /**
         * Tests if this Long's value differs from the specified's.
         */
        notEquals(other: Long | number | string): boolean;

        /**
         * Tests if this Long's value differs from the specified's.
         */
        neq(other: Long | number | string): boolean;

        /**
         * Returns the bitwise OR of this Long and the specified.
         */
        or(other: Long | number | string): Long;

        /**
         * Returns this Long with bits shifted to the left by the given amount.
         */
        shiftLeft(numBits: number | Long): Long;

        /**
         * Returns this Long with bits shifted to the left by the given amount.
         */
        shl(numBits: number | Long): Long;

        /**
         * Returns this Long with bits arithmetically shifted to the right by the given amount.
         */
        shiftRight(numBits: number | Long): Long;

        /**
         * Returns this Long with bits arithmetically shifted to the right by the given amount.
         */
        shr(numBits: number | Long): Long;

        /**
         * Returns this Long with bits logically shifted to the right by the given amount.
         */
        shiftRightUnsigned(numBits: number | Long): Long;

        /**
         * Returns this Long with bits logically shifted to the right by the given amount.
         */
        shru(numBits: number | Long): Long;

        /**
         * Returns the difference of this and the specified Long.
         */
        subtract(subtrahend: number | Long | string): Long;

        /**
         * Returns the difference of this and the specified Long.
         */
        sub(subtrahend: number | Long | string): Long;

        /**
         * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
         */
        toInt(): number;

        /**
         * Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa).
         */
        toNumber(): number;

        /**
         * Converts this Long to its byte representation.
         */

        toBytes(le?: boolean): number[];

        /**
         * Converts this Long to its little endian byte representation.
         */

        toBytesLE(): number[];

        /**
         * Converts this Long to its big endian byte representation.
         */

        toBytesBE(): number[];

        /**
         * Converts this Long to signed.
         */
        toSigned(): Long;

        /**
         * Converts the Long to a string written in the specified radix.
         */
        toString(radix?: number): string;

        /**
         * Converts this Long to unsigned.
         */
        toUnsigned(): Long;

        /**
         * Returns the bitwise XOR of this Long and the given one.
         */
        xor(other: Long | number | string): Long;
    }
    /**二维向量定义 */
    class Vector2 {
        public x: number;
        public y: number;
        constructor(v: Vector2);
        constructor(x: number, y: number);
        constructor(arr: number[]);
        constructor();
        /**
         * 从一般数组构造向量数组
         */
        public static fromNumberArray(v: number[]): Vector2[];
        /**(0, 0) */
        public static readonly Zero: Vector2;
        /**(1, 1) */
        public static readonly One: Vector2;
        /**(0, -1) */
        public static readonly Down: Vector2;
        /**(-1, 0) */
        public static readonly Left: Vector2;
        /**(1, 0) */
        public static readonly Right: Vector2;
        /**(0, 1) */
        public static readonly Up: Vector2;
        /**返回两个向量之间的弧度 */
        public static Euler(from: Vector2, to: Vector2);
        /**返回两个向量之间的角度 */
        public static Angle(from: Vector2, to: Vector2);
        /**返回两个向量之间的距离 */
        public static Distance(from: Vector2, to: Vector2);
        /**返回两个向量的叉积 */
        public static Cross(a: Vector2, b: Vector2): number;
        /**返回两个向量的点积 */
        public static Dot(a: Vector2, b: Vector2): number;
        /**转为字符串形式 */
        public toString(): string;
        /**转为数组形式 */
        public toNumberArray(): number[];
        /**判断向量是否均为0值 */
        public isZero(): boolean;
        /**判断向量是否均为1值 */
        public isOne(): boolean;
        /**判断向量是否为单位向量 */
        public isNorm(): boolean;
        /**返回标准单位向量 */
        public readonly normalized: Vector2;
        /**使向量标准化，返回原向量 */
        public toNormalize(): Vector2;
        /**向量之间的距离，返回一个定点数 */
        public distance(v: Vector2);
        /**向量之间的欧拉角，返回一个定点数，范围在-π到π之间 */
        public euler(v: Vector2);
        /**返回两个向量之间的角度 */
        public angle(v: Vector2);
        /**缩放向量的值 */
        public scale(v: number): Vector2;
        /**向量加法,返回一个新的向量 */
        public add(v: Vector2): Vector2;
        /**向量减法，返回一个新的向量*/
        public sub(v: Vector2): Vector2;
        /**向量反向，返回一个新的向量*/
        public neg(): Vector2;
        /**定义的向量普通乘法，相当于内部值互相乘 */
        public mul(v: Vector2): Vector2;
        /**定义的向量普通除法，相当于内部值互相除 */
        public div(v: Vector2): Vector2;

        /**叉积运算，返回结果值 */
        public cross(v: Vector2): number;
        /**点积运算，返回结果值 */
        public dot(v: Vector2): number;
        /**返回向量模长的平方 */
        public sqrMagnitude(): number;
        /**返回模长 */
        public magnitude(): number;
    }
    /** Wire format reader using `Uint8Array` if available, otherwise `Array`. */
    class Reader {

        /**
         * Constructs a new reader instance using the specified buffer.
         * @param buffer Buffer to read from
         */
        constructor(buffer: Uint8Array);

        /** Read buffer. */
        public buf: Uint8Array;

        /** Read buffer position. */
        public pos: number;

        /** Read buffer length. */
        public len: number;

        /**
         * Creates a new reader using the specified buffer.
         * @param buffer Buffer to read from
         * @returns A {@link BufferReader} if `buffer` is a Buffer, otherwise a {@link Reader}
         * @throws {Error} If `buffer` is not a valid buffer
         */
        public static create(buffer: (Uint8Array | Buffer)): (Reader | BufferReader);

        /**
         * Reads a varint as an unsigned 32 bit value.
         * @returns Value read
         */
        public uint32(): number;

        /**
         * Reads a varint as a signed 32 bit value.
         * @returns Value read
         */
        public int32(): number;

        /**
         * Reads a zig-zag encoded varint as a signed 32 bit value.
         * @returns Value read
         */
        public sint32(): number;

        /**
         * Reads a varint as a signed 64 bit value.
         * @returns Value read
         */
        public int64(): Long;

        /**
         * Reads a varint as an unsigned 64 bit value.
         * @returns Value read
         */
        public uint64(): Long;

        /**
         * Reads a zig-zag encoded varint as a signed 64 bit value.
         * @returns Value read
         */
        public sint64(): Long;

        /**
         * Reads a varint as a boolean.
         * @returns Value read
         */
        public bool(): boolean;

        /**
         * Reads fixed 32 bits as an unsigned 32 bit integer.
         * @returns Value read
         */
        public fixed32(): number;

        /**
         * Reads fixed 32 bits as a signed 32 bit integer.
         * @returns Value read
         */
        public sfixed32(): number;

        /**
         * Reads fixed 64 bits.
         * @returns Value read
         */
        public fixed64(): Long;

        /**
         * Reads zig-zag encoded fixed 64 bits.
         * @returns Value read
         */
        public sfixed64(): Long;

        /**
         * Reads a float (32 bit) as a number.
         * @returns Value read
         */
        public float(): number;

        /**
         * Reads a double (64 bit float) as a number.
         * @returns Value read
         */
        public double(): number;

        /**
         * Reads a sequence of bytes preceeded by its length as a varint.
         * @returns Value read
         */
        public bytes(): Uint8Array;

        /**
         * Reads a string preceeded by its byte length as a varint.
         * @returns Value read
         */
        public string(): string;

        /**
         * Skips the specified number of bytes if specified, otherwise skips a varint.
         * @param [length] Length if known, otherwise a varint is assumed
         * @returns `this`
         */
        public skip(length?: number): Reader;

        /**
         * Skips the next element of the specified wire type.
         * @param wireType Wire type received
         * @returns `this`
         */
        public skipType(wireType: number): Reader;
    }
    /** Wire format reader using node buffers. */
    class BufferReader extends Reader {

        /**
         * Constructs a new buffer reader instance.
         * @param buffer Buffer to read from
         */
        constructor(buffer: Buffer);

        /**
         * Reads a sequence of bytes preceeded by its length as a varint.
         * @returns Value read
         */
        public bytes(): Buffer;
    }
    class Writer {
        /** Constructs a new writer instance. */
        constructor();

        /** Current length. */
        public len: number;

        /** Operations head. */
        public head: object;

        /** Operations tail */
        public tail: object;

        /** Linked forked states. */
        public states: (object | null);

        /**
         * Creates a new writer.
         * @returns A {@link BufferWriter} when Buffers are supported, otherwise a {@link Writer}
         */
        public static create(): (BufferWriter | Writer);

        /**
         * Allocates a buffer of the specified size.
         * @param size Buffer size
         * @returns Buffer
         */
        public static alloc(size: number): Uint8Array;

        /**
         * Writes an unsigned 32 bit value as a varint.
         * @param value Value to write
         * @returns `this`
         */
        public uint32(value: number): Writer;

        /**
         * Writes a signed 32 bit value as a varint.
         * @param value Value to write
         * @returns `this`
         */
        public int32(value: number): Writer;

        /**
         * Writes a 32 bit value as a varint, zig-zag encoded.
         * @param value Value to write
         * @returns `this`
         */
        public sint32(value: number): Writer;

        /**
         * Writes an unsigned 64 bit value as a varint.
         * @param value Value to write
         * @returns `this`
         * @throws {TypeError} If `value` is a string and no long library is present.
         */
        public uint64(value: (Long | number | string)): Writer;

        /**
         * Writes a signed 64 bit value as a varint.
         * @param value Value to write
         * @returns `this`
         * @throws {TypeError} If `value` is a string and no long library is present.
         */
        public int64(value: (Long | number | string)): Writer;

        /**
         * Writes a signed 64 bit value as a varint, zig-zag encoded.
         * @param value Value to write
         * @returns `this`
         * @throws {TypeError} If `value` is a string and no long library is present.
         */
        public sint64(value: (Long | number | string)): Writer;

        /**
         * Writes a boolish value as a varint.
         * @param value Value to write
         * @returns `this`
         */
        public bool(value: boolean): Writer;

        /**
         * Writes an unsigned 32 bit value as fixed 32 bits.
         * @param value Value to write
         * @returns `this`
         */
        public fixed32(value: number): Writer;

        /**
         * Writes a signed 32 bit value as fixed 32 bits.
         * @param value Value to write
         * @returns `this`
         */
        public sfixed32(value: number): Writer;

        /**
         * Writes an unsigned 64 bit value as fixed 64 bits.
         * @param value Value to write
         * @returns `this`
         * @throws {TypeError} If `value` is a string and no long library is present.
         */
        public fixed64(value: (Long | number | string)): Writer;

        /**
         * Writes a signed 64 bit value as fixed 64 bits.
         * @param value Value to write
         * @returns `this`
         * @throws {TypeError} If `value` is a string and no long library is present.
         */
        public sfixed64(value: (Long | number | string)): Writer;

        /**
         * Writes a float (32 bit).
         * @param value Value to write
         * @returns `this`
         */
        public float(value: number): Writer;

        /**
         * Writes a double (64 bit float).
         * @param value Value to write
         * @returns `this`
         */
        public double(value: number): Writer;

        /**
         * Writes a sequence of bytes.
         * @param value Buffer or base64 encoded string to write
         * @returns `this`
         */
        public bytes(value: (Uint8Array | string)): Writer;

        /**
         * Writes a string.
         * @param value Value to write
         * @returns `this`
         */
        public string(value: string): Writer;

        /**
         * Forks this writer's state by pushing it to a stack.
         * Calling {@link Writer#reset|reset} or {@link Writer#ldelim|ldelim} resets the writer to the previous state.
         * @returns `this`
         */
        public fork(): Writer;

        /**
         * Resets this instance to the last state.
         * @returns `this`
         */
        public reset(): Writer;

        /**
         * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
         * @returns `this`
         */
        public ldelim(): Writer;

        /**
         * Finishes the write operation.
         * @returns Finished buffer
         */
        public finish(): Uint8Array;
    }
    /** Wire format writer using node buffers. */
    class BufferWriter extends Writer {

        /** Constructs a new buffer writer instance. */
        constructor();

        /**
         * Finishes the write operation.
         * @returns Finished buffer
         */
        public finish(): Buffer;

        /**
         * Allocates a buffer of the specified size.
         * @param size Buffer size
         * @returns Buffer
         */
        public static alloc(size: number): Buffer;
    }
    /**
    * Raw data is stored in instances of the Buffer class.
    * A Buffer is similar to an array of integers but corresponds to a raw memory allocation outside the V8 heap.  A Buffer cannot be resized.
    * Valid string encodings: 'ascii'|'utf8'|'utf16le'|'ucs2'(alias of 'utf16le')|'base64'|'binary'(deprecated)|'hex'
    */
    const Buffer: {
        /**
         * Allocates a new buffer containing the given {str}.
         *
         * @param str String to store in buffer.
         * @param encoding encoding to use, optional.  Default is 'utf8'
         * @deprecated since v10.0.0 - Use `Buffer.from(string[, encoding])` instead.
         */
        new(str: string, encoding?: string): Buffer;
        /**
         * Allocates a new buffer of {size} octets.
         *
         * @param size count of octets to allocate.
         * @deprecated since v10.0.0 - Use `Buffer.alloc()` instead (also see `Buffer.allocUnsafe()`).
         */
        new(size: number): Buffer;
        /**
         * Allocates a new buffer containing the given {array} of octets.
         *
         * @param array The octets to store.
         * @deprecated since v10.0.0 - Use `Buffer.from(array)` instead.
         */
        new(array: Uint8Array): Buffer;
        /**
         * Produces a Buffer backed by the same allocated memory as
         * the given {ArrayBuffer}/{SharedArrayBuffer}.
         *
         *
         * @param arrayBuffer The ArrayBuffer with which to share memory.
         * @deprecated since v10.0.0 - Use `Buffer.from(arrayBuffer[, byteOffset[, length]])` instead.
         */
        new(arrayBuffer: ArrayBuffer): Buffer;
        /**
         * Allocates a new buffer containing the given {array} of octets.
         *
         * @param array The octets to store.
         * @deprecated since v10.0.0 - Use `Buffer.from(array)` instead.
         */
        new(array: any[]): Buffer;
        /**
         * Copies the passed {buffer} data onto a new {Buffer} instance.
         *
         * @param buffer The buffer to copy.
         * @deprecated since v10.0.0 - Use `Buffer.from(buffer)` instead.
         */
        new(buffer: Buffer): Buffer;
        prototype: Buffer;
        /**
         * When passed a reference to the .buffer property of a TypedArray instance,
         * the newly created Buffer will share the same allocated memory as the TypedArray.
         * The optional {byteOffset} and {length} arguments specify a memory range
         * within the {arrayBuffer} that will be shared by the Buffer.
         *
         * @param arrayBuffer The .buffer property of any TypedArray or a new ArrayBuffer()
         */
        from(arrayBuffer: ArrayBuffer, byteOffset?: number, length?: number): Buffer;
        /**
         * Creates a new Buffer using the passed {data}
         * @param data data to create a new Buffer
         */
        from(data: any[]): Buffer;
        from(data: Uint8Array): Buffer;
        /**
         * Creates a new Buffer containing the given JavaScript string {str}.
         * If provided, the {encoding} parameter identifies the character encoding.
         * If not provided, {encoding} defaults to 'utf8'.
         */
        from(str: string, encoding?: string): Buffer;
        /**
         * Creates a new Buffer using the passed {data}
         * @param values to create a new Buffer
         */
        of(...items: number[]): Buffer;
        /**
         * Returns true if {obj} is a Buffer
         *
         * @param obj object to test.
         */
        isBuffer(obj: any): obj is Buffer;
        /**
         * Returns true if {encoding} is a valid encoding argument.
         * Valid string encodings in Node 0.12: 'ascii'|'utf8'|'utf16le'|'ucs2'(alias of 'utf16le')|'base64'|'binary'(deprecated)|'hex'
         *
         * @param encoding string to test.
         */
        isEncoding(encoding: string): boolean | undefined;
        /**
         * Gives the actual byte length of a string. encoding defaults to 'utf8'.
         * This is not the same as String.prototype.length since that returns the number of characters in a string.
         *
         * @param string string to test.
         * @param encoding encoding used to evaluate (defaults to 'utf8')
         */
        byteLength(string: string | DataView | ArrayBuffer, encoding?: string): number;
        /**
         * Returns a buffer which is the result of concatenating all the buffers in the list together.
         *
         * If the list has no items, or if the totalLength is 0, then it returns a zero-length buffer.
         * If the list has exactly one item, then the first item of the list is returned.
         * If the list has more than one item, then a new Buffer is created.
         *
         * @param list An array of Buffer objects to concatenate
         * @param totalLength Total length of the buffers when concatenated.
         *   If totalLength is not provided, it is read from the buffers in the list. However, this adds an additional loop to the function, so it is faster to provide the length explicitly.
         */
        concat(list: Uint8Array[], totalLength?: number): Buffer;
        /**
         * The same as buf1.compare(buf2).
         */
        compare(buf1: Uint8Array, buf2: Uint8Array): number;
        /**
         * Allocates a new buffer of {size} octets.
         *
         * @param size count of octets to allocate.
         * @param fill if specified, buffer will be initialized by calling buf.fill(fill).
         *    If parameter is omitted, buffer will be filled with zeros.
         * @param encoding encoding used for call to buf.fill while initalizing
         */
        alloc(size: number, fill?: string | Buffer | number, encoding?: string): Buffer;
        /**
         * Allocates a new buffer of {size} octets, leaving memory not initialized, so the contents
         * of the newly created Buffer are unknown and may contain sensitive data.
         *
         * @param size count of octets to allocate
         */
        allocUnsafe(size: number): Buffer;
        /**
         * Allocates a new non-pooled buffer of {size} octets, leaving memory not initialized, so the contents
         * of the newly created Buffer are unknown and may contain sensitive data.
         *
         * @param size count of octets to allocate
         */
        allocUnsafeSlow(size: number): Buffer;
        /**
         * This is the number of bytes used to determine the size of pre-allocated, internal Buffer instances used for pooling. This value may be modified.
         */
        poolSize: number;
    };
    /**
    * Any compatible Buffer instance.
    * This is a minimal stand-alone definition of a Buffer instance. The actual type is that exported by node's typings.
    */
    interface Buffer extends Uint8Array {
        constructor: typeof Buffer;
        write(string: string, offset?: number, length?: number, encoding?: string): number;
        toString(encoding?: string, start?: number, end?: number): string;
        toJSON(): { type: 'Buffer', data: any[] };
        equals(otherBuffer: Uint8Array): boolean;
        compare(otherBuffer: Uint8Array, targetStart?: number, targetEnd?: number, sourceStart?: number, sourceEnd?: number): number;
        copy(targetBuffer: Uint8Array, targetStart?: number, sourceStart?: number, sourceEnd?: number): number;
        slice(start?: number, end?: number): Buffer;
        writeUIntLE(value: number, offset: number, byteLength: number, noAssert?: boolean): number;
        writeUIntBE(value: number, offset: number, byteLength: number, noAssert?: boolean): number;
        writeIntLE(value: number, offset: number, byteLength: number, noAssert?: boolean): number;
        writeIntBE(value: number, offset: number, byteLength: number, noAssert?: boolean): number;
        readUIntLE(offset: number, byteLength: number, noAssert?: boolean): number;
        readUIntBE(offset: number, byteLength: number, noAssert?: boolean): number;
        readIntLE(offset: number, byteLength: number, noAssert?: boolean): number;
        readIntBE(offset: number, byteLength: number, noAssert?: boolean): number;
        readUInt8(offset: number, noAssert?: boolean): number;
        readUInt16LE(offset: number, noAssert?: boolean): number;
        readUInt16BE(offset: number, noAssert?: boolean): number;
        readUInt32LE(offset: number, noAssert?: boolean): number;
        readUInt32BE(offset: number, noAssert?: boolean): number;
        readInt8(offset: number, noAssert?: boolean): number;
        readInt16LE(offset: number, noAssert?: boolean): number;
        readInt16BE(offset: number, noAssert?: boolean): number;
        readInt32LE(offset: number, noAssert?: boolean): number;
        readInt32BE(offset: number, noAssert?: boolean): number;
        readFloatLE(offset: number, noAssert?: boolean): number;
        readFloatBE(offset: number, noAssert?: boolean): number;
        readDoubleLE(offset: number, noAssert?: boolean): number;
        readDoubleBE(offset: number, noAssert?: boolean): number;
        swap16(): Buffer;
        swap32(): Buffer;
        swap64(): Buffer;
        writeUInt8(value: number, offset: number, noAssert?: boolean): number;
        writeUInt16LE(value: number, offset: number, noAssert?: boolean): number;
        writeUInt16BE(value: number, offset: number, noAssert?: boolean): number;
        writeUInt32LE(value: number, offset: number, noAssert?: boolean): number;
        writeUInt32BE(value: number, offset: number, noAssert?: boolean): number;
        writeInt8(value: number, offset: number, noAssert?: boolean): number;
        writeInt16LE(value: number, offset: number, noAssert?: boolean): number;
        writeInt16BE(value: number, offset: number, noAssert?: boolean): number;
        writeInt32LE(value: number, offset: number, noAssert?: boolean): number;
        writeInt32BE(value: number, offset: number, noAssert?: boolean): number;
        writeFloatLE(value: number, offset: number, noAssert?: boolean): number;
        writeFloatBE(value: number, offset: number, noAssert?: boolean): number;
        writeDoubleLE(value: number, offset: number, noAssert?: boolean): number;
        writeDoubleBE(value: number, offset: number, noAssert?: boolean): number;
        fill(value: any, offset?: number, end?: number): this;
        indexOf(value: string | number | Uint8Array, byteOffset?: number, encoding?: string): number;
        lastIndexOf(value: string | number | Uint8Array, byteOffset?: number, encoding?: string): number;
        entries(): any;
        includes(value: string | number | Buffer, byteOffset?: number, encoding?: string): boolean;
        keys(): any;
        values(): any;
    }
    class StatusEnum {
        /**处于攻击状态 */
        public static readonly isAttacking;
        /**处于移动状态 */
        public static readonly isMoving;
        /**处于空闲状态 */
        public static readonly isIdle;
        /**属于地面单位 */
        public static readonly isOnGround;
        /**属于空中单位 */
        public static readonly isOnSky ;
        /**属于实体单位 */
        public static readonly isEntity;
        /**属于虚无单位 */
        public static readonly isNihility ;
        /**处于睡眠状态 */
        public static readonly isSleeping ;
        /**处于静态模式 */
        public static readonly isStatic ;
        /**处于死亡状态 */
        public static readonly isDeath ;
    }
    class SettlerEnum {
        public static readonly MUL ;
        public static readonly ADD ;
        public static readonly PUSH ;
        public static readonly POP ;
        public static readonly EQ ;
    }
    /**默认基础转换器 */
    class Settler<T> implements IOperate<T>{
        serial: number;
        parent: IParent<T>;
        index: number;

        private events: Array<(value: IValue<T>, old?: T) => void>;
        report(serial: number, value: IValue<T>, old: T, index: number[]);
        on(caller: any, listener: (value: IValue<T>, old?: T) => void);
        inspect(cache?: PropData<any>);
        //因为获取到数据时还没有结算完毕，所以需要在下一帧再进行回调
        emit(value: EventData<T>);
        /**监听所有子属性是否发生改变 */
        public change<T>(converter: number | Function, arr?: number[]): PropData<T>;
        value: T;

        /**默认的加法 */
        public add(value: T): IOperate<T>;
        public mul(value: T): IOperate<T>;
        public sub(value: T): IOperate<T>;
        public div(value: T): IOperate<T>;
        public eq(value: T): IOperate<T>;
        /**合并操作依据优先级进行，在处理异步的操作过程时，可以使用一个值作为优先级判定标准，一般推荐使用UUID值 */
        public merge(data: DataSettle<T>, cache?: PropData<T>);
        /**解析执行方法 */
        public execute(/**操作缓存数组 */cache: any);
        public init();
        constructor(value: T, index: number, parent: IParent<T>);
    }
    class BaseSettler<T> extends Settler<T>{
        /**实现加法的细节 */
        protected toAdd(a: T, b: T): T;
        protected toSub(a: T, b: T): T;
        /**实现乘法的细节 */
        protected toMul(a: T, b: T): T;
        protected toDiv(a: T, b: T): T;
        /**实现零值判断的细节 */
        protected isZero(v: T): boolean;
        /**实现一值判断的细节 */
        protected isOne(v: T): boolean;
        /**默认的加法 */
        public add(value?: T): IOperate<T>;
        /**默认的减法 */
        public sub(value?: T): IOperate<T>;
        /**默认的乘法 */
        public mul(value?: T): IOperate<T>;
        /**默认的除法 */
        public div(value?: T): IOperate<T>;
        public eq(value?: T): IOperate<T>;
        /**@see 这里负责处理统一的结算规则 */
        public merge(data: DataSettle<T>, cache?: PropData<T>);
        //执行操作缓存
        public execute(cache: PropData<T>);
    }
    class RootSettler<T extends RootObject<T>> extends Settler<T>{
        //结算
        settle(): DataSettle<T>;
        result(cache?: PropData<T>);
        publish(cache?: EventData<T>);
        event(): EventSettle<T>;
    }
    class OperateArray<T> extends Array<IOperate<T>> implements IOperateArray<T> {
        public serial: number;
        public parent: IParent<T>;
        public index: number;

        private events: Array<(value: IValue<T>, old?: T) => void>;
        report(serial: number, value: IValue<T>, old: T, index: number[]);
        on(caller: any, listener: (value: IValue<T>, old: T, index: number) => void);
        emit(value: EventData<T>);

        public add(value: T, index?: number): IOperateArray<T>;
        public remove(index: number): IOperateArray<T>;

        public change<T>(converter: number | Function, arr?: number[]): PropData<T>;
        public execute(cache?: any[]);
        public settle();
        public merge(data: DataSettle<T>, cache?: any[]);
    }
    /**
     * 技能属性，影响单位进行任务时的效率和一些任务的判定条件
     * 使用 @Code 标记需要序列化的属性，可以使用类的继承
     * 使用 @Attr 标记从属性列表中获取的值，可以使用类的继承
    */
    class BehaviorAttribute<T extends RootObject<T>> implements IBehavior<T> {
        /**更新周期，每次更新设置经过的时间修正常数，一般为1毫秒转换为秒的数值 */
        public static CONST_CTCLE;
        public root: RootSettler<T>;
        @Field(Boolean, "@isInit")
        public isInit: IOperate<boolean>;
        @Field(String, "@class")
        public class: IOperate<string>;

        @Status(StatusEnum.isDeath)
        isDeath: boolean;
        @Status(StatusEnum.isIdle)
        isIdle: boolean;
        /**每帧更新时 */
        public update(delta: number);
        /**数据初次构建时 */
        public init();
        /**数据转为对象时 */
        public enable();
        /**监听状态改变 */
        public on(stat: number, bool: boolean, caller: any, listener: Function);
    }
    /**
     * 结算属性
     */
    class PropData<T> {
        /**类型索引值 */
        public serial: number;
        /**缓存数据，索引值为操作码 */
        public cache: T[];
        /**详细细分的类型索引 */
        public detail: number[];
        /**子数据值，索引值为操作码 */
        public children: PropData<T>[];
        public clear();
        constructor(cls: Function);
        constructor(serial: number);
        constructor();
    }
    class EventData<T>{
        /**类型索引值 */
        public serial: number;
        public oldValue: T;
        public newValue: T;
        /**子数据值，索引值为操作码 */
        public children: EventData<T>[];
        public clear();
        constructor(cls: Function);
        constructor(serial: number);
        constructor();
    }
    /* 结算数据
     * 结算数据可以被序列化和反序列化
    */
    class DataSettle<T> {
        public data: PropData<T>;
        public serial: number;
        public index: number;
        constructor(data: DataSettle<T>, index: number, serial: number);
    }
    /* 结算数据
     * 结算数据可以被序列化和反序列化
    */
    class EventSettle<T> {
        public event: EventData<T>;
        public serial: number;
        public index: number;
        constructor(event: EventData<T>, index: number, serial: number);
    }

    /**默认基础转换器 */
    class Converter<T> implements IConverter<T>{
        public cls: new () => T;

        public to(writer: Writer, value: T);
        public from(reader: Reader, cls?: Function): T;
        /**
         * 默认的对象解析方法
        */
        public parse(value: T, cls?: Function): T;

        public json(value: T): string;
    }
    class SettleConverter<T> extends Converter<T> implements ISettleConverter<T>{
        public serial: number;
        //结算器
        public settler: (value: T, index?: number, parent?: IParent<T>) => IOperate<T>;
        /**
         * 解析方法并且封装在可结算外壳中
         * @param value json对象
         * @param cls 外壳封装类型
        */
        public parseShell(value: T, cls?: Function, index?: number, parent?: IParent<T>): IOperate<T>;
        public toShell(writer: Writer, value: IOperate<T>, cls?: Function);
        public fromShell(reader: Reader, cls?: Function, index?: number, parent?: IParent<T>): IOperate<T>;
        /**
         * 默认的JSON文本转换方法
        */
        public jsonShell(value: IOperate<T>): string;
    }
    /**基础类型转换规则 */
    class BaseConverter<T> extends SettleConverter<T>{ }
    /**根类型转换规则 */
    class RootConverter<T extends RootObject<T>> extends Converter<T>{ }
    class NumberAttribute {
        //属性名称
        @Field(String, "name")
        public name: IOperate<string>;
        //基础值
        @Field(Number, "base")
        public base: IOperate<number>;
        //百分比，按百分比增加或减少，均以Value为基数
        @Field(Number, "percent")
        public percent: IOperate<number>;
        //固定值，固定增加或减少的值，不参与百分比计算
        @Field(Number, "fixed")
        public fixed: IOperate<number>;
        //附加的值，增加或减少基础值，参与百分比计算
        @Field(Number, "addition")
        public addition: IOperate<number>;
        //是否能够为负值
        @Field(Boolean, "isNegative")
        public isPositive: IOperate<boolean>;
        //是否是一个整数
        @Field(Boolean, "isInteger")
        public isInteger: IOperate<boolean>;
        constructor();
        constructor(attr: NumberAttribute);
        /**获取计算结果值 */
        public readonly value: number;
    }
    /**可识别类型的对象类型 */
    class TypeObject {
        //标记的实体数据类型
        @Field(String, "@type")
        public type: IOperate<string>;
    }
    class StatusAttribute extends Number {

    }
    /**
     * 可编解码数据的根对象类型,可以使用@Code,@Attr,@Status,等标签直接获取被编码的数据
     * @example
     *   class A{
     *      @Field(Number, "x")
     *      x: number;
     *
     *      @Attr("abc")
     *      maxSpeed: DecimalAttribute;
     *
     *      @Status(StatusEnum.isIdel)
     *      isIdel : boolean;
     * 
     *      @Behav("bbb")
     *      bbb : Behavior;
     *   }
    */
    class RootObject<T extends RootObject<T>> extends TypeObject {
        /*全局属性列表**/
        @Field(NumberAttribute, "attributes", Array)
        public attributes: IOperateArray<NumberAttribute>;
        /*全局技能列表**/
        @Field(BehaviorAttribute, "behaviors", Array)
        public behaviors: IOperateArray<IBehavior<T>>;
        /*全局状态属性**/
        @Field(StatusAttribute, "status", Array)
        public status: IOperateArray<StatusAttribute>;
        /*每个根对象都有一个唯一的不可变序列号**/
        @Field(Number, "serial")
        public serial: IOperate<number>;
        /*每个根对象都有一个位于数组中的索引值**/
        @Field(Number, "index")
        public index: IOperate<number>;
        /**使用类构造函数或者名称获取技能 */
        public getBehavior<B extends IBehavior<T>>(name: string): B;
        public getBehavior<B extends IBehavior<T>>(cls: new () => B): B;

        public on(stat: number, bool: boolean, listener: (v: any) => void);
    }
    @Type("Token")
    export class Token{
        @Field(Number,"time")
        time:number;
    }
    @Type("AccessToken")
    export class AccessToken extends Token{
        /**获取到的凭证 */
        @Field(String,"access_token")
        access_token:string;
        /**凭证有效时间，单位：秒 */
        @Field(Number,"expires_in")
        expires_in:number;
    }
}