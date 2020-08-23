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
          change: ({ context, exec }, { value }) => {
            exec(() => void (something.value = value));
            return {
              ...context,
              value,
            };
          },
          submit: (_, { isValid }) => ({
            state: "submitted",
            context: {
              id: "loool",
            },
          }),
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
          event: ({ exec }) => {
            exec(() => void (value.current = "new value"));
            return {
              state: "b",
              context: {
                prop: "asd",
              },
            };
          },
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
          event: ({ exec, context }) => {
            exec(() => void (value.current = "new value"));
            return {
              state: "b",
              context,
            };
          },
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
          increment: ({ context: { count } }) =>
            count < 7
              ? {
                  count: count + 1,
                }
              : "maxedOut",
          decrement: ({ context }) => ({
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

test("async thing", async () => {
  type User = {
    name: string;
    age: number;
  };

  type FetcherMachine = Machine<{
    initial: State<{
      fetch: Event<{ id: string }>;
    }>;
    fetching: State<
      {
        succeeded: Event<{ user: User }>;
        failed: Event<{ error: string }>;
      },
      { params: { id: string } }
    >;
    success: State<
      {
        refetch: Event;
      },
      {
        params: { id: string };
        user: User;
      }
    >;
    error: State<{}, { error: string }>;
  }>;

  const fetchUser = (id: string): Promise<User> =>
    new Promise(resolve =>
      setTimeout(() => {
        resolve({ name: "Fini", age: 100 });
      }, 300)
    );

  const { result, waitForNextUpdate } = renderHook(() => {
    const [state, dispatch] = useMachine<FetcherMachine>(
      {
        initial: {
          fetch: ({ exec }, { id }) => {
            exec(
              () =>
                void fetchUser(id).then(user => {
                  dispatch.succeeded({ user });
                })
            );
            return {
              state: "fetching",
              context: {
                params: {
                  id,
                },
              },
            };
          },
        },
        fetching: {
          succeeded: ({ context }, { user }) => ({
            state: "success",
            context: {
              ...context,
              user,
            },
          }),
          failed: context => ({
            state: "error",
            context: {
              ...context,
              error: "failed big time",
            },
          }),
        },
        success: {
          refetch: ({ context, exec }) => {
            exec(
              () =>
                void fetchUser(context.params.id).then(user => {
                  dispatch.succeeded({ user });
                })
            );
            return {
              state: "fetching",
              context,
            };
          },
        },
        error: {},
      },
      "initial"
    );

    return [state, dispatch] as const;
  });

  act(() => {
    result.current[1].fetch({ id: "test" });
  });

  expect(result.current[0].current).toBe("fetching");

  await waitForNextUpdate();

  expect(result.current[0].current).toBe("success");

  act(() => {
    result.current[1].refetch();
  });

  expect(result.current[0].current).toBe("fetching");

  await waitForNextUpdate();

  expect(result.current[0].current).toBe("success");
});

test("login machine", async () => {
  type User = {
    id: string;
    name: string;
  };

  type LoginParams = { email: string; password: string };

  // First, define the schema for the machine
  type LoginMachine = Machine<{
    // Use the `State` helper type to create types for each state
    initial: State<{
      // Specify an event handler with the `Event` helper type,
      // which accepts a type argument for the event payload
      login: Event<LoginParams>;
    }>;
    fetching: State<
      {
        succeeded: Event<{ user: User }>;
        failed: Event<{ error: string }>;
      },
      // Add state-specific context data. TypeScript will only let you
      // access `context.params` while in the `fetching` state
      // (or any other state that specifies the property)
      { params: LoginParams }
    >;
    loggedIn: State<
      {
        logout: Event;
      },
      {
        params: LoginParams;
        user: User;
      }
    >;
    error: State<
      {
        retry: Event;
      },
      { error: string; params: LoginParams }
    >;
  }>;

  let succeed = true;

  const login = (params: LoginParams): Promise<User> =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        if (succeed) {
          resolve({ id: "123", name: "Fini" });
        } else {
          reject("something went wrong");
        }
      }, 300)
    );

  const { result, waitForNextUpdate } = renderHook(() => {
    // Next, let's implement the machine
    const [state, dispatch] = useMachine<LoginMachine>(
      {
        // Implement the `initial` state,
        // which is simply an object with event handlers as properties
        initial: {
          /* Implement the `login` event handler,
           * which is a function where two parameters are provided:
           * 1. an object containing the current context (not used here),
           *    and a function `exec`, with which we can safely execute our side-effects
           *    (and even dispatch new events!)
           * 2. the event payload
           */
          login: ({ context, exec }, { email, password }) => {
            // Prepare the login function which will be executed upon state change
            exec(dispatch => {
              login({ email, password })
                .then(user => dispatch.succeeded({ user }))
                .catch(error => dispatch.failed({ error }));
            });

            // Return the new state, with the new context
            return {
              state: "fetching",
              context: {
                params: {
                  email,
                  password,
                },
              },
            };
          },
        },
        // Rinse and repeat
        fetching: {
          succeeded: ({ context }, { user }) => ({
            state: "loggedIn",
            context: {
              ...context,
              user,
            },
          }),
          failed: ({ context, exec }, { error }) => {
            exec(() => console.error("Something bad happened!"));
            return {
              state: "error",
              context: {
                ...context,
                error,
              },
            };
          },
        },
        loggedIn: {
          logout: "initial",
        },
        error: {
          retry: ({ context, exec }) => {
            exec(dispatch => {
              login(context.params)
                .then(user => dispatch.succeeded({ user }))
                .catch(error => dispatch.failed({ error }));
            });
            return "fetching";
          },
        },
      },
      "initial"
    );

    return [state, dispatch] as const;
  });

  act(() => {
    result.current[1].login({ email: "test@example.com", password: "hunter2" });
  });

  expect(result.current[0].current).toBe("fetching");

  await waitForNextUpdate();

  expect(result.current[0].current).toBe("loggedIn");

  act(() => {
    result.current[1].retry();
  });

  expect(result.current[0].current).toBe("loggedIn");
  // @ts-expect-error
  expect(result.current[0].context.user).toEqual({ id: "123", name: "Fini" });

  act(() => {
    result.current[1].logout();
  });

  expect(result.current[0].current).toBe("initial");
  succeed = false;

  act(() => {
    result.current[1].login({ email: "test@example.com", password: "hunter2" });
  });

  await waitForNextUpdate();

  expect(result.current[0].current).toBe("error");
});
