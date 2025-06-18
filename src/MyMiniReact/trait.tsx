import { MyForwardRefComponent, MyFunctionComponent, MyFunctionComponentProps, MyMemoComponent } from "./type";

export function MyMemo<G extends MyFunctionComponent ,T extends MyFunctionComponent | MyForwardRefComponent<
G>>(Comp: T, 
  comp?: (oldProps: MyFunctionComponentProps<T>, newProps: MyFunctionComponentProps<T>) => boolean ): MyMemoComponent<T> {
    return {
      $$typeof: window.reactMemoType,
      type: Comp,
      compare: comp ?? null,
    } as MyMemoComponent<T>
  }

export function MyForwardRef<T extends MyFunctionComponent>(Comp: T): MyForwardRefComponent<T> {
  return {
    $$typeof: window.reactForwardRefType,
    render: Comp
  } as MyForwardRefComponent<T>
}
