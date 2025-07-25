import { FORCEUPDATE, UPDATE } from "./const";
import { getDispatchAction } from "./hook";
import { MyReactNode, MyProps, MyState, MyContext, MyFiber, IMyClassComponent, MyFiberRef } from "./type";

export default class MyClassComponent<P extends MyProps = {}, S extends MyState = {}> implements IMyClassComponent<P, S> {
  props: P & { ref?: MyFiberRef<InstanceType<typeof MyClassComponent<P, S>>> }
  constructor(props: P) {
    this.props = props;
  }
  // ref?: (x: InstanceType<typeof MyClassComponent<P, S>> | null) => void;
  state: S = {} as S;
  context: Record<string, any> = {};
  _reactInternals: MyFiber | null = null;
  updateList?: (Partial<S> | ((c: Partial<S>) => Partial<S>))[] = [];
  forceUpdateList: Function[] = [];
  dispatchAction?: (x: Partial<S> | ((prevState: Readonly<S>) => Partial<S>)) => void
  forceUpdateDispatchAction?: (cb: Function) => void;



  isReactComponent() {
    return true
  }

  // forceUpdateDispatchAction 

  setState(state: Partial<S> | ((prevState: Readonly<S>) => Partial<S>)) {
    if (!this.dispatchAction) {
      this.dispatchAction = getDispatchAction(
        this._reactInternals,
        this.updateList,
        () => this.state,
        (state) => {
          this.updateList.push(state)
        },
        UPDATE
      )
    }
    this.dispatchAction(state);
  }

  forceUpdate(cb?: Function) {
    if (!this.forceUpdateDispatchAction) {
      this.forceUpdateDispatchAction = getDispatchAction(
        this._reactInternals,
        this.forceUpdateList,
        () => (() => null), // 固定返回一个新的空函数，保证新推入的一定不同
        (cb) => {
          this.forceUpdateList.push(cb)
        },
        FORCEUPDATE
      )
    }
    this.forceUpdateDispatchAction(cb || (() => null))
  }

  render(): MyReactNode {
    return null;
  }

  componentDidMount?(): void;
  componentDidUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot?: any): void;
  componentWillUnmount?(): void;
  shouldComponentUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>): boolean;
  getSnapshotBeforeUpdate?: (prevProps: Readonly<P>, prevState: Readonly<S>) => any;
  componentDidCatch?(error: Error, errorInfo: MyReact.ErrorInfo): void;
  static getDerivedStateFromError?(error: Error): Partial<any> | null { return null; }
  static getDerivedStateFromProps?(nextProps: any, currentState: any): any | null { return null; }
  static contextType?: MyContext<any>;
}