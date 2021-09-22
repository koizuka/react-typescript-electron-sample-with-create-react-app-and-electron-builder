import { MyAPIConfig } from "../src/MyAPIConfig";
import { setupforPreload } from "../src/IpcProxy/setupForElectron";

// window.myAPI: MyAPI としてアクセス可能にする(global.d.tsに宣言を書くこと)
setupforPreload(MyAPIConfig);
