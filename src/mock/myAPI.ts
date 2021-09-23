import { setupForTest } from "../IpcProxy";
import { MyAPIConfig } from "../MyAPIConfig";


export const myAPI = setupForTest(MyAPIConfig, () => jest.fn());