import { MyElement, MyJSX } from "./type";

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: {
      [key: string]: any;
    };
  }
  type Element = MyElement;
}

export type jsx = MyJSX;
export type jsxs = MyJSX;