import { DELETE, PLACEMENT, UPDATE } from "./const";

export type MyProps = Record<string, any>;
export type MyDomNode = HTMLElement;

export type MyStateNode= null | MyDomNode | Text;

export type MyState = Record<string, any>;

export type MyRef = {
  current: any;
}

export type MyFunctionComponent = (props: MyProps, ref?: MyRef) => MyElement;

export type MyClassComponent = new (props: MyProps, context: any) => MyElement;

export type MyElementType = 'root' | 'div' | 'text'  | 'span' | MyFunctionComponent | MyClassComponent;

export type MyElmemetKey = string | number | null | undefined
export type MyElement = {
  type: MyElementType;
  props: MyProps;
  key: MyElmemetKey;
  ref: null | MyRef;
};

export type MyJSX = (props: MyProps, key: MyElmemetKey) => MyElement;

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: {
      [key: string]: any;
    };
  }
}

export type MyTask = {
  callback: () => void;
  type: string;
  priority: number;
}

export type MyContext = {
  Provider: MyFiber | null;
  Consumer: MyFiber | null;
  _currentValue: any;
}

export type MyDependencies = null | {
  firstContext: {
    context: MyContext | null,
    next: MyDependencies
  };
}

export type IFLAGS = number;

export type IStateParams<T> = (T | (() => T));

export type IDispatchValue<T> = (T | ((c: T) => T));

export type IStateHook<T> =  {
  fiber: MyFiber,
  memoizeState: T,
  updateList: IDispatchValue<T>[],
  dispatchAction: (x: IDispatchValue<T>) => void;
}

export type IHook =  IStateHook<any> | {
}

export type MyFiber = {
  id: number;
  alternate: MyFiber | null;
  child: MyFiber | null;
  dependencies: MyDependencies;
  elementType: MyElementType;
  firstEffect: MyFiber | null;
  flags: IFLAGS;
  index: number;
  lanes: number;
  childLanes: number;
  key: MyElmemetKey;
  lastEffect: MyFiber | null;
  hook: IHook[];
  memoizedProps: MyProps;
  memoizedState: MyState;
  nextEffect: MyFiber | null;
  pendingProps: MyProps;
  ref: MyRef | null;
  return: MyFiber | null;
  sibling: MyFiber | null;
  stateNode: MyStateNode;
  tag: number;
  type: MyElementType;
};

export type MyFiberRoot = {
  tag: number;
  stateNode: MyStateNode;
  current: MyFiber | null;
  flag: number;
};
