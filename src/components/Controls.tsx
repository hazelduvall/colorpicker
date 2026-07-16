import { BigSlider } from "./BigSlider";
import { CieIntField } from "./CieIntField";
import { RgbHex } from "./RgbHex";
import { RgbIntField } from "./RgbIntField";
import { Swatch } from "./Swatch";

export const Controls = () => {
  return (
    <div class="controls">
      <div class="controls-horiz">
        <BigSlider />
        <Swatch />
        <RgbHex />
      </div>
      <div class="controls-cie">
        <CieIntField index={0} />
        <CieIntField index={1} />
        <CieIntField index={2} />
      </div>
      <div class="controls-rgb">
        <RgbIntField index={0} />
        <RgbIntField index={1} />
        <RgbIntField index={2} />
      </div>
    </div>
  );
};
