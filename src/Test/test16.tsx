import _ from "lodash";
import { MyReactNode } from "../MyMiniReact/type";
import { Component, Suspense, use, useEffect, useState } from "./utils";

const promise = new Promise(r => {
  setTimeout(() => {
    r('异步资源')
  }, 3000)
})

function B() {
  const x = use(promise)
  return <div>{x}
    <div><C /></div>
  </div>
}

function C() {
  const [cnt, setCnt] = useState(0);
  if (cnt > 3) {
    throw new Error('渲染出问题')
  }
  return <div onClick={() => {
    setCnt(cnt + 1)
  }}>cnt ={cnt}
    {cnt >= 1 && <D cnt={cnt} />}
  </div>
}

const promise2 = new Promise(r => setTimeout(c => r('异步10s的res2'), 5000))

const promise3 = new Promise(r => setTimeout(c => r('异步5s的res1'), 3000))

let testid = 0;

class D extends Component<{ cnt: number }> {
  // componentDidMount(): void {
  //   throw promise2;
  // }

  state = {
    ttt: 1,
    res1: 'res1',
  }

  shouldComponentUpdate(nextProps: Readonly<{ cnt: number; }>, nextState: Readonly<{}>): boolean {
    console.log('D -shouldComponentUpdate')
    return true;
  }

  // getSnapshotBeforeUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any): void {
  //   throw new Error('9999999');
  // }

  constructor(props) {
    super(props);
    console.log('重新创建D组件')
    const res1 = use(promise3);
    this.state.res1 = res1;
    // throw new Error('9999999');
  }

  // static getDerivedStateFromProps() {
  //   throw new Error('9999999');
  // }


  render(): MyReactNode {
    console.log('render-D');
    const res1 = this.state.res1
    console.log('res1---', res1, this.props.cnt, this.state.ttt)
    // if (testid++ === 0) {
    //   throw 'render过程中出错'
    // }

    return <div>
      <button onClick={() => {
        this.setState({
          ttt: this.state.ttt + 1
        })
      }}>更改自身状态</button>
      class - {
        this.props.cnt
      }
      ==== <H />
      {this.state.ttt}
    </div>
  }
}

function H() {
  const res2 = use(promise2);
  console.log('render-H---', res2)

  useEffect(() => {
    console.log('H-create')
    return () => {
      console.log('H-destroy')
    }
  }, [])
  return <div>{res2}</div>;
}

function J() {
  useEffect(() => {
    console.log('J-create')
    return () => {
      console.log('J-destroy')
    }
  }, [])
  return <div>J</div>
}

class E extends Component {
  state = {
    E: 1
  }
  componentDidCatch(error: Error, errorInfo: MyReact.ErrorInfo): void {
    // console.log('E 组件中间层捕获');
    this.setState({
      E: 2
    })
  }
  static getDerivedStateFromError(...args) {
    console.log('E --->getDerivedStateFromError', [...args])
    return {
      E: 2
    }
  }

  constructor(props) {
    super(props);
    console.log('constructor-E')
  }

  componentWillUnmount(): void {
    console.log('E 被卸载')
  }
  render(): MyReactNode {
    console.log('render---E', this, _.cloneDeep(this), this.state.E)
    return <div>
      <div>D=pre</div>
      <J />
      <D cnt={this.state.E} />
      <div>D=sibilings</div>
    </div>
  }
}

function F() {
  console.log('render-F')
  return <div>F</div>
}

class A extends Component {
  state = {
    error: null
  }

  static getDerivedStateFromError(...args) {
    console.log('A --->getDerivedStateFromError', [...args])
    return {
      error: '33333'
    };
  }

  componentDidCatch(error: Error, errorInfo: MyReact.ErrorInfo): void {
    console.log('A---->componentDidCatch', error)
    this.setState({
      error: error.message ?? 'error---->'
    })
    // throw error;
  }

  componentWillUnmount(): void {
    console.log('A 组件卸载');
  }

  render() {
    console.log('renderA ------', this.state)
    if (this.state.error) {
      return <div>
        发生错误了。。。。
        <button onClick={() => {
          this.setState({
            error: null
          })
        }}>重置错误</button>
      </div>
    }
    // return <B />
    return <Suspense fallback={<Loading />}>
      {/* <D cnt={1} /> */}
      <div>E=prev</div>
      <E />
      {/* <F /> */}
      <G />
      <div ref={(x) => {
        console.log('ref', [x])
      }}>E=sibliing</div>
    </Suspense>
  }
}

function G() {
  console.log('render-G')
  useEffect(() => {
    console.log('G-create');
    return () => {
      console.log('G-destroy')
    }
  }, [])
  return 'G'
}

function Loading() {
  console.log('render-Loading')
  useEffect(() => {
    console.log('loading-create');
    return () => {
      console.log('loading-destroy')
    }
  }, [])
  return 'loading'
}


function App() {
  const [show, setShow] = useState(true)
  // return <div> 
  //   <button onClick={() => setShow(false)}>隐藏</button>
  //  <div>A---prev</div> 
  //   {show && <A /> }
  //  <div>A-sibling</div>
  // </div>

  return <Suspense fallback={'appLoading'}><A /></Suspense>
}


const dom1 = <App />

export default dom1;
