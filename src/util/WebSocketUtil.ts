import { Singleton } from "./Singleton";

export class WebSocketUtil extends Singleton {
    private ws: WebSocket;
    private isClose: boolean;


    private clsBindingMap: Map<number, ClassBinding>;
    /**获取一个自增的序号 */
    private get index() {
        if (this.time == -1) {
            this.time = 0;
        } else {
            this.time += 1;
        }
        return this.time;
    };
    private time: number;
    //上一次统计的时间
    private lastStatTime: number;
    //网络数据流量
    private downLoadNetflow: number;
    private upLoadNetflow: number;
    /**获取从上一次获取以来平均每秒的网络流量消耗，单位是Kb/s */
    public get Netflow(): { down: number, up: number } {
        let delta = Date.now() - this.lastStatTime;
        let value = {
            down: Math.round((9.765625 * this.downLoadNetflow / delta)) / 10,
            up: Math.round((9.765625 * this.upLoadNetflow / delta)) / 10
        }
        this.downLoadNetflow = 0;
        this.upLoadNetflow = 0;
        this.lastStatTime = Date.now();
        return value;
    }
    protected onConstructor() {
        this.time = 0;
        this.isClose = true;

        this.clsBindingMap = new Map();

        this.lastStatTime = Date.now();
        this.upLoadNetflow = 0;
        this.downLoadNetflow = 0;
    }
    public static Instance(): WebSocketUtil {
        return Singleton.getInstanceOrCreate(this);
    }

    public connect(address: string | string[], port: number | number[]): Promise<any> {
        let that = this;
        return new Promise((resolve) => {
            let addr;
            let pt;
            let addrCount;
            let portCount;
            //检查地址是否为数组
            if (Array.isArray(address)) {
                addr = address[0];
                addrCount = 0;
            } else {
                addr = address;
                addrCount = -1;
            }
            //检查端口是否为数组
            if (Array.isArray(port)) {
                pt = port[0];
                portCount = 0;
            } else {
                pt = port;
                portCount = -1;
            }
            //递归函数
            let tryConnect = function () {
                //尝试使用备用地址
                if (portCount >= 0 && portCount < (<any>port).length) {
                    pt = port[portCount];
                    addr = address[addrCount];
                    if (pt === 443) {
                        that.ws = new WebSocket("wss://" + addr + ":" + pt);
                    } else {
                        that.ws = new WebSocket("ws://" + addr + ":" + pt);
                    }
                    that.ws.binaryType = "arraybuffer";
                    that.ws.onerror = tryConnect;
                    that.ws.onopen = (e) => {
                        that.isClose = false;
                        resolve(true);
                    }
                    that.ws.onclose = that.CallbackClose.bind(that);
                    that.ws.onmessage = that.CallbackMessage.bind(that);
                    //查找可用地址和端口
                    if (addrCount >= 0 && addrCount < address.length - 1) {
                        addrCount += 1;
                    } else {
                        addrCount = 0;
                        portCount += 1;
                    }
                } else {
                    console.error("[链接失败]");
                    that.ws.close();
                    that.ws = null;
                    resolve(false);
                }
            }
            //开始尝试链接
            tryConnect();
        })
    }


    private CallbackClose(event) {
        this.isClose = true;
        console.error("[链接已经断开]");
    }

    private CallbackMessage(event: MessageEvent) {
        let data = event.data;
        if (data == null) {
            return;
        }
        if (typeof data == "string") {
            console.log("[接收消息]" + data);
            return;
        }
        //解包
        let info: PackInfo = new PackInfo();
        let buffer = new Uint8Array(event.data);
        let reader = PackInfo.unpack(buffer, info);
        //记录下载字节数
        this.downLoadNetflow += buffer.byteLength;
        let converter = field.GetConverter(info.serial);
        let binding = this.getBinding(info.type);
        if (binding != null) {
            let decoded = converter.from(reader,converter.cls);
            let len = binding.onMessageArr.length;
            for (let i = 0; i < len; i++) {
                binding.onMessageArr[i].call(this, decoded, event.target, info.index);
            }
            //单次执行的监听
            len = binding.onceMessageArr.length;
            for (let i = 0; i < len; i++) {
                binding.onceMessageArr[i].call(this, decoded, event.target, info.index);
            }
            binding.onceMessageArr.length = 0;
            len = binding.onRequestBindingArr.length;
            for (let i = 0; i < len; i++) {
                let request = binding.onRequestBindingArr[i];
                //如果收到的包是请求发出的特征包
                if (request && request.index == info.reply) {
                    request.method.call(this, decoded, event.target);
                    if (request.isOnce) {
                        //移除仅执行一次的值
                        binding.onRequestBindingArr[i] = null;
                        //记录被移除的值
                        binding.onRequestRemoveArr.push(i);
                    }
                    //已经找到正确的序号
                    break;
                }
            }
        }
    }
    public listen<T>(cls: new (...any: any[]) => T, callback: (data: T, ws: WebSocket, index: number) => void, isOnce: boolean = false, isRequest: boolean = false) {
        let serial = field.GetSerial(cls);
        let binding = this.getBinding(serial);
        //是否为一个请求
        if (isRequest) {
            let index;
            let request = new RequestBinding();
            request.method = callback;
            request.overtime = 10;
            request.isOnce = isOnce;
            //如果有空位
            if (binding.onRequestRemoveArr.length > 0) {
                index = binding.onRequestRemoveArr.pop();
                binding.onRequestBindingArr[index] = request;
            } else {
                binding.onRequestBindingArr.push(request);
            }
            return request;
        } else {
            //是否只执行一次
            if (isOnce) {
                binding.onceMessageArr.push(callback);
            } else {
                binding.onMessageArr.push(callback);
            }
            return null;
        }
    }

