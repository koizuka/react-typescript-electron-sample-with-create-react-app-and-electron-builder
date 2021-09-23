import { MyAPI } from "../electron/@types/MyAPI";
import { IpcProxyConfig } from "./IpcProxy";

// TODO このダミー宣言なしで interfaceから直接生成できないかなぁ

class MyAPITemplate implements MyAPI {
  private dontCallMe = new Error("don't call me");

  openDialog(): Promise<void> { throw this.dontCallMe; }
}

export const MyAPIConfig: IpcProxyConfig<MyAPI> = {
  window: 'myAPI',
  IpcChannel: 'my-api',
  template: new MyAPITemplate(),
}