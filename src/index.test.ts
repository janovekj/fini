import { renderHook, act } from "@testing-library/react-hooks";
import { useMachine, Machine, State, Event } from "./index";

test("various transitions", () => {
  const something = { value: "foo" };

  type BaseContext = {
    value?: string;
  };

  type TestMachine = Machine<
    {
      idle: State<{
        focus: Event;
      }>;
      editing: State<
        {
          change: Event<{ value: string }>;
          submit: Event<{ isValid: boolean }>;
        },
        { value: string }
      >;
      submitted: {
        on: {};
        context: {
          id: string;
        };
      };
    },
    BaseContext
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
          change: (context, { value }) => [
            () => void (something.value = value),
            {
              ...context,
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
      "idle"
    )
  );

  // context should be defined, even if doesn't have any initial values
  expect(result.current[0].context).toEqual({});
  expect(result.current[0].context.value).toBe(undefined);

  expect(result.current[0].current).toBe("idle");
  expect(result.current[0].idle).toBeTruthy();

  act(() => {
    result.current[1].focus();
  });

  expect(result.current[0].current).toBe("editing");
  expect(result.current[0].editing).toBeTruthy();

  act(() => {
    result.current[1].change({ value: "lol" });
  });

  expect(something.value).toBe("lol");

  act(() => {
    result.current[1].focus();
  });

  // nothing should happen if curent state doesn't handle the event
  expect(result.current[0].current).toBe("editing");
  expect(result.current[0].editing).toBeTruthy();

  if (result.current[0].editing) {
    // this should not give error
    result.current[0].context.value.toLocaleLowerCase();
  }
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

  expect(result.current[0].current).toBe("a");
  expect(result.current[0].a).toBeTruthy();

  act(() => {
    // @ts-expect-error - TODO: improve typings so that payload is optional here
    result.current[1].event();
  });

  expect(result.current[0].current).toBe("b");
  expect(result.current[0].b).toBeTruthy();
});

test("string based transition", () => {
  type TestMachine = Machine<
    {
      a: State<
        {
          event: Event;
        },
        { prop2: string }
      >;
      b: State<{}, { prop2: string }>;
    },
    { prop1?: string }
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

  expect(result.current[0].current).toBe("b");
  expect(result.current[0].b).toBeTruthy();
});

test("function based transition with value", () => {
  type TestMachine = Machine<
    {
      a: State<{
        event: Event<{ newValue: string }>;
      }>;
      b: State;
    },
    { prop: string }
  >;

  const { result } = renderHook(() =>
    useMachine<TestMachine>(
      {
        a: {
          event: (context, { newValue }) => ({
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

  expect(result.current[0].current).toBe("b");
  expect(result.current[0].context.prop).toBe("new value");
});

test("tuple based transition with side-effect", () => {
  type TestMachine = Machine<
    {
      a: State<{
        event: Event;
      }>;
      b: State;
    },
    { prop: string }
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

  expect(result.current[0].current).toBe("b");
  expect(result.current[0].context.prop).toBe("asd");
  expect(value.current).toBe("new value");
});

test("tuple from function based transition with side-effect", () => {
  type TestMachine = Machine<
    {
      a: State<{ event: Event }>;
      b: State;
    },
    { prop: string }
  >;

  const value = { current: "test" };
  const { result } = renderHook(() =>
    useMachine<TestMachine>(
      {
        a: {
          event: context => [
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
  expect(result.current[0].context.prop).toBe("test");

  act(() => {
    result.current[1].event();
  });

  expect(result.current[0].current).toBe("b");
  // expect(result.current[0].context.prop).toBe("test");
  expect(value.current).toBe("new value");
});

test("simple counter example", () => {
  type CounterMachine = Machine<
    {
      counting: State<{
        increment: Event;
        decrement: Event;
      }>;
      maxedOut: State<{
        reset: Event;
      }>;
    },
    { count: number }
  >;

  const { result } = renderHook(() =>
    useMachine<CounterMachine>(
      {
        counting: {
          increment: ({ count }) =>
            count < 7
              ? {
                  count: count + 1,
                }
              : "maxedOut",
          decrement: context => ({
            ...context,
            count: context.count - 1,
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
  expect(result.current[0].current).toBe("maxedOut");

  act(() => {
    result.current[1].reset();
  });

  expect(result.current[0].context.count).toBe(0);
  expect(result.current[0].current).toBe("counting");
});
