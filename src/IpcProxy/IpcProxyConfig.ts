
export type IpcProxyConfig<T> = {
  window: string;
  IpcChannel: string;
  template: T;
};
