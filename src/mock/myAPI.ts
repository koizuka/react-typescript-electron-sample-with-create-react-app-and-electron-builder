import { MyAPI } from "../../electron/@types/MyAPI";
import { MyAPITemplate } from "../../electron/MyAPITemplate";
import { createProxyObjectFromTemplate } from "../createProxyObjectFromTemplate";


export const myAPI = createProxyObjectFromTemplate(new MyAPITemplate() as MyAPI, () => jest.fn());

Object.defineProperty(window, 'myAPI', { value: myAPI });
