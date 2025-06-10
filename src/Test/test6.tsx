import { useState } from "./utils";

 function App() {
  const [isFancy, setIsFancy] = useState(false);
  console.log('render-isFancy', isFancy)
  return (
    <div>
      {isFancy ? (
        <Counter isFancy={true} /> 
      ) : (
        <Counter isFancy={false} /> 
      )}
      <label>
        <input
          type="checkbox"
          checked={isFancy}
          onChange={e => {
            console.log('change', e.target.checked)
            setIsFancy(e.target.checked)
          }}
        />
        使用好看的样式
      </label>
    </div>
  );
}

function Counter({ isFancy }) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(false);

  let style = {}
  if (hover) {
    style = {
      ...style,
      border: '1px solid red'
    }
  }
  if (isFancy) {
    style = {
      ...style,
      background: 'blue'
    }
  }

  return (
    <div
      style={style}
      onMouseEnter={() => {
        console.log('enter')
        setHover(true)
      }}
      onMouseLeave={() =>{ 
        console.log('leave')
        setHover(false)
      }}
    >
      <h1>{score}</h1>
      <button onClick={() => setScore(score + 1)}>
        加一
      </button>
    </div>
  );
}
 
 const dom1 = <App />

 export default dom1;
