import { forwardRef, useImperativeHandle, useState } from "./utils";

const Post = forwardRef((props, ref) => {
  const [count, setCount] = useState(0);

  console.log('Post render, count:', count);

  useImperativeHandle(ref, () => {
    console.log('create handle, count:', count);
    return {
      value: count,
      test: () => console.log('test')
    };
  }, [count]); // 依赖 count，当 count 变化时会重新创建

  return (
    <div ref={(f) => {
      console.log('div', count,[f])
    }}>
      <button onClick={() => setCount(c => c + 1)}>
        increment
      </button>
    </div>
  );
});

function App() {
  const [ bol, setBol] = useState(true);
  return (
    bol ?
    <Post ref={instance => {
      console.log('ref callback called with:', instance);
      if (instance && instance.value > 3) {
        setBol(false)
      }
    }} /> : 'unmount'
  );
}

 const dom1 = <App />

 export default dom1;

