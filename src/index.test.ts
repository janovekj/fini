import { renderHook, act } from "@testing-library/react-hooks";
import { useMachine, CreateState } from "./index";

test("basic transitions", () => {
  const something = { value: "foo" };

  type BaseContext = {
    value?: string;
  };

  type State = CreateState<
    BaseContext,
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
        // TODO: this wasnt autorenamed when changing from data => context. should it have been?
        context: {
          value: string;
        };
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
      }
    )
  );

  // context should be defined, even if doesn't have any initial values
  expect(result.current[0].context).toEqual({});
  expect(result.current[0].context.value).toBe(undefined);

  expect(result.current[0].state.current).toBe("idle");
  expect(result.current[0].state.is.idle).toBeTruthy();

  act(() => {
    result.current[1].focus();
  });

  expect(result.current[0].state.current).toBe("editing");
  expect(result.current[0].state.is.editing).toBeTruthy();

  act(() => {
    result.current[1].change({ value: "lol" });
  });

  expect(something.value).toBe("lol");

  act(() => {
    result.current[1].focus();
  });

  // nothing should happen if curent state doesn't handle the event
  expect(result.current[0].state.current).toBe("editing");
  expect(result.current[0].state.is.editing).toBeTruthy();
});

test("transition with plain state object", () => {
  const { result } = renderHook(() =>
    useMachine(
      {
        a: {
          event: {
            state: "b",
          },
        },
        b: {},
      },
      { state: "a" }
    )
  );

  expect(result.current[0].state.current).toBe("a");
  expect(result.current[0].state.is.a).toBeTruthy();

  act(() => {
    // @ts-expect-error - TODO: improve typings so that payload is optional here
    result.current[1].event();
  });

  expect(result.current[0].state.current).toBe("b");
  expect(result.current[0].state.is.b).toBeTruthy();
});

test("string based transition", () => {
  type State = CreateState<
    { prop1?: string },
    {
      a: {
        on: {
          event: null;
        };
        context: {
          prop2: string;
        };
      };
      b: {
        on: {};
        context: {
          prop2: string;
        };
      };
    }
  >;

  const { result } = renderHook(() =>
    useMachine<State>(
      {
        a: {
          event: "b",
        },
        b: {},
      },
      { state: "a", context: { prop2: "test" } }
    )
  );

  act(() => {
    result.current[1].event();
  });

  expect(result.current[0].state.current).toBe("b");
  expect(result.current[0].state.is.b).toBeTruthy();
});
