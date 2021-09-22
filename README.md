React-TypeScript-Electron sample with Create React App and Electron Builder
===========================================================================

Forked from https://github.com/yhirose/react-typescript-electron-sample-with-create-react-app-and-electron-builder.

MyAPI.openDialog is from https://github.com/sprout2000/electron-react-ts.

## Introduction
2021/9/22 現在,  Electron 14 には対応する Spectron が無いので、Spectronなしに test をなるべく書ける環境が欲しくて探したところ、 create-react-app の利便性をそのままに Electron を開発できる作品を見つけた。しかし contextBridge を介して main process と通信する仕組みがあるコードをテストする方法が提供されていなかったので、その機能を追加した。

## Changes from upstream
* 簡単な定義で main processで実行する関数群を中継するオブジェクトを global `window` などに注入できるようにする IpcProxy を追加。テスト用のmockも提供する。デモ用に `MyAPI.openDialog` を定義。
* use npm-run-all in `yarn electron:dev`.

## API in IpcProxy

interface T で定義したインターフェイスを preload -> main としてIPCで中継する仕組みを提供する。
main側で定義した実装を、preload側から呼べるようになる。
中継したメソッドの戻り値は必ずPromiseになる。

`IpcProxyConfig<T>` オブジェクトとして設定を定義し、 `setupForMain`, `setupForPreload`, `setupForTest` にそれぞれ与えることで同じ T を扱うことができるようになる。

### IpcProxyConfig
```typescript
import { IpcProxyConfig } from "./IpcProxy/IpcProxyConfig";

type IpcProxyConfig<T> = {
  window: string;
  IpcChannel: string;
  template: T;
};
```
IpcProxy共通の設定を定義する。
* T には上記 interface Tを与える。
* `window` に global object `window` に注入する名前を定義する。
* `IpcChannel` に main process <-> renderer process でIPC通信するときのチャンネル名を定義する。
* `template` に、interface Tの関数をダミー実装したclassの実体を与える。
### setupForMain
```typescript
import { setupForMain } from '../src/IpcProxy/setupForElectron';

function setupforMain<T>(config: IpcProxyConfig<T>, impl: T): void
```
* main process で、BrowserWindowのページをロードする前に実行すること。
* impl に T の実際の処理を提供するクラスのインスタンスを与える。IPCの config.IpcChannelを通して rendererプロセスから呼び出される。

### setupForPreload
```typescript
import { setupForPreload } from '../src/IpcProxy/setupForElectron';

function setupforPreload<T>(config: IpcProxyConfig<T>): void
```
* renderer processの preload モジュールから実行すること。
* Tの各メソッドを IPC の config.IpcChannel を通してproxyするオブジェクトを config.window で定義した名前で global window オブジェクトに注入する。
* rendererのページからは window.*(config.window)* という名前でアクセスできる。
### setupForTest
```typescript
import { setupForTest } from './IpcProxy/setupForTest';

function setupforTest<T, U>(config: IpcProxyConfig<T>, fn: (key: keyof T, fn: (...args: unknown[]) => unknown) => U): {
  [k in keyof T]: U;
}
```
* create-react-test の test内から、テストの対象より先にimportするモジュールで実行すること。
* Tのインターフェイスのすべてのメソッドを引数 fn が返す関数で差し替えてモックにして、global window.*(config.window)* に注入することでターゲットコードからmockを呼び出すようにセットアップする。
* 同時に、これで作ったオブジェクトをT型ではなくmock型を保持した型として返すため、テストコードからはこちらを使う事でmock関数のメソッドを使うことができる。
  
## Example code

* electron/@types/MyAPI.d.ts
```typescript
export interface MyAPI {
  openDialog: () => Promise<void | string[]>;
}
```

* electron/@types/global.d.ts
```typescript
import { MyAPI } from "./MyAPI";

declare global {
  interface Window {
    myAPI: MyAPI;
  }
}
```

