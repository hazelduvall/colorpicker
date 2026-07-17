import { useCallback, useRef, useState } from "preact/hooks";

type State = "ok" | "error";

type Props = {
  value: string;
};

export const CopyButton = ({ value }: Props) => {
  const [state, setState] = useState<State | undefined>(undefined);
  const timeoutRef = useRef<number | undefined>();

  const transition = useCallback(
    (newState: State) => {
      setState(newState);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setState(undefined);
        timeoutRef.current = undefined;
      }, 2_000);
    },
    [setState],
  );

  return (
    <button
      class="copy"
      onClick={() =>
        navigator.clipboard
          .writeText(value)
          .then(() => transition("ok"))
          .catch((err) => {
            transition("error");
            console.error(err);
          })
      }
    >
      <ButtonIcon state={state} />
    </button>
  );
};

const check = (
  <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M17 5L8 15l-5-4"
    />
  </svg>
);

const copy = (
  <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M4 2a2 2 0 00-2 2v9a2 2 0 002 2h2v2a2 2 0 002 2h9a2 2 0 002-2V8a2 2 0 00-2-2h-2V4a2 2 0 00-2-2H4zm9 4V4H4v9h2V8a2 2 0 012-2h5zM8 8h9v9H8V8z"
    />
  </svg>
);

const error = (
  <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0zm10.01 4a1 1 0 01-1 1H10a1 1 0 110-2h.01a1 1 0 011 1zM11 6a1 1 0 10-2 0v5a1 1 0 102 0V6z"
    />
  </svg>
);

interface ButtonIconProps {
  state: State | undefined;
}

const ButtonIcon = ({ state }: ButtonIconProps) => {
  switch (state) {
    case "ok":
      return check;
    case "error":
      return error;
    default:
      return copy;
  }
};
