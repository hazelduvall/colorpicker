import { Vector3D } from "ciebase-ts";
import { clamp } from "../color/conversions";
import { useColorState } from "../hooks/useColorState";
import { CopyButton } from "./CopyButton";

const toHex = (n: number) => {
  if (isNaN(n)) {
    return "";
  }
  const out = Math.round(n * 255).toString(16);
  if (out.length === 1) {
    // who needs left-pad?
    return "0" + out;
  } else {
    return out;
  }
};

const fromHex = (hex: string) => {
  return parseInt(hex, 16) / 255;
};

export const RgbHex = () => {
  const { state, dispatch } = useColorState();
  const rgb = clamp(state.rgb).val;
  const value = `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
  return (
    <>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          let newHex = e.currentTarget.value.trim();
          if (newHex.startsWith("#")) {
            newHex = newHex.slice(1);
          }

          if (newHex.length < 6) {
            return;
          }

          try {
            const rgb: Vector3D = [
              fromHex(newHex.slice(0, 2)),
              fromHex(newHex.slice(2, 4)),
              fromHex(newHex.slice(4, 6)),
            ];
            dispatch({
              type: "SetRgbAction",
              rgb: { space: "RGB", inGamut: true, val: rgb },
            });
          } catch (err) {
            console.error(err);
          }
        }}
      />
      <CopyButton value={value} />
    </>
  );
};