    public send(data: any, response?: ResponseBinding, ws?: WebSocket) {
        //不发送未处于开发状态的接口
        if (this.ws.OPEN == 0 || this.isClose) {
            return null;
        }
        let serial :number;
        let type: number;
        let reply: number;
        let index = this.index;
        //如果未指定序列号时
        if (!response) {
            //-1表示不需要回复
            reply = -1;
            type = field.GetSerialByValue(data);
            serial = type;
        } else {
            type = response.type
            reply = response.index;
            serial = response.serial;
        }

        let info = new PackInfo();
        info.index = index;
        info.type = type;
        info.reply = reply;
        info.serial = serial;

        let converter = field.GetConverter(serial);

        let buffer: Uint8Array;
        let writer = PackInfo.pack(info);
        if (data != null) {
            converter.to(writer, data, converter.cls);
        }
        buffer = writer.finish();
        //let decode = binding.type.decode(buffer.slice(5));
        try {
            if (!ws) {
                this.ws.send(buffer);
            } else {
                ws.send(buffer);
            }
            this.upLoadNetflow += buffer.byteLength;
        } catch (ex) {
            console.error(ex);
        }

        //记录上传字节数
        this.upLoadNetflow += buffer.byteLength;
        //console.log("[发出消息]"+this._time+"[S]"+this._serial);
        return info;
    }
    /**
    * 请求数据
    */
    public request<T>(cls: new (...any: any[]) => T, token: any, isOnce: boolean = true): Promise<T> {
        let that = this;
        //如果回调无效则不创建
        return new Promise<T>((resolve) => {
            let binding: RequestBinding;
            let info: PackInfo;
            let type = field.GetSerial(cls);
            let serial = field.GetSerialByValue(token);
            //这里使用指定的序列号和时间来发送
            let response = <ResponseBinding>{
                //标记不是回复信息
                index: -1,
                type: type,
                serial:serial
            }
            //Raven.captureMessage("[R]"+CONST_RAND+"[建立发送请求]");
            //如果数据发送失败则直接返回请求失败
            info = that.send(token, response);
            if (info) {
                binding = that.listen(cls, resolve, isOnce, true);
                binding.index = info.index;
            } else {
                resolve(null);
            }
        })
    }
    public response<T>(cls: new (...any: any[]) => T, callback: (token: any, reply: (result: T) => void, ws?: WebSocket) => void) {
        let that = this;
        this.listen(cls, (data, ws, index) => {
            callback(data, (result) => {
                //根据回复的数据类型指定序列值
                let type = field.GetSerial(cls);
                let serial = field.GetSerialByValue(result);
                //这里使用指定的序列号和时间来发送
                let response = <ResponseBinding>{
                    index: index,
                    type: type,
                    serial:serial
                }
                //console.log("[发送]"+time + "[S]" + serial + "[R]"+(result?result.toString?result.toString():result:result));
                that.send(result, response, ws);
            }, ws);
        });
    }
    getBinding(serial: number): ClassBinding {
        let binding = this.clsBindingMap.get(serial);
        if (binding == null) {
            let cls = field.GetCtor(serial);
            let name = field.GetType(serial);
            let converter = field.GetConverter(serial);
            binding = new ClassBinding();
            binding.onMessageArr = [];
            binding.onceMessageArr = [];
            binding.onRequestBindingArr = [];
            binding.onRequestRemoveArr = [];
            binding.name = name;
            binding.serial = serial;
            binding.cls = cls;
            binding.converter = converter;
            this.clsBindingMap.set(serial, binding);
        }
        return binding;
    }
}
class ResponseBinding {
    public index: number;
    public type: number;
    public serial:number;
}
class RequestBinding {
    public method: ((data: any, ws: WebSocket, index: number) => void);
    public isOnce: boolean;
    public index: number;
    public overtime: number;
}
class ClassBinding {
    public onRequestBindingArr: RequestBinding[];
    public onRequestRemoveArr: number[];
    //每次
    public onMessageArr: ((data: any, ws: WebSocket, serial: number, time: number) => void)[];
    //单次
    public onceMessageArr: ((data: any, ws: WebSocket, serial: number, time: number) => void)[];
    public name: string;
    public serial: number;
    public cls: new (...any: any[]) => any;
    public converter: field.IConverter<any>;
}

/**
 * 封包信息
 */
class PackInfo {
    /**发送数据的索引值，远端回复数据时使用该值标记 */
    public index: number;
    /**回复数据的索引值，远端解析数据时使用该标记 */
    public reply: number;
    /**数据的类型序列值，解析时使用该标记查找路由 */
    public type: number;
    /**编码器类型序列值, 编码和解码时使用的规则 */
    public serial: number;
    public static pack(info: PackInfo): field.Writer {
        let writer: field.Writer = field.Writer.create();
        writer.int32(info.type);
        writer.int32(info.index);
        writer.int32(info.serial);
        writer.sint32(info.reply);
        return writer;
    }
    public static unpack(data: Uint8Array, info: PackInfo): field.Reader {
        let reader = new field.Reader(data);
        info.type = reader.int32();
        info.index = reader.int32();
        info.serial = reader.int32();
        info.reply = reader.sint32();
        return reader;
    }
}