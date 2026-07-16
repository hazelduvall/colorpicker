import { useId } from "preact/hooks";

interface Props {
  index: 0 | 1 | 2;
}

export const RgbIntField = ({ index }: Props) => {
  const inputId = useId();
  return (
    <>
      <label for={inputId}>{"RGB"[index]}</label>
      <input
        id={inputId}
        type="number"
        value="127"
        min="0"
        max="255"
        step="1"
      />
    </>
  );
};
