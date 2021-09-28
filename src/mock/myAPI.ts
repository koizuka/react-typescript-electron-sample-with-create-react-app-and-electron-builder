import { setupForTest } from "electron-testable-ipc-proxy";
import { MyAPIDescriptor } from "../MyAPIDescriptor";


export const myAPI = setupForTest(MyAPIDescriptor, () => jest.fn());