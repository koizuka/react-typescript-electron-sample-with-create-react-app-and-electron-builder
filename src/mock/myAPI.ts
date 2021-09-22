import { setupForTest } from "../IpcProxy/setupforTest";
import { MyAPIConfig } from "../MyAPIConfig";


export const myAPI = setupForTest(MyAPIConfig, () => jest.fn());