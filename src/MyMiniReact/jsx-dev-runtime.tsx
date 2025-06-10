import { runInRecordLog } from "./test";
import { MyElement, MyElementType, MyElmemetKey, MyRef } from "./type";
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
  }
}

export const globalHocMap = new WeakMap<MyElementType, MyElementType>();

function transformProps(props: Record<string, unknown>) {
  const ret = {};
  _.forEach(props, (v, k) => {
    if (k.startsWith('on')) {
      ret[k] = (...args) => {
        return runInRecordLog(() => (v as Function)(...args));
      }
    } else if (k !== 'ref') {
      ret[k] = v;
    }
  })
  return ret;
}

export let elementId = 1;

export function getElementId() {
  return elementId++;
}
export function jsxDev(
  type: MyElementType, 
  props: Record<string, unknown>,
  key: MyElmemetKey
): MyElement {
  // console.log({type, props, key})
  const isMemo = type['$$typeof'] === window.reactMemoType;
  let fnType = isMemo ? type.type : type;
  const originFnType = isMemo ? type.type : type;
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
      hocMap.set(targetKey, isMemo ? {
        ...type,
        type: fn
      } : fn);
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
    ref: (props.ref ?? null) as MyRef,
    _owner: null,
    _store: {
      validated: false
    }
  };
}

export const Fragment = window.reactFragmentType ?? Symbol('React.Fragment')

export const jsxDEV = jsxDev;