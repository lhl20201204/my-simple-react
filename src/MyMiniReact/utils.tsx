import _ from "lodash";
import { MyElement, MyFiber, MyProps, MySingleReactNode } from "./type";
import { IRenderNode, renderTree } from "../View";
import { EFFECT_HOOK_HAS_EFFECT, EFFECT_LAYOUT, EffECTDicts, MEMOCOMPONENT, PORTAlCOMPONENT } from "./const";

const joinSign = '#######';

function generateUUID(indicatorDataIndex: string) {
  return (
    indicatorDataIndex +
    joinSign +
    (Number(new Date()) +
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2))
  );
}

const idSet = new Set();

export function getUUID(str: string) {
  let str2 = generateUUID(str);
  while (idSet.has(str2)) {
    str2 = generateUUID(str);
  }
  idSet.add(str2)
  return str2;
}

export function isStringOrNumber(element: MySingleReactNode) {
  return _.isString(element) || _.isNumber(element) || _.isBoolean(element) || _.isNil(element);
}

export function getPropsByElement(element: MySingleReactNode): MyProps {
  return isStringOrNumber(element) ? (element as unknown as MyProps) : element.props
}

export function shallowEqual(obj1: MyProps, obj2: MyProps) {
  if (obj1 === obj2) {
    return true;
  }

  if (typeof obj1 !== 'object' || obj1 === null ||
    typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let i = 0; i < keys1.length; i++) {
    const key = keys1[i];
    if (!Object.prototype.hasOwnProperty.call(obj2, key) || obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

export function isPropsEqual(obj1: MyProps, obj2: MyProps, fiber: MyFiber) {
  if (fiber.tag === MEMOCOMPONENT) {
    return (fiber.type.compare ?? shallowEqual)(obj1, obj2);
  }
  return obj1 === obj2;
}

export function isDepEqual(dep1: Array<any> | null, dep2: Array<any> | null) {
  const len1 = _.size(dep1);
  const len2 = _.size(dep2);
  if (len1 !== len2 || _.isNil(dep1)) {
    // 长度不同，或者都为null
    return false
  }
  for (let i = 0; i < len1; i++) {
    if (dep1[i] !== dep2[i]) {
      // console.log(dep1[i], dep2[i])
      return false;
    }
  }
  return true
}

export function logEffectType(fiber: MyFiber) {

  const ret = []
  _.forEach(EffECTDicts, (v, k) => {
    if (fiber.flags & Number(k)) {
      ret.push(v)
    }
  })
  return ret.join(',') || 'noEffect'
}

export function logFiberTree(fiber: MyFiber) {
  const dfs = (f: MyFiber) => {
    if (!f) {
      return null;
    }
    let name: any = _.isSymbol(f.type) ? f.type.description :
      f.type?.$$typeof === window.reactMemoType ? 'react.memo' :
        f.type?.$$typeof === window.reactForwardRefType ? 'react.forwardRef' :
          f.type?.$$typeof === window.reactProviderType ? 'react.provider' :
            f.type?.$$typeof === window.reactContextType ? 'react.consumer' :
              f.type === window.reactSuspenseType ? 'react.suspense' :
                f.type?.$$typeof === window.reactLazyType ? 'react.lazy' :
                  f.tag === PORTAlCOMPONENT ? 'react.portal' :
                    f.type;
    //  console.log(name)
    if (typeof name === 'function') {
      name = (name as Function).name;
    } else if (name === 'text') {
      name = `${f.memoizedProps}`
    } else {
      name = _.compact([name, f.memoizedProps?.id]).join('#')
    }
    const node: IRenderNode = {
      value: f.id,
      name: `${f.id}(${name})`,
      children: []
    }
    // if (f.id === 10) {
    //   console.log(_.cloneDeep(f))
    // }
    let first = f.child;
    while (first) {
      const n = dfs(first);
      if (n) {
        node.children.push(n)
      }
      first = first.sibling;
    }
    return node;
  }
  // console.log(dfs(fiber));
  const dom = document.getElementById('view');
  // console.log(dom);
  renderTree(dom, dfs(fiber))
}

export function getEffectListId(fiber: MyFiber, onlyId = false) {
  let f = fiber.updateQueue?.firstEffect;
  let endEffect = fiber.updateQueue?.lastEffect?.next ?? null;
  const ret = []
  while (f && f !== endEffect) {
    ret.push(onlyId ? f.id : [f.id,
    f.tag & EFFECT_LAYOUT ? 'layout' : 'passive',
    f.tag & EFFECT_HOOK_HAS_EFFECT ? 'effect' : ''
    ].join('-'))
    f = f.next;
  }
  return ret.join(',')
}

export function logFiberIdPath(fiber: MyFiber, ret = []) {
  return fiber ? logFiberIdPath(fiber.return, [...ret, fiber.id,]) : ret.join('->');
}

export function getCommitEffectListId(fiber: MyFiber) {
  let f = fiber.firstEffect;
  let endEffect = fiber.lastEffect?.nextEffect ?? null;
  const ret = []
  while (f && f !== endEffect) {
    ret.push([f.id, f.flags, logEffectType(f)].join('-'))
    f = f.nextEffect
  }
  return ret.join(',')
}