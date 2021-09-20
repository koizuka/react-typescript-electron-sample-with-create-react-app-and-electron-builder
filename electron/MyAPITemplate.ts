import { MyAPI } from "./@types/MyAPI";

// TODO このダミー宣言なしで interfaceから直接生成できないかなぁ

export class MyAPITemplate implements MyAPI {
  private dontCallMe = new Error("don't call me");

  openDialog(): Promise<void> { throw this.dontCallMe; }
}
