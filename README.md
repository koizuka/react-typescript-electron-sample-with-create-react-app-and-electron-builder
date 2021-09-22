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

### registerIpcMainHandler
```typescript
registerIpcMainHandler<T>(channel: string, target: T): void
```
* main.ts で、BrowserWindowのページをロードする前に実行すること。
* channelとTはpreload側と一致させること。
* targetは処理の実装をしたクラスインスタンス。

### exposeProxyInMainWorld
```typescript
exposeProxyInMainWorld<T>(name: string, channel: string, mock: T): void
``` 
* preload.ts で実行すること。
* nameは global objectの `window` に登録する名前。render processからは `window`.*name* でT型のオブジェクトとして参照できるようになる。
* channelとTはmain側と一致させること。
* mockはTの関数を実装しただけのテンプレートとなるインスタンスを与えること。名前を抽出するだけに使っているため、中身は呼ばれない。
  
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

* electron/preload.ts
```typescript
import { MyAPI } from "./@types/MyAPI";
import { exposeProxyInMainWorld } from './IpcProxy';
import { MyAPITemplate } from "./MyAPITemplate";

exposeProxyInMainWorld<MyAPI>('myAPI', 'my-api', new MyAPITemplate());
```

* electron/MyAPITemplate.ts
```typescript
import { MyAPI } from "./@types/MyAPI";

export class MyAPITemplate implements MyAPI {
  private dontCallMe = new Error("don't call me");

  openDialog(): Promise<void> { throw this.dontCallMe; }
}
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

  registerIpcMainHandler<MyAPI>('my-api', myApi);
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

* src/App.test.tsx
```typescript
import { myAPI } from './mock/myAPI';

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
    * preload.ts - exposeInMainWorld MyAPI
    * MyAPITemplate.ts - used by `IpxProxy` and mocks
* src/
    * mock/
        * myAPI.ts - test mock for `MyAPI`
    * App.tsx - add usage of `MyAPI.openDialog`
    * App.test.tsx - add tests for above
    * createProxyObjectFromTemplate.ts - used by `IpcProxy` and mocks
    * createProxyObjectFromTemplate.test.ts

## memo
現在は MyAPITemplate で手で必要なメソッドの名前を持つダミーを並べないといけないが interface から自動生成したい。
しかし、create-react-app だと TypeScriptに transformer などを差し込む方法が見あたらない。
