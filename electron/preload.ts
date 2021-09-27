import { MyAPIDiscriptor } from "../src/MyAPIDiscriptor";
import { setupForPreload } from "electron-testable-ipc-proxy";
import { contextBridge, ipcRenderer } from "electron";

// window.myAPI: MyAPI としてアクセス可能にする(global.d.tsに宣言を書くこと)
setupForPreload(MyAPIDiscriptor, contextBridge.exposeInMainWorld, ipcRenderer);
