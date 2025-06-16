import { MyUseEffect,  MyUseRef, MyUseState ,
   MyUseCallback,
  MyUseMemo,
  MyUseLayoutEffect,
  MyUseImperativeHandle,
  MyUseContext
} from '../MyMiniReact/beginWork';
import { promiseResolve, getGlobalPromise, resetGlobalPromise, originConsoleLog } from '../MyMiniReact/test';
import { runInBatchUpdate } from '../MyMiniReact/ReactDom';
import {MyForwardRef, MyMemo} from '../MyMiniReact/trait';
import { originSetTimeout, runInRecordLog } from '../MyMiniReact/test';
import { MyCreateContext } from '../MyMiniReact/context';

export const useEffect: typeof MyUseEffect = (create, arr) => {
  return (window.useSelfReact ? MyUseEffect : window.React.useEffect)(() => {
    return runInRecordLog(() => {
      // originConsoleLog('effect开始执行');
      originSetTimeout(promiseResolve)
      const ret = create();
      return () => {
        if (ret) {
          runInRecordLog(ret)
        }
        originSetTimeout(promiseResolve)
      }
    });
  }, arr);
};
export const useRef: typeof MyUseRef = window.useSelfReact ? MyUseRef : window.React.useRef;
export const useCallback: typeof MyUseCallback = window.useSelfReact ? MyUseCallback : window.React.useCallback;
export const useState: typeof MyUseState = function (...args) {
  const [ret, setState] = ( window.useSelfReact ? MyUseState : window.React.useState)(...args);
  return [ret, useCallback((...args) => {
    setState(...args);
    if (!getGlobalPromise()) {
      resetGlobalPromise()
    }
  }, [])]
};
export const useMemo: typeof MyUseMemo = window.useSelfReact ? MyUseMemo : window.React.useMemo;
export const useLayoutEffect: typeof MyUseLayoutEffect  = (create, arr) => {
  return (window.useSelfReact ? MyUseLayoutEffect: window.React.useLayoutEffect)(() => {
    return runInRecordLog(() => {
      const ret = create();
      return () => {
        if (ret) {
          runInRecordLog(ret)
        }
      }
    });
  }, arr);
};

export const  ReactDOM = {
  unstable_batchedUpdates: window.useSelfReact ? function <T>(cb: () => T): T {
    return runInBatchUpdate(cb, false);
  }: window.ReactDOM.unstable_batchedUpdates
}

export const memo: typeof MyMemo = window.useSelfReact ? MyMemo : window.React.memo;

export const forwardRef: typeof MyForwardRef = window.useSelfReact ? MyForwardRef : window.React.forwardRef;

export const useImperativeHandle: typeof MyUseImperativeHandle = (ref, handle, deps) => {
  return (window.useSelfReact ? MyUseImperativeHandle : window.React.useImperativeHandle)(
    ref,
    () => runInRecordLog(() => handle()),
    deps
  )
}

export const createContext: typeof MyCreateContext = window.useSelfReact ? MyCreateContext :  window.React.createContext;

export const useContext: typeof MyUseContext = window.useSelfReact ?
 MyUseContext 
 : window.React.useContext;

export function sleep(t) {
  let time = Number(new Date());
  while(Number(new Date()) < t + time) {

  }
}