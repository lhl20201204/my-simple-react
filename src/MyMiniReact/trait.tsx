import { MyFunctionComponent, MyFunctionComponentProps, MyMemoComponent } from "./type";

export function MyMemo<T extends MyFunctionComponent>(Comp: T, 
  comp?: (oldProps: MyFunctionComponentProps<T>, newProps: MyFunctionComponentProps<T>) => boolean ): MyMemoComponent<T> {
    return {
      $$typeof: window.reactMemoType,
      type: Comp,
      compare: comp ?? null,
    };
  }
