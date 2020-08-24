import { renderHook, act } from "@testing-library/react-hooks";
import { useMachine, CreateState } from "./index";

test("basic transitions", () => {
  const something = { value: "foo" };

  type State = CreateState<
    { value?: string },
    {
      idle: {
        on: {
          focus: null;
        };
      };
      editing: {
        on: {
          change: { value: string };
          submit: { isValid: boolean };
        };
        // TODO: this wasnt autorenamed when changing from data => context
        context: {
          value: string;
        };
        // @ts-expect-error: this shouldn't work
        kakakakakakak: {};
      };
      submitted: {
        on: {};
        context: {
          id: string;
        };
      };
    }
  >;

  const { result } = renderHook(() =>
    useMachine<State>(
      {
        idle: {
          focus: {
            state: "editing",
            context: {
              value: "asdas",
            },
          },
        },
        editing: {
          change: (state, { value }) => [
            () => void (something.value = value),
            {
              ...state,
              value,
            },
          ],
          submit: (state, { isValid }) => [
            () => {},
            {
              state: "submitted",
              context: {
                id: "loool",
              },
            },
          ],
        },
        submitted: {},
      },
      {
        state: "idle",
        context: {},
      }
    )
  );

  expect(result.current[0].state).toBe("idle");

  act(() => {
    result.current[1].focus();
  });

  expect(result.current[0].state).toBe("editing");

  act(() => {
    result.current[1].change({ value: "lol" });
  });

  expect(something.value).toBe("lol");

  const curr = result.current[0].state;
  act(() => {
    result.current[1].focus();
  });
  // state shouldn't change
  expect(result.current[0].state).toBe(curr);
});
