import { MyElement, MyJSX } from "./type";

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: {
      [key: string]: any;
    };
  }
  type Element = MyElement;

  interface IntrinsicAttributes {
    key?: string | number;
  }
}

export type jsx = MyJSX;
export type jsxs = MyJSX;