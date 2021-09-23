import { IpcProxyConfig } from './IpcProxyConfig';
import { createProxyObjectFromTemplate } from "./createProxyObjectFromTemplate";

type IpcMain = { handle: (channel: string, fn: (event: unknown, name: string, ...args: unknown[]) => unknown) => void }
type IpcRenderer = { invoke: (channel: string, ...args: unknown[]) => Promise<unknown> }

/**
 * main processから呼ぶことで、ipcMainに目的のinterface Tを実装したクラスオブジェクトをハンドラとして登録する。
 * @param channel IPCのチャンネル。 createIpcRendererProxy の channel と同じであること。
 * @param impl 目的のinterfaceを実装した処理クラスのインスタンス
 */
function registerIpcMainHandler<T>(ipcMain: IpcMain, channel: string, impl: T): void {
  const o = createProxyObjectFromTemplate(impl, (key, fn) => fn);

  ipcMain.handle(channel, async (event, name: string, ...args: unknown[]) => {
    if (o[name as keyof T] === undefined) {
      throw new Error(`${name} is not a function`);
    }
    return o[name as keyof T].apply(impl, args);
  });
}

/**
 * 目的のinterface TからIPCを通じてmain側の実装を呼び出すproxyを生成する。preload.ts で contextBridge.exposeInMainWorld に与えること。
 * @param channel IPCのチャンネル。registerIpcMainHandler の channel と同じであること。
 * @param from 目的のinteface Tを実装したダミークラスのインスタンス
 * @returns contextBridge.exposeInMainWorld の第2引数に与えるオブジェクト
 */
function createIpcRendererProxy<T>(ipcRenderer: IpcRenderer, channel: string, from: T): T {
  return createProxyObjectFromTemplate<T, unknown>(from, (cur) => (...args: unknown[]) => ipcRenderer.invoke(channel, cur, ...args)) as T;
}

export function setupForPreload<T>(config: IpcProxyConfig<T>, exposeInMainWorld: (apiKey: string, value: T) => void, ipcRenderer: IpcRenderer): void {
  exposeInMainWorld(config.window, createIpcRendererProxy<T>(ipcRenderer, config.IpcChannel, config.template));
}

export function setupForMain<T>(config: IpcProxyConfig<T>, ipcMain: IpcMain, impl: T): void {
  registerIpcMainHandler<T>(ipcMain, config.IpcChannel, impl);
}
