import { IntField } from "./IntField";
import { RgbHex } from "./RgbHex";
import { Swatch } from "./Swatch";

export const Controls = () => {
  return (
    <div class="Controls">
      <div class="ControlsHorizontal">
        <Swatch />
        <RgbHex />
      </div>
      <div class="ControlsLab">
        <IntField space="lab" index={0} />
        <IntField space="lab" index={1} />
        <IntField space="lab" index={2} />
      </div>
      <div class="ControlsRgb">
        <IntField space="rgb" index={0} />
        <IntField space="rgb" index={1} />
        <IntField space="rgb" index={2} />
      </div>
    </div>
  );
};
