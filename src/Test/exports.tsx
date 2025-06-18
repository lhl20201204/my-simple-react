import WindomDom from "./test6";
import { useEffect } from "./utils";

function A() {
  useEffect(() => {
  }, [])
  return <>
  <div></div>
  {WindomDom}
  </>;
}

export default <A />;