import _ from "lodash";
import { MyElement, MyFiber, MyProps } from "./type";
import { IRenderNode, renderTree } from "../View";
import { EFFECT_LAYOUT, EffECTDicts } from "./const";

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
  while(idSet.has(str2)) {
    str2 = generateUUID(str);
  }
  idSet.add(str2)
  return str2;
}

export function isStringOrNumber(element: MyElement | null | MyProps) {
  return _.isString(element) || _.isNumber(element) || _.isBoolean(element) || _.isNil(element);
}

export function getPropsByElement(element: MyElement): MyProps {
  return isStringOrNumber(element) ? element : element.props
}

export function isPropsEqual(obj1: MyProps, obj2: MyProps) {
  return obj1 === obj2;
  if (isStringOrNumber(obj1)) {
    return obj1 === obj2;
  }

  if (!_.isObject(obj1) || _.isNil(obj1)) {
    throw '类型错误'
  }

  const keys = _.keys(obj1);
  if (_.size(keys) !== _.size(_.keys(obj2))) {
    return false;
  }
  for(const key of keys) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  return true;
}

export function isDepEqual(dep1: Array<any> | null, dep2: Array<any> | null) {
  const len1 = _.size(dep1);
  const len2 = _.size(dep2);
  if (len1 !== len2 || _.isNil(dep1)) {
    // 长度不同，或者都为null
    return false
  }
  for(let i = 0; i< len1; i++) {
    if (dep1[i] !== dep2[i]) {
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
  return ret.join(',')
}

export function logFiberTree(fiber: MyFiber) {
  const dfs = (f: MyFiber) => {
    if (!f) {
      return null;
    }
    let name: any = f.type;
    if (typeof name === 'function') {
      name  = (name as Function).name ;
    } else if (name === 'text') {
      name =`${f.memoizedProps }`
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
    while(first) {
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

export function getEffectListId(fiber: MyFiber) {
  let f = fiber.updateQueue?.firstEffect;
  let endEffect = fiber.updateQueue?.lastEffect?.next ?? null;
  const ret = []
  while(f && f !== endEffect) {
    ret.push([f.id, f.tag & EFFECT_LAYOUT ? 'layout' : 'passive'].join('-'))
    f = f.next;
  }
  return ret.join(',')
}

export function logFiberIdPath(fiber: MyFiber, ret = []) {
  return fiber ? logFiberIdPath(fiber.return, [...ret, fiber.id,]) : ret.join('->');
}