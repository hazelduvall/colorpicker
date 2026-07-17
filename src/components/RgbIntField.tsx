import type { Vector3D } from "ciebase-ts";
import { useId } from "preact/hooks";
import { useColorState } from "../hooks/useColorState";

interface Props {
  index: 0 | 1 | 2;
}

export const RgbIntField = ({ index }: Props) => {
  const { state, dispatch } = useColorState();
  const value = Math.round(state.rgb.val[index] * 255);

  const inputId = useId();
  return (
    <>
      <label for={inputId}>{"RGB"[index]}</label>
      <input
        id={inputId}
        type="number"
        value={value}
        min="0"
        max="255"
        step="1"
        onChange={(e) => {
          const newValue = e.currentTarget.valueAsNumber / 255;
          const newRgb: Vector3D = [
            state.rgb.val[0],
            state.rgb.val[1],
            state.rgb.val[2],
          ];
          newRgb[index] = newValue;
          dispatch({
            type: "SetRgbAction",
            rgb: { space: "RGB", inGamut: state.rgb.inGamut, val: newRgb },
          });
        }}
      />
    </>
  );
};
