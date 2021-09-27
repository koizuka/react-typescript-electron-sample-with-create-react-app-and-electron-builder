React-TypeScript-Electron sample with Create React App and Electron Builder
===========================================================================

Forked from https://github.com/yhirose/react-typescript-electron-sample-with-create-react-app-and-electron-builder.

MyAPI.openDialog is from https://github.com/sprout2000/electron-react-ts.

## Introduction
2021/9/22 現在,  Electron 14 には対応する Spectron が無いので、Spectronなしに test をなるべく書ける環境が欲しくて探したところ、 create-react-app の利便性をそのままに Electron を開発できる作品を見つけた。しかし contextBridge を介して main process と通信する仕組みがあるコードをテストする方法が提供されていなかったので、その機能を [electron-testable-ipc-proxy](https://www.npmjs.com/package/electron-testable-ipc-proxy) として作って、それを使うようにした。

## Changes from upstream
* [electron-testable-ipc-proxy](https://www.npmjs.com/package/electron-testable-ipc-proxy)を使ってIPC Proxyを作成し、 global `window` に注入。テスト用のmockも提供する。デモ用に `MyAPI.openDialog` を定義。
* use npm-run-all in `yarn electron:dev`.

## Added/modified files
* electron/
    * @types/
        * global.d.ts - declare `myAPI` object in global `window` object
        * MyAPI.d.ts - declaration of `MyAPI`
    * main.ts - `MyAPIServer` to implement `MyAPI`
    * preload.ts - setupForPreload(MyAPIDescriptor)
    * MyAPITemplate.ts - used by `IpxProxy` and mocks
* src/
    * mock/
        * myAPI.ts - test mock for `MyAPI`
    * MyAPIDescriptor.ts - IpcProxyDescriptor of `MyAPI`
    * App.tsx - add usage of `MyAPI.openDialog`
    * App.test.tsx - add tests for above
