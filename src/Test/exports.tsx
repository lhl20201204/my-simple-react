import WindomDom from "./test3";
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