import { Vector3D } from "ciebase-ts";
import type { InputHTMLAttributes, TargetedEvent } from "preact";
import { useCallback, useId } from "preact/hooks";
import { Action } from "../color/ColorState";
import { clamp } from "../color/conversions";
import { useColorState } from "../hooks/useColorState";

type Space = "rgb" | "lab";
type Index = 0 | 1 | 2;

interface Props {
  space: Space;
  index: Index;
}

interface PerSpaceProps {
  label: string;
  mkInputAttrs: (index: Index) => InputHTMLAttributes;
  valueToString: (value: number) => string;
  valueFromElem: (elemValue: number) => number;
  mkAction: (newColor: Vector3D) => Action;
}

const perSpace: { [space in Space]: PerSpaceProps } = {
  rgb: {
    label: "RGB",
    mkInputAttrs: () => ({
      min: "0",
      step: "1",
      max: "255",
    }),
    valueToString: (value) => Math.round(value * 255).toString(),
    valueFromElem: (elemValue) => elemValue / 255,
    mkAction: (newColor) => {
      const rgbUnclamped = {
        space: "rgb",
        inGamut: true,
        val: newColor,
      } as const;
      const rgbClamped = clamp(rgbUnclamped);
      return { type: "SetRgbAction", rgb: rgbClamped };
    },
  },
  lab: {
    label: "Lab",
    mkInputAttrs: (i) =>
      i === 0
        ? { step: "0.001", min: "0", max: "1" }
        : { step: "0.001", min: "-1", max: "1" },
    valueToString: (value) => value.toFixed(3),
    valueFromElem: (elemValue) => elemValue,
    mkAction: (newColor) => {
      const lab = { space: "lab", inGamut: true, val: newColor } as const;
      return { type: "SetLabAction", lab };
    },
  },
};

export const IntField = ({ space, index }: Props) => {
  const { state, dispatch } = useColorState();
  const { label, mkInputAttrs, valueToString, valueFromElem, mkAction } =
    perSpace[space];
  const inputAttrs = mkInputAttrs(index);

  const color = state[space].val;
  const value = valueToString(color[index]);
  const setValue = useCallback(
    (e: TargetedEvent<HTMLInputElement>): void => {
      const newValue = valueFromElem(e.currentTarget.valueAsNumber);
      const newColor: Vector3D = [color[0], color[1], color[2]];
      newColor[index] = newValue;
      dispatch(mkAction(newColor));
    },
    [color, index],
  );

  const numberInputId = useId();
  return (
    <div class="IntField">
      <label for={numberInputId}>{label[index]}</label>
      <input
        id={numberInputId}
        class="NumberInput"
        type="number"
        {...inputAttrs}
        value={value}
        onChange={setValue}
      />
      <input
        type="range"
        class="SliderInput"
        {...inputAttrs}
        value={value}
        onChange={setValue}
      />
    </div>
  );
};
