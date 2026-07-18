import { clamp } from "../color/conversions";
import { useColorState } from "../hooks/useColorState";

export const Swatch = () => {
  const { state } = useColorState();
  const rgb = clamp(state.rgb).val;
  return (
    <div
      class="Swatch"
      style={{
        background: `rgb(${rgb[0] * 255}, ${rgb[1] * 255}, ${rgb[2] * 255})`,
      }}
    ></div>
  );
};
