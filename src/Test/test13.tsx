import { MyRef } from "../MyMiniReact/type";
import { Component, createContext, useEffect } from "./utils";

// 定义组件 props 和 state 的类型
interface ParentComponentProps { }

interface ParentComponentState {
  showChild: boolean;
  childProps: {
    name: string;
    count: number;
  };
}

interface LifecycleTestComponentProps {
  name: string;
  count: number;
}

interface LifecycleTestComponentState {
  count: number;
  message: string;
  shouldUpdate: boolean;
  externalCount?: number;
  hasError?: boolean;
  error?: Error | null;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const Ctx = createContext({
  cnt: 1
})

function C({ count }: { count: number}) {
  console.log('render-c', count)
  useEffect(() => {
    console.log('C-create', count);
    return () => {
       console.log('C-destroy', count);
    }
  }, [count])
  return <div>c</div>
}

// 父组件 - 用于测试组件挂载和卸载
class ParentComponent extends Component<ParentComponentProps, ParentComponentState> {
  state = {
    showChild: true,
    childProps: {
      name: 'Child Component',
      count: 0
    }
  }

  static contextType = Ctx;

  constructor(props: ParentComponentProps) {
    super(props);
    console.error('🔄 ParentComponent - constructor', { props }, this);
  }

  componentDidMount() {
    console.log('✅ ParentComponent - componentDidMount');
  }

  componentDidUpdate(prevProps: ParentComponentProps, prevState: ParentComponentState) {
    console.log('🔄 ParentComponent - componentDidUpdate', {
      prevProps,
      prevState,
      currentProps: this.props,
      currentState: this.state
    });
  }

  componentWillUnmount() {
    console.log('❌ ParentComponent - componentWillUnmount');
  }

  handleToggleChild = () => {
    console.log('🔄 ParentComponent - 切换子组件显示状态');
    this.setState(prevState => ({
      showChild: !prevState.showChild
    }));
  }

  handleUpdateChildProps = () => {
    console.log('🔄 ParentComponent - 更新子组件属性');
    this.setState(prevState => ({
      childProps: {
        ...prevState.childProps,
        count: prevState.childProps.count + 1
      }
    }));
  }

  throwError = () => {
    this.setState(() => ({
      childProps: {
        ...this.state.childProps,
        count: 5
      }
    }))
  }

  ref: MyRef<InstanceType<typeof LifecycleTestComponent>> = {
    current: null
  }

  render() {
    console.log('🎨 ParentComponent - render', this.context);
    return (
      <div ref={(x) => {
        console.log('ref', [x]);
      }} style={{ padding: '20px', border: '2px solid #007acc', margin: '10px' }}>
        <h2 key={'t1'}>父组件</h2>
        <button key={'t2'} onClick={this.handleToggleChild}>
          {this.state.showChild ? '隐藏' : '显示'} 子组件
        </button>
        <button key={'t3'} onClick={this.handleUpdateChildProps} style={{ marginLeft: '10px' }}>
          更新子组件属性
        </button>
        <button key={'t4'} onClick={this.throwError} style={{ marginLeft: '10px' }}>
          抛出错误
        </button>
        <A
          {...this.state.childProps}
          key={'tA'}
        />
        {this.state.showChild && (
          <LifecycleTestComponent
            ref={((x) => {
              console.warn('LifecycleTestComponent', x)
              this.ref.current = x;
            })}
            {...this.state.childProps}
            key={this.state.childProps.count} // 强制重新创建组件
          />
        )}
        <C count={this.state.childProps.count} />
      </div>
    );
  }
}

function A(props: ParentComponentState['childProps']) {
  if (props.count > 4) {
    console.error('抛出错误。。。。')
    throw new Error('test');
  }
  return <div>A={props.count}</div>
}

// 主要的生命周期测试组件
class LifecycleTestComponent extends Component<LifecycleTestComponentProps, LifecycleTestComponentState> {
  private timer: number | null = null;

  constructor(props: LifecycleTestComponentProps) {
    super(props);
    console.log('🔄 LifecycleTestComponent - constructor', { props });
    this.state = {
      count: 0,
      message: 'Hello from state',
      // externalCount: 0,
      shouldUpdate: true
    };
  }

  // 静态方法 - 用于错误边界
  static getDerivedStateFromProps(nextProps: LifecycleTestComponentProps, prevState: LifecycleTestComponentState) {
    console.log('🔄 LifecycleTestComponent - getDerivedStateFromProps', {
      nextProps,
      prevState
    });

    // 如果 props 中的 count 发生变化，更新 state
    if (nextProps.count !== prevState.externalCount) {
      return {
        externalCount: nextProps.count,
        message: `External count changed to ${nextProps.count}`
      };
    }
    return null;
  }

  componentDidMount() {
    console.log('✅ LifecycleTestComponent - componentDidMount');

    // 设置定时器
    this.timer = setInterval(() => {
      this.setState(prevState => {
        console.warn('preveState', prevState)
        return {
          count: prevState.count + 1
        }
      });
    }, 3000);
  }

  shouldComponentUpdate(nextProps: LifecycleTestComponentProps, nextState: LifecycleTestComponentState) {
    console.log('🤔 LifecycleTestComponent - shouldComponentUpdate', {
      currentProps: this.props,
      nextProps,
      currentState: this.state,
      nextState,
      shouldUpdate: this.state.shouldUpdate
    });

    // 如果 shouldUpdate 为 false，阻止更新
    if (!this.state.shouldUpdate) {
      console.log('🚫 LifecycleTestComponent - 更新被阻止');
      return false;
    }

    return true;
  }

