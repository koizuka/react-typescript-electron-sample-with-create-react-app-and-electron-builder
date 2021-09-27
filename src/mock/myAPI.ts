import { setupForTest } from "electron-testable-ipc-proxy";
import { MyAPIDiscriptor } from "../MyAPIDiscriptor";


export const myAPI = setupForTest(MyAPIDiscriptor, () => jest.fn());