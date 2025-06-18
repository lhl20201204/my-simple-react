import _ from "lodash"
import { forwardRef, memo, useEffect, useMemo, useRef, useState } from "./utils"
import { test3Diff, testMemoryLeak } from "../MyMiniReact/test";

const App2 = (function ({ id, children }: { id: string | number, children?: any }, ref2) {
  if (Number(id) < 0) {
    console.log('ref' + id, { ref2 })
  }
  const ref = ref2 ?? useRef(null);
  console.log(id)
  useEffect(() => {
    console.log('create-' + id, [ref.current]);
    return () => {
      console.log('destroy-' + id)
    }
  }, [])
  return <div ref={ref} id={id}>{id}有-&gt;&nbsp;
    {children}
  </div>
})

const MemoApp2 = memo(App2);

const ForwardApp2 = forwardRef(App2);

const MemoForwardApp2 = memo(ForwardApp2);

function App() {
  const [arr, setArr] = useState(['1'])
  const ref = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);
  const dom = useMemo(() => {
    return <ForwardApp2 id={-1} key={-1} ref={ref}></ForwardApp2>
  }, [])

  const dom2 = useMemo(() => {
    return <MemoForwardApp2 id={-2} key={-2} ref={ref2}>
      <div></div>
      <ForwardApp2 id={-3} key={-3} ref={ref3}></ForwardApp2>
    </MemoForwardApp2>
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
      testMemoryLeak(setArr, arr, [
        [
          "12",
          "9",
          "19",
          "20",
          "14",
          "13",
          "10",
          "17",
          "15",
          "16",
          "18",
          "11"
        ],
        [
          "13",
          "6",
          "15",
          "5",
          "4",
          "7",
          "8",
          "11",
          "16",
          "14",
          "9",
          "17",
          "12",
          "10"
        ],
        [
          "18",
          "16",
          "25",
          "21",
          "26",
          "23",
          "20",
          "27",
          "22",
          "17",
          "24",
          "19"
        ],
        [
          "1",
          "8",
          "7",
          "2",
          "3",
          "9",
          "6",
          "4",
          "10",
          "11",
          "5"
        ],
        [
          "19",
          "18",
          "24",
          "21",
          "22",
          "17",
          "16",
          "28",
          "23",
          "25",
          "27",
          "26",
          "20"
        ],
        [
          "19",
          "23",
          "15",
          "24",
          "18",
          "16",
          "21",
          "17",
          "20",
          "22"
        ],
        [
          "15",
          "14",
          "13",
          "12"
        ],
        [
          "20",
          "23",
          "11",
          "26",
          "12",
          "17",
          "27",
          "13",
          "21",
          "22",
          "18",
          "15",
          "16",
          "14",
          "25",
          "19",
          "24"
        ],
        [
          "9",
          "25",
          "8",
          "20",
          "23",
          "14",
          "13",
          "15",
          "21",
          "17",
          "22",
          "24",
          "19",
          "10",
          "11",
          "12",
          "16",
          "18"
        ],
        [
          "21",
          "20",
          "19",
          "18",
          "17",
          "16"
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
      testMemoryLeak(setArr, arr, [
        [
          "18",
          "13",
          "19",
          "21",
          "10",
          "17",
          "9",
          "27",
          "25",
          "14",
          "16",
          "11",
          "15",
          "24",
          "26",
          "22",
          "12",
          "20",
          "23"
        ],
        [
          "12",
          "11",
          "10",
          "9",
          "13",
          "14",
          "8",
          "7"
        ],
        [
          "3",
          "1",
          "2"
        ],
        [
          "14",
          "15",
          "13",
          "12"
        ]
      ])
    }}>点击跟还</button>
    <>
      <div>div</div>
      <span>span</span>
    </>
    {/* {dom}
    {dom2} */}
    {[dom, dom2]}
  </div>
}

const dom = <App />

export default dom;