  componentDidUpdate(prevProps: LifecycleTestComponentProps, prevState: LifecycleTestComponentState, snapshot?: any) {
    console.log('🔄 LifecycleTestComponent - componentDidUpdate', {
      prevProps,
      prevState,
      currentProps: this.props,
      currentState: this.state,
      snapshot
    });
  }

  componentWillUnmount() {
    console.log('❌ LifecycleTestComponent - componentWillUnmount');

    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // 错误边界方法
  static getDerivedStateFromError(error: Error) {
    console.log('🚨 LifecycleTestComponent - getDerivedStateFromError', { error });
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.log('🚨 LifecycleTestComponent - componentDidCatch', { error, errorInfo });
  }

  handleIncrement = () => {
    console.log('🔄 LifecycleTestComponent - 增加计数');
    this.setState(prevState => {
      console.warn('prevState', prevState)
      return ({
        count: prevState.count + 1
      })
    });
  }

  handleToggleUpdate = () => {
    console.log('🔄 LifecycleTestComponent - 切换更新状态');
    this.setState(prevState => {
      console.log('handleToggleUpdate', prevState)
      return ({
        shouldUpdate: !prevState.shouldUpdate
      })
    });
  }

  handleForceUpdate = () => {
    console.log('🔄 LifecycleTestComponent - 强制更新');
    this.forceUpdate();
  }

  handleThrowError = () => {
    console.log('🚨 LifecycleTestComponent - 抛出错误');
    throw new Error('这是一个测试错误');
  }

  render() {
    console.log('🎨 LifecycleTestComponent - render', {
      props: this.props,
      state: this.state
    });

    if (this.state.hasError) {
      return (
        <div style={{
          padding: '15px',
          border: '2px solid #ff4444',
          backgroundColor: '#ffeeee',
          margin: '10px'
        }}>
          <h3 key={'1'}>错误边界捕获到错误</h3>
          <p key={'2'}>错误信息: {this.state.error?.message}</p>
          <button key={'3'} onClick={() => this.setState({ hasError: false, error: null })}>
            重置错误
          </button>
        </div>
      );
    }

    return (
      <div style={{
        padding: '15px',
        border: '2px solid #4caf50',
        backgroundColor: '#f0f8f0',
        margin: '10px'
      }}>
        <h3 key={'1'}>生命周期测试组件</h3>
        <p key={'2'}><strong key={'1'}>Props:</strong> {this.props.name} (count: {this.props.count})</p>
        <p key={'3'}><strong key={'2'}>State:</strong> count: {this.state.count}, message: {this.state.message}</p>
        <p key={'4'}><strong key={'3'}>外部计数:</strong> {this.state.externalCount || '未设置'}</p>
        <p key={'5'}><strong key={'4'}>更新状态:</strong> {this.state.shouldUpdate ? '允许更新' : '阻止更新'}</p>

        <div key={'6'} style={{ marginTop: '10px' }}>
          <button key={'1'} onClick={this.handleIncrement} style={{ marginRight: '10px' }}>
            增加计数
          </button>
          <button key={'2'} onClick={this.handleToggleUpdate} style={{ marginRight: '10px' }}>
            {this.state.shouldUpdate ? '阻止更新' : '允许更新'}
          </button>
          <button key={'3'} onClick={this.handleForceUpdate} style={{ marginRight: '10px' }}>
            强制更新
          </button>
          <button key={'4'} onClick={this.handleThrowError} style={{
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            padding: '5px 10px'
          }}>
            抛出错误
          </button>
        </div>
      </div>
    );
  }
}

// 错误边界组件
class ErrorBoundary extends Component<{ children: any }, ErrorBoundaryState> {
  constructor(props: { children: any }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.log('🚨 ErrorBoundary - getDerivedStateFromError', { error });
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.log('🚨 ErrorBoundary - componentDidCatch', { error, errorInfo });
  }

  render() {
    console.log('render-ErrorBoundary', this.state)
    if (this.state.hasError) {
      return (
        <div key={'1'} style={{
          padding: '20px',
          border: '2px solid #ff4444',
          backgroundColor: '#ffeeee',
          margin: '10px'
        }}>
          <h2>错误边界</h2>
          <p>组件树中发生了错误</p>
          <p>错误信息: {this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            重置
          </button>
        </div>
      );
    }
    console.log(this.props.children)
    return this.props.children;
  }
}

// 根组件
const App = () => {
  console.log('🎨 App - render', [ErrorBoundary]);

  return (
    <ErrorBoundary key={'2'}>
      <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
        <h1 key={'1'} style={{ color: '#007acc', textAlign: 'center' }}>
          React 17.0.2 类组件生命周期测试
        </h1>
        <p key={'2'} style={{ textAlign: 'center', color: '#666' }}>
          打开浏览器控制台查看详细的生命周期日志
        </p>
        <Ctx.Provider value={{ cnt: 4444 }}>
          <ParentComponent key={'3'} />
        </Ctx.Provider>
      </div>
    </ErrorBoundary>
  );
};

const dom = <App key={'test13'} />

export default dom;
