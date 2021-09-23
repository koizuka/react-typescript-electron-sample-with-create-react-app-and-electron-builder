import { MyAPIConfig } from "../src/MyAPIConfig";
import { setupForPreload } from "../src/IpcProxy";
import { contextBridge, ipcRenderer } from "electron";

// window.myAPI: MyAPI としてアクセス可能にする(global.d.tsに宣言を書くこと)
setupForPreload(MyAPIConfig, contextBridge.exposeInMainWorld, ipcRenderer);
