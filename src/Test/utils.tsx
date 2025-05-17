import { MyUseEffect,  MyUseRef, MyUseState ,
   MyUseCallback,
  MyUseMemo,
  MyUseLayoutEffect
} from '../MyMiniReact/beginWork';
import { runInBatchUpdate } from '../MyMiniReact/ReactDom';

export const useEffect: typeof MyUseEffect = window.useSelfReact ? MyUseEffect : window.React.useEffect;
export const useRef: typeof MyUseRef = window.useSelfReact ? MyUseRef : window.React.useRef;
export const useState: typeof MyUseState = window.useSelfReact ? MyUseState : window.React.useState;
export const useCallback: typeof MyUseCallback = window.useSelfReact ? MyUseCallback : window.React.useCallback;
export const useMemo: typeof MyUseMemo = window.useSelfReact ? MyUseMemo : window.React.useMemo;
export const useLayoutEffect: typeof MyUseLayoutEffect  = window.useSelfReact ? MyUseLayoutEffect: window.React.useLayoutEffect;

export const  ReactDOM = {
  unstable_batchedUpdates: window.useSelfReact ? runInBatchUpdate: window.ReactDOM.unstable_batchedUpdates
}

export function sleep(t) {
  let time = Number(new Date());
  while(Number(new Date()) < t + time) {

  }
}