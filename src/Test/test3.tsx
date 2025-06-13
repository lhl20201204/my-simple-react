import _ from "lodash"
import { forwardRef, memo, useEffect, useMemo, useRef, useState } from "./utils"
import { test3Diff, testMemoryLeak } from "../MyMiniReact/test";

const App2 = (function ({ id, children }: { id: string | number, children?: any }, ref2) {
  if (Number(id) < 0) {
  console.log('ref' + id,{ ref2 })
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
      testMemoryLeak(setArr, arr, 10 || [
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