import { MyAPI } from "./@types/MyAPI";
import { exposeProxyInMainWorld } from './IpcProxy';
import { MyAPITemplate } from "./MyAPITemplate";

// window.myAPI: MyAPI としてアクセス可能にする(global.d.tsに宣言を書くこと)
exposeProxyInMainWorld<MyAPI>('myAPI', 'my-api', new MyAPITemplate());
