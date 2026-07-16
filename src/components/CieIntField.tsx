import { useId } from "preact/hooks";

interface Props {
  index: 0 | 1 | 2;
}

export const CieIntField = ({ index }: Props) => {
  const inputId = useId();
  return (
    <>
      <label for={inputId}>{"Lab"[index]}</label>
      <input id={inputId} type="number" value="0.50" step="0.01" />
    </>
  );
};
