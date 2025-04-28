
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: {
      [key: string]: any;
    };
  }
}