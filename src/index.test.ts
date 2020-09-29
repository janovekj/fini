import { renderHook, act } from "@testing-library/react-hooks";
import { useMachine, Machine, State } from "./index";

test("string shorthand initial state", () => {
  type M = Machine<{
    a: State;
  }>;
  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {},
      },
      "a"
    )
  );
  expect(result.current[0].current).toBe("a");

  // context should be defined, even if doesn't have any initial values
  expect(result.current[0].context).toEqual({});
});

test("object initial state and context", () => {
  type M = Machine<
    {
      a: State;
    },
    { prop: number }
  >;
  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {},
      },
      { state: "a", context: { prop: 123 } }
    )
  );
  expect(result.current[0].current).toBe("a");
  expect(result.current[0].context.prop).toBe(123);
});

test("string shorthand state transition", () => {
  type M = Machine<{
    a: State<{
      p: never;
    }>;
    b: State;
  }>;

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: "b",
        },
        b: {},
      },
      "a"
    )
  );

  act(() => {
    result.current[1].p();
  });

  expect(result.current[0].current).toBe("b");
});

test("object state transition", () => {
  type M = Machine<{
    a: State<{
      p: never;
    }>;
    b: State;
  }>;

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: { state: "b" },
        },
        b: {},
      },
      "a"
    )
  );

  act(() => {
    result.current[1].p();
  });

  expect(result.current[0].current).toBe("b");
});

test("shorthand context update", () => {
  type M = Machine<
    {
      a: State<{
        p: never;
      }>;
    },
    { prop: string }
  >;

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: { prop: "new value" },
        },
      },
      { state: "a", context: { prop: "old value" } }
    )
  );

  act(() => {
    result.current[1].p();
  });

  expect(result.current[0].context.prop).toBe("new value");

  // shouldn't change state
  expect(result.current[0].current).toBe("a");
});

test("context and state update object", () => {
  type M = Machine<
    {
      a: State<{
        p: never;
      }>;
      b: State;
    },
    { prop: string }
  >;

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: { state: "b", context: { prop: "new value" } },
        },
        b: {},
      },
      { state: "a", context: { prop: "old value" } }
    )
  );

  act(() => {
    result.current[1].p();
  });

  expect(result.current[0].current).toBe("b");
  expect(result.current[0].context.prop).toBe("new value");
});

test("string shorthand state transition by function", () => {
  type M = Machine<{
    a: State<{
      p: never;
    }>;
    b: State;
  }>;

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: () => "b",
        },
        b: {},
      },
      "a"
    )
  );

  act(() => {
    result.current[1].p();
  });

  expect(result.current[0].current).toBe("b");
});

test("object state transition by function", () => {
  type M = Machine<{
    a: State<{
      p: never;
    }>;
    b: State;
  }>;

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: () => ({
            state: "b",
          }),
        },
        b: {},
      },
      "a"
    )
  );

  act(() => {
    result.current[1].p();
  });

  expect(result.current[0].current).toBe("b");
});

test("shorthand context update by function", () => {
  type M = Machine<
    {
      a: State<{
        p: never;
      }>;
    },
    { prop: string }
  >;

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: () => ({ prop: "new value" }),
        },
      },
      { state: "a", context: { prop: "old value" } }
    )
  );

  act(() => {
    result.current[1].p();
  });

  expect(result.current[0].context.prop).toBe("new value");

  // shouldn't change state
  expect(result.current[0].current).toBe("a");
});

test("context and state update object by function", () => {
  type M = Machine<
    {
      a: State<{
        p: never;
      }>;
      b: State;
    },
    { prop: string }
  >;

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: () => ({ state: "b", context: { prop: "new value" } }),
        },
        b: {},
      },
      { state: "a", context: { prop: "old value" } }
    )
  );

  act(() => {
    result.current[1].p();
  });

  expect(result.current[0].context.prop).toBe("new value");
  expect(result.current[0].current).toBe("b");
});

test("void event handler", () => {
  type M = Machine<{
    state1: State<{
      event1: never;
    }>;
  }>;
  const { result } = renderHook(() =>
    useMachine<M>(
      {
        state1: {
          event1: () => {},
        },
      },
      "state1"
    )
  );
  act(() => result.current[1].event1());

  expect(result.current[0].current).toBe("state1");
});

test("dispatch event with payload", () => {
  type M = Machine<
    {
      a: State<{
        p: string;
      }>;
      b: State;
    },
    { prop: string }
  >;

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: (_, payload) => ({ state: "b", context: { prop: payload } }),
        },
        b: {},
      },
      { state: "a", context: { prop: "old value" } }
    )
  );

  act(() => {
    result.current[1].p("new value");
  });

  expect(result.current[0].context.prop).toBe("new value");
});

test("event handler with side-effect", () => {
  type M = Machine<{
    a: State<{
      p: never;
    }>;
  }>;

  const value = {
    current: "old value",
  };

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: ({ exec }) => void exec(() => void (value.current = "new value")),
        },
      },
      "a"
    )
  );

  act(() => {
    result.current[1].p();
  });

  expect(value.current).toBe("new value");
});

/* #### Various examples #### */

test("simple counter example", () => {
  type CounterMachine = Machine<
    {
      counting: State<{
        increment: never;
        decrement: never;
      }>;
      maxedOut: State<{
        reset: never;
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
      fetch: string;
    }>;
    fetching: State<
      {
        succeeded: User;
        failed: string;
      },
      { params: { id: string } }
    >;
    success: State<
      {
        refetch: never;
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
          fetch: ({ exec }, id) => {
            exec(
              () =>
                void fetchUser(id).then(user => {
                  dispatch.succeeded(user);
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
          succeeded: ({ context }, user) => ({
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
                  dispatch.succeeded(user);
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
    result.current[1].fetch("test");
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
    initial: State<{
      // Specify an event handler with the `Event` helper type,
      // which accepts a type argument for the event payload
      login: LoginParams;
    }>;
    fetching: State<
      {
        succeeded: User;
        failed: string;
      },
      // Add state-specific context data. TypeScript will only let you
      // access `context.params` while in the `fetching` state
      // (or any other state that specifies the property)
      { params: LoginParams }
    >;
    loggedIn: State<
      {
        logout: never;
      },
      {
        params: LoginParams;
        user: User;
      }
    >;
    error: State<
      {
        retry: never;
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
                .then(user => dispatch.succeeded(user))
                .catch(error => dispatch.failed(error));
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
          succeeded: ({ context }, user) => ({
            state: "loggedIn",
            context: {
              ...context,
              user,
            },
          }),
          failed: ({ context, exec }, error) => {
            exec(() => console.error("Test message: Something bad happened!"));
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
                .then(user => dispatch.succeeded(user))
                .catch(error => dispatch.failed(error));
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
