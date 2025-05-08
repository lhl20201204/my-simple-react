import _ from "lodash"
import { useEffect, useMemo, useState } from "./utils"

function App2({ id, children }: {id: string, children?: any}) {
  console.log(id)
  useEffect(() => {
    console.log('create-', id);
    return () => {
      console.log('destroy-', id)
    }
  }, [])
  return <div>{id}有-&gt;&nbsp;
  {children}
  </div>
}

function App() {
  const [arr, setArr] = useState([1, 2, 3, 4])
  const dom = useMemo(() => {
    return <App2 id={'9'} key={9}></App2>
  }, [])
  return <div>
    <button key={1} onClick={() => {
      setArr([3, 1, 5])
    }}>点击跟还</button>
    {
      _.map(arr, f => {
        return <App2 id={f} key={f}></App2>
      })
    }
    {dom}
  </div>
}

const dom = <App />

export default dom;