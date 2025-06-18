import { MyElement, MyElementType, MyElmemetKey, MyProps } from "./type";

export function jsxDEV<T extends MyElementType, P extends MyProps, K extends MyElmemetKey>(
  type: T,
  props: P,
  key: K
): MyElement<T, P, K>;

export function jsxsDev<T extends MyElementType, P extends MyProps, K extends MyElmemetKey>(
  type: T,
  props: P,
  key: K
): MyElement<T, P, K>; 