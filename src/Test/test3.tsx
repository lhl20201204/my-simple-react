import _ from "lodash"
import { memo, useEffect, useMemo, useRef, useState } from "./utils"
import { test3Diff, testMemoryLeak } from "../MyMiniReact/test";

const App2 = (function ({ id, children }: { id: string | number, children?: any }) {
  const ref = useRef(null);
  console.log(id)
  const obj = {
    [id]: function () {
      console.log('create-' + id, [ref.current]);
      return () => {
        console.log('destroy-' + id)
      }
    }
  };
  useEffect(obj[id], [])
  return <div ref={ref} id={id}>{id}有-&gt;&nbsp;
    {children}
  </div>
})

const MemoApp2 = memo(App2);

function App() {
  const [arr, setArr] = useState(['1'])
  const dom = useMemo(() => {
    return <MemoApp2 id={'9'} key={9}></MemoApp2>
  }, [])

  // console.log(<MemoApp2 id={'9'} key={10} />, <><div></div><span></span></>)

  useEffect(() => {
  }, [arr])

  useEffect(() => {
    // test3Diff(setArr, [])
    // setTimeout(() => {
    //   setArr(['4', '10', '2', '1', '7', '3', '5', '6', '8', '9'])
    //   setTimeout(() => {
    //     setArr( ['6', '5', '4', '15', '3', '2', '9', '13', '8', '14', '10', '11', '1', '12', '7'])
    //   }, 1000)
    // }, 1000)
    setTimeout(() => {
      test3Diff(setArr, arr, [
        [
          "19",
          "13",
          "14",
          "12",
          "17",
          "6",
          "9",
          "5",
          "10",
          "11",
          "16",
          "7",
          "15",
          "18",
          "8"
        ],
        [
          "13",
          "12",
          "14",
          "15",
          "8",
          "3",
          "6",
          "9",
          "10",
          "4",
          "17",
          "5",
          "2",
          "7",
          "16",
          "1",
          "11"
        ],
        [
          "6",
          "7",
          "8",
          "9"
        ]
      ])
    }, 1000)
  }, [])



  return <div>
    <div id="test-diff-dom">{
      _.map(arr, f => {
        return <MemoApp2 id={f} key={f}></MemoApp2>
      })
    }</div>
    <button key={1} onClick={() => {
      // const arr = new Array(Math.floor(Math.random() * 10) + 1).fill(0).map((c, i) => i + 1).sort(() => Math.random() - 0.5);
      // console.error(arr)
      // setArr(arr)
      testMemoryLeak(setArr, arr, 100)
    }}>点击跟还</button>
    <>
      <div>div</div>
      <span>span</span>
    </>
    {/* {dom} */}
  </div>
}

const dom = <App />

export default dom;