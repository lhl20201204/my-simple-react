import { MyElement, MyElementType, MyJSX } from "./type";

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

  interface ElementClass {
    render(): Element;
  }

  interface ElementAttributesProperty {
    props: {};
  }

  interface ElementChildrenAttribute {
    children: {};
  }
}

export type jsx = MyJSX;
export type jsxs = MyJSX;