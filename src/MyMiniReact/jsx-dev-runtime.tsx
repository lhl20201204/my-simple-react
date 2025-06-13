import { runInRecordLog } from "./test";
import { MyElement, MyElementType, MyElmemetKey, MyFiberRef, MyRef } from "./type";
import _ from "lodash";

declare global {
  interface Window {
    WindomDom: any; // 你可以指定具体类型，比如 WindomDomType
    promiseResolve2: any;
    useSelfReact: boolean;
    React: any,
    ReactDOM: any
    reactType: Symbol;
    reactMemoType: Symbol;
    reactFragmentType: Symbol;
    reactForwardRefType: Symbol;
  }
}

export const globalHocMap = new WeakMap<MyElementType, MyElementType>();

function transformProps<T extends Record<string, unknown>>(props: T): T {
  const ret = {};
  _.forEach(props, (v, k) => {
    if (k.startsWith('on') && _.isFunction(v)) {
      ret[k] = ((...args) => {
        return runInRecordLog(() => (v)(...args));
      }) as typeof v
    } else if (k !== 'ref') {
      ret[k] = v;
    }
  })
  return ret as T;
}

export let elementId = 1;

export function getElementId() {
  return elementId++;
}

function isMemoType(x) {
  return x.$$typeof === window.reactMemoType;
}

function getType(x) {
  return _.isFunction(x) ? x :
  isMemoType(x) ? getType(x.type) : getType(x.render);
}

function changeType(type, newFnType) {
  return _.isFunction(type) ? newFnType :
   isMemoType(type) ?
   {
    ...type,
    type: changeType(type.type, newFnType)
  } : {
    ...type,
    render: changeType(type.render, newFnType)
  }
}

export function transformRef(ref) {
  return _.isFunction(ref) ? (...args) => runInRecordLog(() => ref(...args)) : ref;
}

export function jsxDev(
  type: MyElementType, 
  props: Record<string, unknown>,
  key: MyElmemetKey
): MyElement {
  // console.log({type, props, key})
  const isMemo = type['$$typeof'] === window.reactMemoType;
  const isForWardRef =  type['$$typeof'] === window.reactForwardRefType;
  const bol = isMemo || isForWardRef
  let fnType = bol ? getType(type): type;
  const originFnType = bol ? getType(type) : type;
  if (_.isFunction(fnType) && !fnType['jump-hoc']) {
    // if (!globalHocMap.has(type)) {
    //   globalHocMap.set(type, new Map());
    // }

    const hocMap = globalHocMap // .get(type);

    const targetKey = type;

    if (!hocMap.has(targetKey)) {
      const fn = function (props, ref) {
        // return jsxDev((props, ref) => {
        //   console.error('render')
        //  return runInRecordLog(() => fnType(props, ref))
        // }, { ...props, ref }, key)
        // console.error('render----->', originFnType, key)
        // if (id ++ > 100) {
        //   throw new Error('test')
        // }
        return runInRecordLog(() => originFnType(props, ref))
      };
      // console.error('hoc----->', originFnType)
      fn['jump-hoc'] = true;
      hocMap.set(targetKey, changeType(type, fn));
    }
    fnType = hocMap.get(targetKey);
    // if (id ++ > 100) {
    //   throw new Error('test')
    // }
    // console.log('enter---> ', fnType);
  } else {
    fnType = type;
  }

  return {
    elementId: elementId++,
    $$typeof: window.reactType,
    type: fnType,
    props: transformProps(props),
    key: _.isNil(key) ? key : `${key}`,
    ref: transformRef(props.ref ?? null) as MyFiberRef,
    _owner: null,
    _store: {
      validated: false
    }
  };
}

export const Fragment = window.reactFragmentType ?? Symbol('React.Fragment')

export const jsxDEV = jsxDev;