* src/MyAPIConfig.ts
```typescript
class MyAPITemplate implements MyAPI {
  private dontCallMe = new Error("don't call me");

  openDialog(): Promise<void> { throw this.dontCallMe; }
}

export const MyAPIConfig: IpcProxyConfig<MyAPI> = {
  window: 'myAPI',
  IpcChannel: 'my-api',
  template: new MyAPITemplate(),
}
```

* electron/preload.ts
```typescript
setupforPreload(MyAPIConfig);
```

* electron/main.ts
```typescript
class MyApiServer implements MyAPI {
  constructor(readonly mainWindow: BrowserWindow) {
  }

  async openDialog() {
    const dirPath = await dialog
      .showOpenDialog(this.mainWindow, {
        properties: ['openDirectory'],
      })
      .then((result) => {
        if (result.canceled) return;
        return result.filePaths[0];
      })
      .catch((err) => console.log(err));

    if (!dirPath) return;

    return fs.promises
      .readdir(dirPath, { withFileTypes: true })
      .then((dirents) =>
        dirents
          .filter((dirent) => dirent.isFile())
          .map(({ name }) => path.join(dirPath, name)),
      );
  }
};
...
  const myApi = new MyApiServer(win);
  setupforMain(MyAPIConfig, myApi);
```

* src/App.tsx
```tsx
const { myAPI } = window;

function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [buttonBusy, setButtonBusy] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
         ...
        <button disabled={buttonBusy} onClick={async () => {
          setButtonBusy(true);
          const files = await myAPI.openDialog();
          if (Array.isArray(files)) {
            setFiles(files);
          } else {
            setFiles([]);
          }
          setButtonBusy(false);
        }} data-testid="open-dialog">open dialog</button>
        <ul>
          {files.map((file, index) => (
            <li key={file} data-testid={`file${index}`}>{file}</li>
          ))}
        </ul>
      </header>
    </div>
  );
}
```

* src/mock/myAPI.ts
```typescript
export const myAPI = setupforTest(MyAPIConfig, () => jest.fn());
```

* src/App.test.tsx
```typescript
import { myAPI } from './mock/myAPI';
import App from './App';

test('open files when button clicked', async () => {
  myAPI.openDialog.mockResolvedValue(['file1.txt', 'file2.txt']);
  render(<App />);

  const button = screen.getByTestId('open-dialog');
  expect(button).toBeInTheDocument();
  expect(button.innerHTML).toBe('open dialog');

  expect(button).toBeEnabled();
  fireEvent.click(button);
  expect(button).toBeDisabled();

  await waitFor(() => screen.getByTestId('file0'));

  expect(myAPI.openDialog).toHaveBeenCalled();

  expect(screen.getByTestId('file0')).toHaveTextContent('file1.txt');
  expect(screen.getByTestId('file1')).toHaveTextContent('file2.txt');
  expect(screen.queryByTestId('file2')).toBeNull();
});
```

## Added/modified files
* electron/
    * @types/
        * global.d.ts - declare `myAPI` object in global `window` object
        * MyAPI.d.ts - declaration of `MyAPI`
    * main.ts - `MyAPIServer` to implement `MyAPI`
    * preload.ts - setupForPreload(MyAPIConfig)
    * MyAPITemplate.ts - used by `IpxProxy` and mocks
* src/
    * IpcProxy/
        * createProxyObjectFromTemplate.ts - used by `IpcProxy` and mocks
        * createProxyObjectFromTemplate.test.ts
        * IpcProxyConfig.ts
        * setupForElectron.ts
        * setupForTest.ts
    * mock/
        * myAPI.ts - test mock for `MyAPI`
    * MyAPIConfig.ts - IpcProxyConfig of `MyAPI`
    * App.tsx - add usage of `MyAPI.openDialog`
    * App.test.tsx - add tests for above

## memo
現在は MyAPITemplate で手で必要なメソッドの名前を持つダミーを並べないといけないが interface から自動生成したい。
しかし、create-react-app だと TypeScriptに transformer などを差し込む方法が見あたらない。
