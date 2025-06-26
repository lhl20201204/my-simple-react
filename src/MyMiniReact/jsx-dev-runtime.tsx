import { originConsoleLog, runInRecordLog } from "./test";
import { MyElement, MyElementType, MyElmemetKey, MyFiberRef, MyFunctionComponent, MyFunctionComponentProps, MyProps, MyReactNode, MyRef } from "./type";
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
    reactContextType: Symbol;
    reactProviderType: Symbol;
    reactSuspenseType: Symbol;
    reactLazyType: Symbol;
  }

  type CustomCSSProperties ={
    [key in keyof CSSStyleDeclaration]?: CanBeNumber<key, CSSStyleDeclaration[key]>;
    // ...你想要的属性
  }

  type GetLast<T> = ((
    T extends any ? 
    ((x: (x: T) => void) => void) extends (x: infer f) => void ?
    (x: f) => void : never 
    : never
  ) extends ((x: infer f) => void) ? 
  f : never) extends ((t: infer ff) => void) ? ff : never;


  // 常用 HTML 标签数组
type CommonHTMLTags = [
  // 布局容器
  'div',      // 通用容器
  'section',  // 章节/区段
  'article',  // 文章
  'header',   // 页头
  'footer',   // 页脚
  'main',     // 主要内容
  'nav',      // 导航
  'aside',    // 侧边栏

  // 文本
  'p',        // 段落
  'span',     // 行内文本
  'h1',       // 一级标题
  'h2',       // 二级标题
  'h3',       // 三级标题
  'h4',       // 四级标题
  'h5',       // 五级标题
  'h6',       // 六级标题

  // 列表
  'ul',       // 无序列表
  'ol',       // 有序列表
  'li',       // 列表项

  // 表单
  'form',     // 表单
  'input',    // 输入框
  'button',   // 按钮
  'select',   // 下拉选择
  'option',   // 下拉选项
  'textarea', // 文本域
  'label',    // 标签

  // 图片和多媒体
  'img',      // 图片
  'video',    // 视频
  'audio',    // 音频

  // 链接
  'a',        // 超链接

  // 表格
  'table',    // 表格
  'thead',    // 表头
  'tbody',    // 表格主体
  'tr',       // 表格行
  'th',       // 表头单元格
  'td'        // 表格单元格
];

  type ChangeForm = {
    'onclick': 'onClick',
    'onchange': 'onChange',
    'oninput': 'onInput',
    'onfocus': 'onFocus',
    'onblur': 'onBlur',
    'onkeydown': 'onKeyDown',
    'onkeyup': 'onKeyUp',
    'onkeypress': 'onKeyPress',
    'onmouseover': 'onMouseOver',
    'onmouseout': 'onMouseOut',
    'onmouseenter': 'onMouseEnter',
    'onmouseleave': 'onMouseLeave',
    'onmousemove': 'onMouseMove',
  }

  type NumberOrStringMap = ['id', 'padding', 'margin', 'width', 'height'];

  type CanBeNumber<K, V> = K extends NumberOrStringMap[number] ? V | number : V;

  type changeAttrbute<T> = T extends keyof ChangeForm ? ChangeForm[T] : T;
  type KeyOfHTMLElementTagNameMap = keyof HTMLElementTagNameMap;

  type ChangeValue<T, K extends keyof HTMLElementTagNameMap, V> = T extends keyof ChangeForm ? V extends (f: infer f) => infer r ?
    (x: Omit<f, 'target'> & {
    stopPropagation: () => void
    preventDefault: () => void
    target: HTMLElementTagNameMap[K]
  }) => r: never : CanBeNumber<T, V>;


  
  
  type unionToArray<T, G = GetLast<T>, rest = Exclude<T, G>> = [
    ...([rest] extends [never] ? [] : unionToArray<rest>),
    G & string
  ];
  
  type Generate<T extends readonly string[]> = {
    [K in T[number]]: K extends keyof HTMLElementTagNameMap ? Omit<{
      [P in (keyof HTMLElementTagNameMap[K]) as changeAttrbute<P>]?: ChangeValue<P, K, HTMLElementTagNameMap[K][P]>;
    }, 'style' | 'children'> & {
      key?: string | number;
      style?: CustomCSSProperties;
      ref?: ((x: HTMLElementTagNameMap[K]) => void) | MyRef<HTMLElementTagNameMap[K]>;
      children?: MyReactNode;
    } : never;
  }
}

export const globalHocMap = new WeakMap<MyElementType, MyElementType>();
let pid = 0;
function transformProps<T extends MyProps>(props: T): T {
  const ret = { [Symbol('debugger.id')]: pid ++ } as any;
  _.forEach(props, (v, k) => {
    if ((k.startsWith('on') || k === 'children') && _.isFunction(v)) {
      ret[k] = ((...args: []) => {
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

export function jsxDev<T extends MyElementType, 
P extends MyProps, K extends MyElmemetKey>(
  type: T, 
  props: P & (T extends MyFunctionComponent ? MyFunctionComponentProps<P> : MyProps),
  key: K
): MyElement<T, P, K> {

  // if (props.id === 'test') {
  //   console.trace('test', props)
  // }

  // const isMemo = type['$$typeof'] === window.reactMemoType;
  // const isForWardRef =  type['$$typeof'] === window.reactForwardRefType;
  // const bol = isMemo || isForWardRef
  let fnType = type;
  const originFnType = type;
  if (_.isFunction(fnType) && !fnType['jump-hoc']) {
    // if (!globalHocMap.has(type)) {
    //   globalHocMap.set(type, new Map());
    // }

    const hocMap = globalHocMap // .get(type);

    const targetKey = type;

    // console.error('hocMap----->', hocMap)

    if (!hocMap.has(targetKey)) {
      const obj = {
        [originFnType.name ?? 'generateComponent']: function (props, ref) {
          // return jsxDev((props, ref) => {
          //   console.error('render')
          //  return runInRecordLog(() => fnType(props, ref))
          // }, { ...props, ref }, key)
          // console.error('render----->', originFnType, key)
          // if (id ++ > 100) {
          //   throw new Error('test')
          // }
          return runInRecordLog(() => {
            // console.error('劫持----->', originFnType)
            const ret = originFnType(props, ref)
            // console.error('<-----劫持', originFnType)
            return ret
          })
        }
      };
      const generateComponent = obj[originFnType.name ?? 'generateComponent'];
      // console.error('hoc----->', originFnType)
      generateComponent['jump-hoc'] = true;
      hocMap.set(targetKey, changeType(type, generateComponent));
    }
    fnType = hocMap.get(targetKey);
    // if (id ++ > 100) {
    //   throw new Error('test')
    // }
    // console.log('enter---> ', fnType);
  } else {
    fnType = type;
  }

  const ret: MyElement<T, P, K> = {
    elementId: elementId++,
    $$typeof: window.reactType,
    type: fnType,
    props: transformProps(props),
    key: _.isNil(key) ? key : key as K,
    ref: transformRef(props.ref ?? null) as P['ref'],
    _owner: null,
    _store: {
      validated: false
    }
  };
  // console.log(ret)
  return ret;
}

export const Fragment = window.reactFragmentType ?? Symbol('React.Fragment')

export const jsxDEV = jsxDev;