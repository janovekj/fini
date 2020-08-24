import { renderHook, act } from "@testing-library/react-hooks";
import { useMachine, CreateState } from "../src/useMachine";

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
        data: {
          value: string;
        };
      };
      submitted: {
        on: {};
        data: {
          id: string;
        };
      };
    }
  >;

  const errors = [];

  const { result } = renderHook(() =>
    useMachine<State>(
      {
        idle: {
          focus: {
            state: "editing",
            data: {
              value: "asdas",
            },
          },
        },
        editing: {
          change: (state, { value }) => [
            () => void (something.value = "bar"),
            {
              ...state,
              value,
            },
          ],
          submit: (state, { isValid }) => [
            () => {},
            {
              state: "submitted",
              data: {
                id: "loool",
              },
            },
          ],
        },
        submitted: {},
      },
      {
        state: "idle",
        data: {},
      }
    )
  );

  act(() => {
    result.current[1].focus();
  });

  expect(result.current[0].state).toBe("editing");

  act(() => {
    result.current[1].change({ value: "lol" });
  });

  expect(something.value).toBe("bar");
});
