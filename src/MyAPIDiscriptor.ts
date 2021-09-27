import { MyAPI } from "../electron/@types/MyAPI";
import { IpcProxyDiscriptor } from "electron-testable-ipc-proxy";

// TODO このダミー宣言なしで interfaceから直接生成できないかなぁ

class MyAPITemplate implements MyAPI {
  private dontCallMe = new Error("don't call me");

  openDialog(): Promise<never> { throw this.dontCallMe; }
}

export const MyAPIDiscriptor: IpcProxyDiscriptor<MyAPI> = {
  window: 'myAPI',
  IpcChannel: 'my-api',
  template: new MyAPITemplate(),
}