import _ from "lodash";
import { MyReactNode } from "../MyMiniReact/type";
import { createContext, createPortal, useContext, useEffect, useRef, useState } from "./utils";

export type CacheNode = {
  element: MyReactNode,
  active: boolean
  node: HTMLDivElement
};

const CacheContext = createContext({
  cache: new Map<string, CacheNode>(),
  cacheRef: { current: new Map<string, CacheNode>() },
  setCache: (_cache: Map<string, CacheNode> | (
    (x: Map<string, CacheNode>) => Map<string, CacheNode>
  )) => { }
});

export const KeepAliveContext = createContext<{
  active: undefined | boolean
}>({
  active: undefined
});

const activeContextValue = { active: true }
const unactiveContextValue = { active: false }


export function AliveScope(props: { children: any }) {
  const [cache, setCache] = useState(new Map<string, CacheNode>());
  const cacheRef = useRef(cache);

  return <>
    <CacheContext.Provider key={'___cacheContext'} value={{ cache, setCache, cacheRef }}>
      {props.children}
    </CacheContext.Provider>
    <div id={'AliveScope'} style={{ display: 'none' }}>
      {
        _.map([...cache], ([key, value]) => {
          return createPortal(
            <KeepAliveContext.Provider value={
              value.active ? activeContextValue : unactiveContextValue
            }>
              {value.element}
            </KeepAliveContext.Provider>
            , value.node, key);
        })
      }
    </div>
  </>;
}

export function KeepAlive(props: { cacheKey: string, children: any }) {
  const { setCache, cacheRef } = useContext(CacheContext);
  const keyRef = useRef(props.cacheKey);

  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cache = cacheRef.current;
    const node = domRef.current;
    if (!cache.has(props.cacheKey) || cache.get(props.cacheKey)?.node !== node
      || cache.get(props.cacheKey)?.active !== true) {
      const element = props.children;
      const newCache = new Map([...cacheRef.current])
      if (newCache.has(props.cacheKey)) {
        newCache.set(props.cacheKey, { element: newCache.get(props.cacheKey)?.element, node, active: true })
      } else {
        newCache.set(props.cacheKey, { element, node, active: true })
      }
      cacheRef.current = newCache;
      setCache(newCache);
    }
    return () => {
      const cache = cacheRef.current;
      const newCache = new Map([...cache])
      if (newCache.has(props.cacheKey)) {
        const newCache = new Map([...cache])
        newCache.set(props.cacheKey, {
          ...newCache.get(props.cacheKey), active: false
        })
        cacheRef.current = newCache;
        setCache(newCache);
      }
    }
  }, [props.cacheKey])

  return <>
    <div className={"keep-alive-wrapper-" + keyRef.current} key={props.cacheKey}
      ref={domRef}></div>
  </>
}

export function useActivate(cb: Function) {
  const { active } = useContext(KeepAliveContext) || {};
  const firstRef = useRef(true);
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (active && !firstRef.current) {
      cbRef.current();
    }
    firstRef.current = false;
  }, [active])
}

export function useUnactivate(cb: Function) {
  const { active } = useContext(KeepAliveContext) || {};
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (_.isBoolean(active) && !active) {
      cbRef.current();
    }
  }, [active])
}