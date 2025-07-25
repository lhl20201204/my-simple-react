import MyClassComponent from "./classComponent";
import { DELETE, PLACEMENT, UPDATE } from "./const";

export type MyProps = {
  [key: string]: any;
}
export type MyDomNode = HTMLElement;

export type MyStateNode = null | MyDomNode | Text | InstanceType<MyClassComponent>;

export type MyState = Record<string, any>;

export type MyRef<T> = {
  current: T | null
};

export type MyFiberRef<T> = MyRef<T> | (((x: T | null) => void))

export type MyFunctionComponent = (props: MyProps, ref?: MyFiberRef<any>) => MyReactNode;

export type MyForwardRefComponent<T extends MyFunctionComponent> = {
  $$typeof: Symbol;
  render: T;
  (props: MyFunctionComponentProps<T> & { ref?: MyFiberRef<any> }): MyReactNode;
}

export type MyLazyPayload<T> = {
  _status: -1;
  _result: () => Promise<{ default: T }>
} | {
  _status: 0;
  _result: Promise<{ default: T }>;
} | {
  _status: 1;
  _result: T;
} | {
  _status: 2;
  _result: Error
}

export type MyLazyInitializer<T extends MyFunctionComponent> = (payload: MyLazyPayload<T>) =>
  Error<Promise<{ default: T }>>
  | { default: T }
  | never

export type MyLazyComponent<T extends MyFunctionComponent> = {
  $$typeof: Symbol;
  _init: MyLazyInitializer<T>;
  _payload: MyLazyPayload<T>;
  (props: MyFunctionComponentProps<T>): ReturnType<T>;
}

export type MyFunctionComponentProps<T> = T extends (props: infer f, ref?: MyFiberRef<any>) => MyReactNode ? f :
  T extends MyForwardRefComponent<infer Y> ? MyFunctionComponentProps<Y> : never;

export type MyMemoComponent<T extends MyFunctionComponent | MyForwardRefComponent> = {
  $$typeof: Symbol;
  compare: null | ((x: MyFunctionComponentProps<T>, y: MyFunctionComponentProps<T>) => boolean),
  type: T
  (props: MyFunctionComponentProps<T>): MyReactNode;
}

export type MyElementType = 'root' | keyof HTMLElementTagNameMap
  | MyFunctionComponent | typeof MyClassComponent | MyMemoComponent
  | Symbol;

export type MyElmemetKey = string | number | null | undefined
export type MyElement<T extends MyElementType, P extends MyProps, K extends MyElmemetKey> = {
  elementId: number;
  $$typeof: Symbol
  type: T;
  props: P;
  key: K;
  ref: null | P['ref'];
  _owner: null | MyFiber;
  _store: { validated: false }
};

export type MyPortalElement = {
  $$typeof: Symbol;
  type?: Symbol;
  props?: MyProps
  children: MyReactNode;
  containerInfo: HTMLElement;
  key: null | string | number;
  implementation: null;
}

export type MyReactElement = MyElement<MyElementType, MyProps, MyElmemetKey>;

export type MySingleReactNode = MyReactElement |
  MyPortalElement | string | number | boolean | null | undefined;

export type MyReactNode = MySingleReactNode | MySingleReactNode[];

export type MyJSX = <T extends MyElementType, P extends MyProps, K extends MyElmemetKey>(
  type: T,
  props: P,
  key: K
) => MyElement<T, P, K>;

export type MyTask = {
  callback: () => void;
  type: string;
  priority: number;
}

export type MyContext<T> = {
  $$typeof: Symbol;
  Provider: {
    $$typeof: Symbol;
    _context: MyContext<T>
    (props: { children?: MyReactNode, value: T }): MyReactNode;
  }
  Consumer: {
    $$typeof: Symbol;
    _context: MyContext<T>;
    (props: { children: (value: T) => MyReactNode }): MyReactNode;
  }
  _currentValue: T;
}

export type MyDependenciesContext<T> = {
  context: MyContext<T>
  memoizedValue: T;
  next: MyDependenciesContext<unknown> | null;
}

export type MyDependencies = null | {
  firstContext: MyDependenciesContext<unknown>;
}

export type IFLAGS = number;

export type IStateParams<T> = (T | (() => T));

export type IDispatchValue<T> = (T | ((c: T) => T));

//TODO useState的结构改造.
export type IStateHook<T> = {
  memoizeState: T,
  updateList: IDispatchValue<T>[],
  dispatchAction: (x: IDispatchValue<T>) => void;
}

// export type IStateHook = {
//   memoizedState: any, // 当前状态值
//   queue: UpdateQueue<any, any>, // 更新队列
//   next: Hook | null, // 指向下一个 hook，形成链表
// }

export type IEffectHook = {
  id: number, // 用于debugger
  tag: number, // effect 类型，比如 EffectTag
  create: () => (() => void) | void, // useEffect 的回调
  destroy: (() => void) | void,      // 清理函数
  deps: Array<any> | null,   // 依赖项
  pendingDeps?: Array<any> | null,
  fiber: MyFiber,
  next: IEffectHook | null,  //           // 指向下一个 effect，形成链表
}

export type IRefHook = {
  memoizeState: {
    current: any
  }
}

export type IMemoOrCallbackHook = {
  memoizeState: any,
  deps: any[]
}

export type IHook = IEffectHook | IStateHook<any> | IMemoOrCallbackHook | {
}

export type MyFiber = {
  id: number;
  alternate: MyFiber | null;
  child: MyFiber | null;
  dependencies: MyDependencies | null;
  elementType: MyElementType;
  firstEffect: MyFiber | null;
  flags: IFLAGS;
  index: number;
  lanes: number;
  childLanes: number;
  key: MyElmemetKey;
  updateQueue: {
    firstEffect: null | IEffectHook,
    lastEffect: null | IEffectHook,
  };
  element: MySingleReactNode | null;
  commitCount: number;
  lastEffect: MyFiber | null;
  hook: IHook[];
  memoizedProps: MyProps;
  memoizedState: MyState;
  nextEffect: MyFiber | null;
  pendingProps: MyProps;
  ref: MyFiberRef<any> | null;
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


// 在这里补充MyClassComponent的类型
export interface IMyClassComponent<P extends MyProps = {}, S extends MyState = {}> {
  props: P;
  state: S;
  context: Record<string, any>;
  _reactInternals: MyFiber | null;
  updateList?: (Partial<S> | ((c: Partial<S>) => Partial<S>))[];
  forceUpdateList: Function[];
  dispatchAction?: (x: Partial<S> | ((prevState: Readonly<S>) => Partial<S>)) => void;
  forceUpdateDispatchAction?: (cb: Function) => void;
  // new (props: P): void;
  isReactComponent(): boolean;
  setState(state: Partial<S> | ((prevState: Readonly<S>) => Partial<S>)): void;
  forceUpdate(cb?: Function): void;
  render(): MyReactNode;
  componentDidMount?(): void;
  componentDidUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot?: any): void;
  componentWillUnmount?(): void;
  shouldComponentUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>): boolean;
  getSnapshotBeforeUpdate?: (prevProps: Readonly<P>, prevState: Readonly<S>) => any;
  componentDidCatch?(error: Error, errorInfo: MyReact.ErrorInfo): void;
}

export type IMyClassComponentStatic<P extends MyProps = {}, S extends MyState = {}> = {
  getDerivedStateFromError?(error: Error): Partial<any> | null;
  getDerivedStateFromProps?(nextProps: any, currentState: any): any | null;
  contextType?: MyContext<any>;
}