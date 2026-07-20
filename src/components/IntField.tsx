import { Vector3D } from "ciebase-ts";
import type { InputHTMLAttributes, TargetedEvent } from "preact";
import { useCallback, useEffect, useId, useRef, useState } from "preact/hooks";
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
    mkInputAttrs: (i) => ({
      min: "0",
      step: "1",
      max: "255",
      style: {
        accentColor:
          i === 0 ? "red" : i === 1 ? "green" : i === 2 ? "blue" : undefined,
      },
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

  // space & index aren't _actually_ going to change, no no need to be reactive wrt any of these
  const { label, mkInputAttrs, valueToString, valueFromElem, mkAction } =
    perSpace[space];
  const inputAttrs = mkInputAttrs(index);

  const color = state[space].val;
  const colorRef = useRef(color);
  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  const value = valueToString(color[index]);
  const setValue = useCallback((elem: HTMLInputElement): void => {
    const oldColor = colorRef.current;
    const newColor: Vector3D = [oldColor[0], oldColor[1], oldColor[2]];
    const newValue = valueFromElem(elem.valueAsNumber);
    newColor[index] = newValue;
    dispatch(mkAction(newColor));
  }, []);

  const onChange = useCallback(
    (e: TargetedEvent<HTMLInputElement>): void => {
      setValue(e.currentTarget);
    },
    [setValue],
  );

  // Make scrolling while hovered over the div change the value
  const [div, setDiv] = useState<HTMLDivElement | null>(null);
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!div || !input) return;

    const listener = (e: WheelEvent) => {
      if (e.deltaY < 0) {
        input.stepUp();
        setValue(input);
      } else if (e.deltaY > 0) {
        input.stepDown();
        setValue(input);
      }
    };
    div.addEventListener("wheel", listener);
    return () => div.removeEventListener("wheel", listener);
  }, [div, input, setValue]);

  const numberInputId = useId();
  return (
    <div ref={setDiv} class="IntField">
      <label for={numberInputId}>{label[index]}</label>
      <input
        id={numberInputId}
        ref={setInput}
        class="NumberInput"
        type="number"
        {...inputAttrs}
        value={value}
        onChange={onChange}
      />
      <input
        type="range"
        class="SliderInput"
        {...inputAttrs}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};
