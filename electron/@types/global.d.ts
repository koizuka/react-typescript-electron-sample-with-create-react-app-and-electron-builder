import { MyAPI } from "./MyAPI";

declare global {
  interface Window {
    myAPI: MyAPI;
  }
}
