declare namespace JSX {
  interface CSSProperties extends CustomCSSProperties {
    
  }
  type IntrinsicElements = Generate<CommonHTMLTags>;

  type Element = MyElement;
  interface IntrinsicAttributes {
    key?: string | number;
  }
  interface ElementAttributesProperty {
    props: {}; // 告诉TSX所有组件的props都可以有key
  }
  interface ElementChildrenAttribute {
    children: {};
  }
}

