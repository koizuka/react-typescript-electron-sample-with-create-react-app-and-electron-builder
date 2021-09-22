import { setupforTest } from "../IpcProxy/setupforTest";
import { MyAPIConfig } from "../MyAPIConfig";


export const myAPI = setupforTest(MyAPIConfig, () => jest.fn());