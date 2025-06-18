
function App() {
 return <div style={{ color: 'red'}} ref={(x) => {
   console.log(x);
 }} >
  <div></div>
 </div>
}

const dom = <App />

export default dom;