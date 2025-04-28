import * as React from "./React";
import * as ReactDOM from "./ReactDom";

declare namespace JSX {
  interface IntrinsicElements {
    div: {
      key?: any;
      ref?: any;
      children?: any;
      [key: string]: any;
    }
    // 可以根据需要添加其他 HTML 元素
  }
}
export default React;
export { React, ReactDOM };