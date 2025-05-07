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
  interface ElementAttributesProperty {
    props: {}; // 告诉TSX所有组件的props都可以有key
  }
}
