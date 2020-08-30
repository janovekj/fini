import { renderHook, act } from "@testing-library/react-hooks";
import { useMachine, Machine } from "./index";

test("various transitions", () => {
  const something = { value: "foo" };

  type BaseContext = {
    value?: string;
  };

  type TestMachine = Machine<
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
    useMachine<TestMachine>(
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
  type TestMachine = Machine<
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
    useMachine<TestMachine>(
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

test("function based transition with value", () => {
  type TestMachine = Machine<
    { prop: string },
    {
      a: {
        on: {
          event: {
            newValue: string;
          };
        };
      };
      b: {
        on: {};
      };
    }
  >;

  const { result } = renderHook(() =>
    useMachine<TestMachine>(
      {
        a: {
          event: ({ context }, { newValue }) => ({
            state: "b",
            context: {
              ...context,
              prop: newValue,
            },
          }),
        },
        b: {},
      },
      { state: "a", context: { prop: "test" } }
    )
  );

  act(() => {
    result.current[1].event({ newValue: "new value" });
  });

  expect(result.current[0].state.current).toBe("b");
  expect(result.current[0].context.prop).toBe("new value");
});

test("tuple based transition with side-effect", () => {
  type TestMachine = Machine<
    { prop: string },
    {
      a: {
        on: {
          event: null;
        };
      };
      b: {
        on: {};
      };
    }
  >;

  const value = { current: "test" };
  const { result } = renderHook(() =>
    useMachine<TestMachine>(
      {
        a: {
          event: [
            () => void (value.current = "new value"),
            {
              state: "b",
              context: {
                prop: "asd",
              },
            },
          ],
        },
        b: {},
      },
      { state: "a", context: { prop: "test" } }
    )
  );

  act(() => {
    result.current[1].event();
  });

  expect(result.current[0].state.current).toBe("b");
  expect(result.current[0].context.prop).toBe("asd");
  expect(value.current).toBe("new value");
});

test("tuple from function based transition with side-effect", () => {
  type TestMachine = Machine<
    { prop: string },
    {
      a: {
        on: {
          event: null;
        };
      };
      b: {
        on: {};
      };
    }
  >;

  const value = { current: "test" };
  const { result } = renderHook(() =>
    useMachine<TestMachine>(
      {
        a: {
          event: ({ context }) => [
            () => void (value.current = "new value"),
            {
              state: "b",
              context,
            },
          ],
        },
        b: {},
      },
      { state: "a", context: { prop: "test" } }
    )
  );

  act(() => {
    result.current[1].event();
  });

  expect(result.current[0].state.current).toBe("b");
  expect(result.current[0].context.prop).toBe("test");
  expect(value.current).toBe("new value");
});

test("simple counter example", () => {
  type CounterMachine = Machine<
    { count: number },
    {
      counting: {
        on: {
          increment: null;
          decrement: null;
        };
      };
      maxedOut: {
        on: {
          reset: null;
        };
      };
    }
  >;

  const { result } = renderHook(() =>
    useMachine<CounterMachine>(
      {
        counting: {
          increment: ({ state, context }) =>
            context.count < 7
              ? {
                  state,
                  context: {
                    count: context.count + 1,
                  },
                }
              : {
                  state: "maxedOut",
                  context,
                },
          decrement: ({ state, context }) => ({
            state,
            context: {
              ...context,
              count: context.count - 1,
            },
          }),
        },
        maxedOut: {
          reset: {
            state: "counting",
            context: {
              count: 0,
            },
          },
        },
      },
      { state: "counting", context: { count: 0 } }
    )
  );

  act(() => {
    result.current[1].increment();
  });

  expect(result.current[0].context.count).toBe(1);

  act(() => {
    result.current[1].increment();
    result.current[1].increment();
    result.current[1].increment();
    result.current[1].increment();
    result.current[1].decrement();
  });

  expect(result.current[0].context.count).toBe(4);

  act(() => {
    result.current[1].increment();
    result.current[1].increment();
    result.current[1].increment();
    result.current[1].increment();
  });

  expect(result.current[0].context.count).toBe(7);
  expect(result.current[0].state.current).toBe("maxedOut");

  act(() => {
    result.current[1].reset();
  });

  expect(result.current[0].context.count).toBe(0);
  expect(result.current[0].state.current).toBe("counting");
});
