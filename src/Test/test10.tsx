import { Suspense, createContext, lazy, useContext, useEffect, useState } from "./utils";

const LazyComponent = lazy(async () => {
  await new Promise(r => setTimeout(r, 3000))
  return {
    default: function LazyComponent2(props) {
      console.log('props', props);
      useEffect(() => {
        console.log('lazy-mounted', LazyComponent, LazyComponent._payload._status, LazyComponent._payload._result);
        return () => {
          console.log('unmount');
        }
      }, [])

      return <div>LazyComponent</div>
    }
  }
});

function Middle({ children, id }: any) {
  console.log('middle-render-' + id);
  useEffect(() => {
    console.log('middle-mounted' + id);
    return () => {
      console.log('middle-unmounted' + id);
    }
  }, [])
  return children
}


function Loading() {
  console.log('loading-render');
  useEffect(() => {
    console.log('loading-mounted');
    return () => {
      console.log('loading-unmounted');
    }
  }, [])
  return <div>loading...</div>
}

const Context = createContext({ value: 1111 });

function Grandson() {
  const { value } = useContext(Context);
  return <div>Grandson: {value}</div>
}

function App() {
  const [value, setValue] = useState(1111);
  console.log('app-render', LazyComponent._payload._status, LazyComponent._payload._result);

  useEffect(() => {
    console.log('App-mounted', LazyComponent, LazyComponent._payload._status, LazyComponent._payload._result);
  }, [1111])

  return <Context.Provider value={{ value }}>
    <div id="AppTest" ref={
      (x) => {
        console.log('ref', [x])
        setTimeout(() => {
          console.log('setTimeout-ref', [x])
        }, 3000)
      }
    }><Suspense fallback={<Loading />}>
        <Middle id={'m1'} key={"m1"}>m1111</Middle>
        <Middle id={'m2'} key={"m2"}><LazyComponent test /></Middle>
        <Middle id={'m3'} key={"m3"}><Grandson /></Middle>
      </Suspense>
      <button onClick={() => {
        setValue(value + 1)
      }}>click</button>
    </div>
  </Context.Provider>
}
const dom = <App key={'test10'} />

export default dom;

