import { MyUseEffect,  MyUseRef, MyUseState ,
   MyUseCallback,
  MyUseMemo,
  MyUseLayoutEffect
} from '../MyMiniReact/render';

export const useEffect = window.useSelfReact ? MyUseEffect : window.React.useEffect;
export const useRef = window.useSelfReact ? MyUseRef : window.React.useRef;
export const useState = window.useSelfReact ? MyUseState : window.React.useState;
export const useCallback = window.useSelfReact ? MyUseCallback : window.React.useCallback;
export const useMemo = window.useSelfReact ? MyUseMemo : window.React.useMemo;
export const useLayoutEffect  = window.useSelfReact ? MyUseLayoutEffect: window.React.useLayoutEffect;