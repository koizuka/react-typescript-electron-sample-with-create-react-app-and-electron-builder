import { contextBridge, ipcMain, ipcRenderer } from "electron";

/**
 * main processから呼ぶことで、ipcMainに目的のinterface Tを実装したクラスオブジェクトをハンドラとして登録する。
 * @param channel IPCのチャンネル。 createIpcRendererProxy の channel と同じであること。
 * @param target 目的のinterfaceを実装した処理クラスのインスタンス
 */
export function registerIpcMainHandler<T>(channel: string, target: T): void {
  const o = Object.getOwnPropertyNames(Object.getPrototypeOf(target))
    .filter(key => key !== 'constructor')
    .reduce<{ [key: string]: (...args: unknown[]) => unknown; }>((acc, cur) => {
      const t = target as unknown as { [key: string]: (...args: unknown[]) => unknown };
      if (typeof t[cur] === 'function') {
        acc[cur] = t[cur];
      }
      return acc;
    }, {});

  ipcMain.handle(channel, async (event, name: string, ...args: unknown[]) => {
    if (!o[name] === undefined) {
      throw new Error(`${name} is not a function`);
    }
    return o[name].apply(target, args);
  });
}

/**
 * 目的のinterface TからIPCを通じてmain側の実装を呼び出すproxyを生成する。preload.ts で contextBridge.exposeInMainWorld に与えること。
 * @param channel IPCのチャンネル。registerIpcMainHandler の channel と同じであること。
 * @param from 目的のinteface Tを実装したダミークラスのインスタンス
 * @returns contextBridge.exposeInMainWorld の第2引数に与えるオブジェクト
 */
export function createIpcRendererProxy<T>(channel: string, from: T): T {
  const o = Object.getOwnPropertyNames(Object.getPrototypeOf(from))
    .filter(key => key !== 'constructor')
    .reduce<{ [key: string]: (...args: unknown[]) => unknown }>((acc, cur) => {
      if (typeof (from as unknown as { [key: string]: unknown })[cur] === 'function') {
        acc[cur] = (...args: unknown[]) => ipcRenderer.invoke(channel, cur, ...args);
      }
      return acc;
    }, {});

  return o as unknown as T;
}

/**
 * オブジェクトを contextBridge に登録する。
 * @param name window に登録する名前。型は T と同じであること。
 * @param value Tの型を実装したオブジェクト。contextBridgeの制約に従うこと。
 */
export function exposeInMainWorld<T>(name: string, value: T): void {
  contextBridge.exposeInMainWorld(name, value);
}

/**
 * IPCで main process を呼び出すproxyを生成し、 contextBridge に登録する。
 * @param name window に登録する名前。型は T と同じであること。
 * @param channel IPC のチャンネル。createIpcRendererProxy の channel と同じであること。
 * @param mock Tの型を実装したダミークラスのインスタンス。
 */
export function exposeProxyInMainWorld<T>(name: string, channel: string, mock: T): void {
  exposeInMainWorld<T>(name, createIpcRendererProxy<T>(channel, mock));
}
