import { createProxyObjectFromTemplate } from './createProxyObjectFromTemplate';
import { IpcProxyConfig } from './IpcProxyConfig';


export function setupForTest<T, U>(config: IpcProxyConfig<T>, fn: (key: keyof T, fn: (...args: unknown[]) => unknown) => U): {
  [k in keyof T]: U;
} {
  const mock = createProxyObjectFromTemplate(config.template, fn);

  Object.defineProperty(window, config.window, { value: mock });
  return mock;
}
