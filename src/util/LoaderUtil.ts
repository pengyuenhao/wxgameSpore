import { Singleton } from "./Singleton";

    /**
     * 资源载入工具，内置一个初级的资源缓存方案，可以等价的执行静态加载方法或获取实例执行加载方法
     */
    export class LoaderUtil extends Singleton {
        public static Instance():LoaderUtil {
            return Singleton.getInstanceOrCreate(this);
        }
        /**重新定位的资源地址 */
        public static ResoucePath : string = "./test/resource/";
        /**
         * 资源载入静态方法，载入指定URL的数据
         * @param url 资源地址
         * @param type 类型
         * @param caller 执行域
         * @param success 成功回调
         * @param fail 失败回调
         * @param complete 完成回调
         * @param progress 载入过程
         */
        public static load(url: string, type: string, caller ? : any, success ? : Function, fail ? : Function, complete ? : Function, progress ? : Function){
            let ins = <LoaderUtil>(LoaderUtil.Instance());
            ins.loadUrl(url,type,caller,success,fail,complete,progress);
        }
        public static async loadRes<T>(url:string,type:string,caller?:any):Promise<T>{
            return (<LoaderUtil>(LoaderUtil.Instance())).loadRes<T>(url,type,caller);
        }
        /**
         * 卸载资源
         * @param url 资源地址 
         */
        public static unload(url:string){
            let ins = <LoaderUtil>(LoaderUtil.Instance());
            ins.unloadUrl(url);
        }

        private loaders: LoaderBinding[];
        private resBindingMap: Map < string, ResBinding > ;
        private waitLoadBindingArray: ResBinding[];
        //最多只允许有3个载入器
        private maxLoaderNum;
        onConstructor() {
            //所有地图共用一个纹理缓存字典
            this.resBindingMap = new Map < string, ResBinding > ();
            this.loaders = [];
            this.waitLoadBindingArray = [];
            this.maxLoaderNum = 3;
            for (let i = 0; i < this.maxLoaderNum; i++) {
                let binding = new LoaderBinding();
                binding.isLoading = false;
                binding.loader = new laya.net.Loader();
                binding.index = i;
                //监听载入器完成事件
                binding.loader.on("complete", this, (res) => {
                    this.onSuccess(binding, res);
                    this.onComplete(binding);
                });
                binding.loader.on("error", this, (err) => {
                    this.onFail(binding, err);
                    this.onComplete(binding);
                });
                binding.loader.on("progress", this, (value) => {
                    this.onProgress(binding, value);
                })
                this.loaders.push(binding);
            }
        }
        /**
         * 重新定位路径 
         * @param resPath
         * @param relativePath
         * @return
         * */
        public static repositionPath(resPath, relativePath: string): string {
            let tResultPath = "";
            tResultPath = resPath + relativePath;
            tResultPath = tResultPath.replace("//", "/");
            return tResultPath;
        }

        /**返回一个闲置的载入器,如果没有闲置的载入器则返回空值 */
        private getLoaderBinding(): LoaderBinding {
            for (let i = 0; i < this.loaders.length; i++) {
                //找到一个处于空闲状态的绑定器
                if (!this.loaders[i].isLoading) {
                    this.loaders[i].isLoading = true;
                    return this.loaders[i];
                }
            }
            return null;
        }
        /**
         * 载入指定URL的数据
         * @param url 资源地址
         * @param type 类型
         * @param success 成功回调
         * @param fail 失败回调
         * @param complete 完成回调
         * @param progress 载入过程
         */
        public loadUrl(url: string, type: string, caller ? : any, success ? : Function, fail ? : Function, complete ? : Function, progress ? : Function) {
            let resBinding: ResBinding;
            //如果存在对应的绑定状态
            if (this.resBindingMap.has(url)) {
                resBinding = this.resBindingMap.get(url);
                resBinding.overtime = 100;
                //检查是否已经完成载入
                if (resBinding.isComplete) {
                    //console.log("[缓存加载]" + url + "." + type);
                    if (resBinding.res) {
                        success.call(caller, resBinding.res);
                        return;
                    } else {
                        console.error("Failed to load resource: net::ERR_FILE_NOT_FOUND[" + url + "]")
                        fail.call(caller, null);
                        return;
                    }
                } else if (resBinding.isLoading) {
                    //console.log("[等待加载]" + url + "." + type);
                    //加入等待载入完成回调
                    if (success) {
                        resBinding.success.push((res) => {
                            success.call(caller, res);
                        });
                    }
                    if (fail) {
                        resBinding.fail.push((res) => {
                            //console.error(res)
                            fail.call(caller, null);
                        });
                    }
                    if (progress) {
                        resBinding.progress.push((res) => {
                            progress.call(caller, res);
                        });
                    }
                    return;
                } else {
                    //没有完成也没有在加载时
                }
            }
            if (this.resBindingMap.size > 100) {
                let removes = [];
                this.resBindingMap.forEach((value: ResBinding) => {
                    if (value.overtime > 0) {
                        value.overtime -= 1;
                    } else {
                        removes.push(value.url);
                    }
                });
                //移除超时的缓存
                for (let i = 0; i < removes.length; i++) {
                    this.resBindingMap.delete(removes[i]);
                }
            }
            //首次载入，创建绑定状态并启动载入过程
            resBinding = new ResBinding();
            resBinding.isComplete = false;
            resBinding.isLoading = true;
            resBinding.url = url;
            resBinding.type = type;
            resBinding.success = [];
            resBinding.fail = [];
            resBinding.complete = [];
            resBinding.progress = [];
            resBinding.overtime = 100;
            this.resBindingMap.set(url, resBinding);
            this.load(resBinding, caller, success, fail, complete, progress);
        }
        public async loadRes<T>(url : string,type:string,caller?):Promise<T>{
            let that = this;
            return await new Promise<T>((resolve)=>{
                that.loadUrl(url,type,caller,resolve,resolve);
            })
        }
        /**
         * 卸载资源
        */
        public unloadUrl(url:string){
            let resBinding: ResBinding;
            if (this.resBindingMap.has(url)) {
                //如果卸载之前依然存在等待中的调用
                if(resBinding.fail.length>0){
                    resBinding.fail.forEach((method)=>{
                        method();
                    })
                }
                if(resBinding.complete.length>0){
                    resBinding.complete.forEach((method)=>{
                        method();
                    })
                }
                resBinding.res = null;
                resBinding.caller = null;
                resBinding.success = null;
                resBinding.complete = null;
                resBinding.fail = null;
                resBinding.progress = null;
                resBinding.url = null;
                resBinding.isLoading = false;
                resBinding.type = null;
                this.resBindingMap.delete(url);
            }
        }
        //调用载入资源方法
        private load(resBinding, caller, success, fail, complete, progress) {
            if (success) {
                resBinding.success.push((res) => {
                    success.call(caller, res);
                });
            }
            if (fail) {
                resBinding.fail.push((err) => {
                    fail.call(caller, err);
                });
            }
            if (progress) {
                resBinding.progress.push((value) => {
                    progress.call(caller, value);
                });
            }
            //获取一个闲置的载入器
            let binding: LoaderBinding = this.getLoaderBinding();
            //如果不是空值
            if (binding) {
                binding.isLoading = true;
                binding.url = resBinding.url;
                binding.time = Date.now();
                //载入对应的资源，直到完成载入前都将处于不可用状态
                binding.loader.load(resBinding.url, resBinding.type, false, null, false);
            } else {
                //暂时没有可用的载入器时，将绑定状态缓存进等待队列中
                this.waitLoadBindingArray.push(resBinding);
            }
        }
        //完成资源载入时
        private onSuccess(binding: LoaderBinding, res: any) {
            let resBinding = this.resBindingMap.get(binding.url);
            if(!resBinding)return;
            //console.log("[加载完成]" + binding.url + "." + binding.type);
            resBinding.res = res;

            //执行所有等待完成的方法
            resBinding.success.forEach(method => {
                if (method) method(res);
            });
        }
        private onProgress(binding: LoaderBinding, value: number) {
            let resBinding = this.resBindingMap.get(binding.url);
            if(!resBinding)return;
            //执行所有等待完成的方法
            resBinding.progress.forEach(method => {
                if (method) method(value);
            });

            resBinding.complete
        }
        //载入资源失败时
        private onFail(binding: LoaderBinding, err: any) {
            let resBinding = this.resBindingMap.get(binding.url);
            if(!resBinding)return;
            resBinding.res = null;

            //console.error(err);
            //执行所有等待完成的方法
            resBinding.fail.forEach(method => {
                if (method) method(null);
            });
        }
        private onComplete(binding: LoaderBinding) {
            let resBinding = this.resBindingMap.get(binding.url);
            if(resBinding){
                resBinding.isComplete = true;
                resBinding.isLoading = false;
                //执行所有等待完成的方法
                resBinding.complete.forEach(method => {
                    if (method) method();
                });
                //清空等待数组
                resBinding.success.length = 0;
                resBinding.fail.length = 0;
                resBinding.complete.length = 0;
                resBinding.progress.length = 0;

                if (resBinding.res == null || resBinding.res == undefined) {
                    //移除无效的资源绑定
                    this.resBindingMap.delete(resBinding.url);
                }
            }

            binding.isLoading = false;
            binding.time = Date.now() - binding.time;

            //console.log("[I]"+binding.index+"[加载完成]"+resBinding.url +","+ (resBinding.res ? true : false) + "," + binding.time);
            //直到没有可以抽取的值为止
            while(this.waitLoadBindingArray.length>0){
                //抽取一个需要加载的绑定状态
                resBinding = this.waitLoadBindingArray.shift();
                if (resBinding) {
                    binding.isLoading = true;
                    binding.url = resBinding.url;
                    binding.time = Date.now();
                    binding.loader.load(resBinding.url, resBinding.type, false, null, false);
                    break;
                }
            }
        }
    }
    //资源缓存绑定
    class ResBinding {
        time: number;
        //资源长期未被使用时会被移除缓存
        overtime: number;
        //等待加载成功后执行的回调函数
        success: Function[];
        //等待加载失败后执行的回调函数
        fail: Function[];
        //等待加载完成后执行的回调函数
        complete: Function[];
        //加载过程中执行的回调函数
        progress: Function[];
        //调用者
        caller: any;
        //资源地址
        url: string;
        //资源类型
        type: string;
        //纹理缓存
        res: any;
        //正在载入中
        isLoading: boolean;
        //已经完成载入
        isComplete: boolean;
    }
    //加载器绑定
    class LoaderBinding {
        //序号
        public index: number;
        //载入器
        public loader: laya.net.Loader;
        //正在载入中
        public isLoading: boolean;
        //正在载入的URL
        public url: string;
        //载入资源消耗的时间
        public time: number;
    }