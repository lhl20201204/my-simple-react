import WindomDom from "./test7";
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