import { MyAPIConfig } from "../src/MyAPIConfig";
import { setupforPreload } from "../src/IpcProxy/setupForElectron";
import { contextBridge, ipcRenderer } from "electron";

// window.myAPI: MyAPI としてアクセス可能にする(global.d.tsに宣言を書くこと)
setupforPreload(MyAPIConfig, contextBridge.exposeInMainWorld, ipcRenderer);
