import _ from "lodash";
import { MyElement, MyFiber, MyProps } from "./type";
import { IRenderNode, renderTree } from "../View";

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
  return _.isString(element) || _.isNumber(element) || _.isBoolean(element);
}

export function getPropsByElement(element: MyElement): MyProps {
  return isStringOrNumber(element) ? element : element.props
}

export function isPropsEqual(obj1: MyProps, obj2: MyProps) {
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