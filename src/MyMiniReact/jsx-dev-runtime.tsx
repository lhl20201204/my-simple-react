import { MyElement, MyElementType, MyElmemetKey, MyRef } from "./type";
import _ from "lodash";

export function jsxDev(
  type: MyElementType, 
  props: Record<string, unknown>,
  key: MyElmemetKey
): MyElement {
  return {
    type,
    props: _.omit(props, 'ref'),
    key,
    ref: (props.ref ?? null) as MyRef
  };
}

export const jsxDEV = jsxDev;