import { MyElement, MyElementType, MyElmemetKey, MyRef } from "./type";
import _ from "lodash";

declare global {
  interface Window {
    WindomDom: any; // 你可以指定具体类型，比如 WindomDomType
    reactType: any;
    promiseResolve2: any;
    useSelfReact: boolean;
    React: any,
    ReactDOM: any
  }
}

// let id = 0;
export function jsxDev(
  type: MyElementType, 
  props: Record<string, unknown>,
  key: MyElmemetKey
): MyElement {
  // console.log({type, props, key})
  return {
    $$typeof: window.reactType,
    type,
    // id: id++,
    props: _.omit(props, 'ref'),
    key: _.isNil(key) ? key : `${key}`,
    ref: (props.ref ?? null) as MyRef,
    _owner: null,
    _store: {
      validated: false
    }
  };
}

export const jsxDEV = jsxDev;