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
  $$typeof: Symbol
  type: MyElementType;
  props: MyProps;
  key: MyElmemetKey;
  ref: null | MyRef;
  _owner: null;
  _store: {validated: false}
};

export type MyJSX = (props: MyProps, key: MyElmemetKey) => MyElement;

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

//TODO useState的结构改造.
export type IStateHook<T> =  {
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
  dependencies: MyDependencies;
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
  }
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
