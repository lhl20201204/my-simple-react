import _ from "lodash"
import { memo, useEffect, useMemo, useRef, useState } from "./utils"

const App2 = (function ({ id, children }: {id: string | number, children?: any}) {
  const ref = useRef(null);
  console.log(id)
  useEffect(() => {
    console.log('create-', id, [ref.current]);
    return () => {
      console.log('destroy-', id)
    }
  }, [])
  return <div ref={ref}>{id}有-&gt;&nbsp;
  {children}
  </div>
})

const MemoApp2 = memo(App2);

function App() {
  const [arr, setArr] = useState([1, 2, 3, 4])
  const dom = useMemo(() => {
    return <MemoApp2 id={'9'} key={9}></MemoApp2>
  }, [])

  // console.log(<MemoApp2 id={'9'} key={10} />, <><div></div><span></span></>)

  useEffect(() => {
    setTimeout(() => {
      console.warn('----')
      setArr([5, 7, 8, 1, 3])

      setTimeout(() => {
        setArr([2, 1])
      }, 3000);
    }, 3000);
  }, [])


  
  return <div>
    <button key={1} onClick={() => {
      
      const arr = [5, 1, 8, 2, 7, 4, 3, 6] || new Array(Math.floor(Math.random() * 10) + 1).fill(0).map((c, i) => i + 1).sort(() => Math.random() - 0.5);
      console.log(arr)
      setArr(arr)
    }}>点击跟还</button>
        <>
    <div>div</div>
    <span>span</span>
    </>
    {
      _.map(arr, f => {
        return <MemoApp2 id={f} key={f}></MemoApp2>
      })
    }
    {dom}
  </div>
}

const dom = <App />

export default dom;