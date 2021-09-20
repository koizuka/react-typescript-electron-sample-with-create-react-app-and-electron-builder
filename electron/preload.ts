import { MyAPI } from "./@types/MyAPI";
import { exposeProxyInMainWorld } from './IpcProxy';

// TODO このダミー宣言なしで interfaceから直接生成できないかなぁ
class MyAPIMock implements MyAPI {
  private dontCallMe = new Error("don't call me");

  openDialog(): Promise<void> { throw this.dontCallMe; }
};

// window.myAPI: MyAPI としてアクセス可能にする(global.d.tsに宣言を書くこと)
exposeProxyInMainWorld<MyAPI>('myAPI', 'my-api', new MyAPIMock());
