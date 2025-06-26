import WindomDom from "./test11";
import { useEffect } from "./utils";

function A() {
  useEffect(() => {
  }, [])
  return <>
  <div key={'nullDiv'}></div>
  {WindomDom}
  </>;
}

export default <A />;