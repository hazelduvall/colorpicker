import { Vector3D } from "ciebase-ts";
import { createContext } from "preact";
import type { Dispatch, Reducer } from "preact/compat";
import {
  useContext,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from "preact/compat";
import type { Action, Color, ColorState } from "../color/ColorState";
import { cielabToSrgb, srgbToCielab } from "../color/conversions";

const ColorStateContext = createContext<{
  state: ColorState;
  dispatch: Dispatch<Action>;
} | null>(null);

const colorStateReducer: Reducer<ColorState, Action> = (state, action) => {
  switch (action.type) {
    case "SetRgbAction":
      return {
        rgb: action.rgb,
        lab: srgbToCielab(action.rgb),
        chroma: state.chroma,
      };
    case "SetLabAction":
      return {
        rgb: cielabToSrgb(action.lab),
        lab: action.lab,
        chroma: state.chroma,
      };
    case "SetChromaAction":
      return {
        rgb: state.rgb,
        lab: state.lab,
        chroma: action.chroma,
      };
    default:
      throw new Error("Unexpected action");
  }
};

export const ColorStateProvider = ({ children }: PropsWithChildren) => {
  const defaultState = useMemo(() => {
    const val: Vector3D = [Math.random(), Math.random(), Math.random()];
    const rgb: Color<"rgb"> = { space: "rgb", inGamut: true, val };
    const lab = srgbToCielab(rgb);

    return { rgb, lab, chroma: 1.0 };
  }, []);

  const [state, dispatch] = useReducer<ColorState, Action>(
    colorStateReducer,
    defaultState,
  );
  return (
    <ColorStateContext.Provider value={{ state, dispatch }}>
      {children}
    </ColorStateContext.Provider>
  );
};

export const useColorState = () => {
  const colorState = useContext(ColorStateContext);
  if (!colorState) {
    throw new Error(
      "useColorState() MUST be used inside <ColorStateProvider />",
    );
  }
  return colorState;
};
