import { MyUseEffect,  MyUseRef, MyUseState ,
   MyUseCallback,
  MyUseMemo,
  MyUseLayoutEffect,
  MyUseImperativeHandle,
  MyUseContext
} from '../MyMiniReact/beginWork';
import { promiseResolve, getGlobalPromise, resetGlobalPromise, originConsoleLog } from '../MyMiniReact/test';
import { runInBatchUpdate } from '../MyMiniReact/ReactDom';
import {MyCreatePortal, MyForwardRef, MyLazy, MyMemo, MySuspense} from '../MyMiniReact/trait';
import { originSetTimeout, runInRecordLog } from '../MyMiniReact/test';
import { MyCreateContext } from '../MyMiniReact/context';
import _ from 'lodash';

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

export const memo: typeof MyMemo = (Comp) => (window.useSelfReact ? MyMemo : window.React.memo)(
  _.isFunction(Comp) ? (props) => {
      return runInRecordLog(() => {
          return Comp(props)
        })
    } : Comp
)

export const forwardRef: typeof MyForwardRef =(Comp) => (window.useSelfReact ? MyForwardRef : window.React.forwardRef)(
  (props, ref) => {
      return runInRecordLog(() => {
          return Comp(props, ref)
        })
    }
);

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

const weakMap = new WeakMap();

export const ReactUse = (promise: Promise<any>) => {
  if (!weakMap.has(promise)) {
    const record = {
      status: 'pending',
      value: null,
      error: null,
    }
    weakMap.set(promise, record);
    promise.then(value => {
      record.status = 'fulfilled';
      record.value = value;
    }, error => {
      record.status = 'rejected';
      record.error = error;
    });
  }
  const record2 = weakMap.get(promise);
  if (record2.status === 'pending') {
    throw promise;
  }
  if (record2.status === 'fulfilled') {
    return record2.value;
  }
  if (record2.status === 'rejected') {
    throw record2.error;
  }
}

export const use = ReactUse;

export const Suspense: typeof MySuspense = window.useSelfReact ? MySuspense :  window.React.Suspense;

export const lazy: typeof MyLazy =  (fn) => {
  return (window.useSelfReact ? MyLazy : window.React.lazy)((async () => {
    const res = await fn();
    console.log('resolve')
    return {
      default: (...args) => {
        return runInRecordLog(() => {
          return res.default(...args)
        })
      }
    };
  }) as typeof fn);
};

export const createPortal: typeof MyCreatePortal =
 window.useSelfReact ? MyCreatePortal :
 window.ReactDOM.createPortal;

export function sleep(t) {
  let time = Number(new Date());
  while(Number(new Date()) < t + time) {

  }
}