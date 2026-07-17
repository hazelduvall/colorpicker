import { Vector3D } from "ciebase-ts";
import { useId } from "preact/hooks";
import { useColorState } from "../hooks/useColorState";

interface Props {
  index: 0 | 1 | 2;
}

export const CieIntField = ({ index }: Props) => {
  const { state, dispatch } = useColorState();
  const value = state.lab.val[index];

  const inputId = useId();
  return (
    <>
      <label for={inputId}>{"Lab"[index]}</label>
      <input
        id={inputId}
        type="number"
        value={value.toFixed(2)}
        step="0.01"
        onChange={(e) => {
          const newValue = e.currentTarget.valueAsNumber;
          const newLab: Vector3D = [
            state.lab.val[0],
            state.lab.val[1],
            state.lab.val[2],
          ];
          newLab[index] = newValue;
          dispatch({
            type: "SetLabAction",
            lab: { space: "LAB", inGamut: state.lab.inGamut, val: newLab },
          });
        }}
      />
    </>
  );
};
