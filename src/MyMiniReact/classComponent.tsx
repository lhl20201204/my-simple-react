import { MyReactNode, MyProps, MyState, MyContext } from "./type";

export default class MyClassComponent<P extends MyProps = {}, S extends MyState = {}> {
  props: P;
  state: S = {} as S;
  context: Record<string, any> = {};
  constructor(props: P) {
    this.props = props;
  }

  isReactComponent = {};

  setState(state: Partial<S> | ((prevState: Readonly<S>) => Partial<S>)) {
    if (typeof state === 'function') {
      this.state = { ...this.state, ...state({...this.state} as S) };
    } else {
      this.state = { ...this.state, ...state };
    }
  }

  forceUpdate() {
    
  }
  
  render(): MyReactNode {
    return null;
  }

  componentDidMount? (): void;
  componentDidUpdate? (prevProps: Readonly<P>, prevState: Readonly<S>, snapshot?: any): void;
  componentWillUnmount? (): void;
  shouldComponentUpdate? (nextProps: Readonly<P>, nextState: Readonly<S>): boolean;
  getSnapshotBeforeUpdate?: (prevProps: Readonly<P>, prevState: Readonly<S>) => any;
  componentDidCatch? (error: Error, errorInfo: MyReact.ErrorInfo): void;
  static getDerivedStateFromError?(error: Error): Partial<any> | null { return null; }
  static getDerivedStateFromProps?(nextProps: any, currentState: any): any | null { return null; }
  static contextType?: MyContext<any>;
}