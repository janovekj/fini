import { renderHook, act } from "@testing-library/react-hooks";
import { useMachine, Machine, State, createMachine } from "./index";

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
  expect(result.current.current).toBe("a");

  // context should be defined, even if doesn't have any initial values
  expect(result.current.context).toEqual({});
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
  expect(result.current.current).toBe("a");
  expect(result.current.context.prop).toBe(123);
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
    result.current.p();
  });

  expect(result.current.current).toBe("b");
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
    result.current.p();
  });

  expect(result.current.current).toBe("b");
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
    result.current.p();
  });

  expect(result.current.context.prop).toBe("new value");

  // shouldn't change state
  expect(result.current.current).toBe("a");
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
    result.current.p();
  });

  expect(result.current.current).toBe("b");
  expect(result.current.context.prop).toBe("new value");
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
    result.current.p();
  });

  expect(result.current.current).toBe("b");
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
    result.current.p();
    result.current.p();
  });

  expect(result.current.current).toBe("b");
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
    result.current.p();
  });

  expect(result.current.context.prop).toBe("new value");

  // shouldn't change state
  expect(result.current.current).toBe("a");
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
    result.current.p();
  });

  expect(result.current.context.prop).toBe("new value");
  expect(result.current.current).toBe("b");
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
  act(() => result.current.event1());

  expect(result.current.current).toBe("state1");
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
    result.current.p("new value");
  });

  expect(result.current.context.prop).toBe("new value");
});

test("event handler with side-effect", () => {
  type M = Machine<{
    a: State<{
      p: never;
      next: never;
    }>;
    b: State;
  }>;

  let value = "old value";

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: ({ exec }) =>
            void exec(() => {
              value = "new value";
              return () => void (value = "final value");
            }),
          next: "b",
        },
        b: {},
      },
      "a"
    )
  );

  act(() => {
    result.current.p();
  });

  expect(value).toBe("new value");

  act(() => {
    result.current.next();
  });

  // should have run cleanup
  expect(value).toBe("final value");
});

test("entry effect on initial state", () => {
  type M = Machine<{
    a: State<{ stop: never }>;
    b: State;
  }>;

  const cleanupFn = jest.fn();

  const entryEffect: any = jest.fn((machine: any) => {
    expect(machine.previousState).toBe(undefined);
    expect(machine.state).toBe("a");
    expect(machine.context).toEqual({});
    return cleanupFn;
  });

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          $entry: entryEffect,
          stop: "b",
        },
        b: {},
      },
      "a"
    )
  );

  expect(entryEffect).toHaveBeenCalledTimes(1);
  expect(cleanupFn).not.toHaveBeenCalled();

  act(() => {
    result.current.stop();
  });

  // Should run cleanup upon leaving the state
  // TODO: wait for use-effect-reducer release
  // expect(cleanupFn).toHaveBeenCalledTimes(1);
});

test("exit and entry effect", async () => {
  type M = Machine<{
    a: State<{ next: never }>;
    b: State<{ previous: never }, { prop: string }>;
  }>;

  const effects: string[] = [];

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          $exit: (machine) => {
            effects.push("exit");
            // should be called with the updated context
            // @ts-ignore: TS doesn't know the next state
            expect(machine.context.prop).toEqual("test");
            expect(machine.nextState).toBe("b");
            expect(machine.state).toBe("a");
            expect(machine.dispatch.next).toBeDefined();

            return () => effects.push("exit cleanup");
          },
          next: {
            state: "b",
            context: {
              prop: "test",
            },
          },
        },
        b: {
          $entry: (machine: any) => {
            effects.push("entry");
            // should be called with the updated context
            expect(machine.context.prop).toEqual("test");
            expect(machine.previousState).toBe("a");
            expect(machine.state).toBe("b");
            expect(machine.dispatch.next).toBeDefined();
            return () => effects.push("entry cleanup");
          },
          previous: "a",
        },
      },
      "a"
    )
  );

  expect(effects).toEqual([]);

  act(() => {
    result.current.next();
  });

  expect(result.current.current).toBe("b");

  // should have been called in the correct order
  expect(effects).toEqual(["exit", "exit cleanup", "entry"]);

  act(() => {
    result.current.previous();
  });

  expect(result.current.current).toBe("a");

  // should cleanup entry effect upon leaving
  // expect(effects).toEqual(["exit", "exit cleanup", "entry", "entry cleanup"]);

  act(() => {
    result.current.next();
  });

  // should run effects again
  expect(effects).toEqual([
    "exit",
    "exit cleanup",
    "entry",
    "entry cleanup",
    "exit",
    "exit cleanup",
    "entry",
  ]);
});

test("passing machine from createMachine into useMachine", () => {
  type M = Machine<
    {
      a: State<{
        p: string;
      }>;
      b: State;
    },
    { prop: string }
  >;

  const machine = createMachine<M>({
    a: {
      p: (_, payload) => ({ state: "b", context: { prop: payload } }),
    },
    b: {},
  });

  const { result } = renderHook(() =>
    useMachine(machine, { state: "a", context: { prop: "old value" } })
  );

  act(() => {
    result.current.p("new value");
  });

  expect(result.current.context.prop).toBe("new value");
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
    result.current.increment();
  });

  expect(result.current.context.count).toBe(1);

  act(() => {
    result.current.increment();
    result.current.increment();
    result.current.increment();
    result.current.increment();
    result.current.decrement();
  });

  expect(result.current.context.count).toBe(4);

  act(() => {
    result.current.increment();
    result.current.increment();
    result.current.increment();
    result.current.increment();
  });

  expect(result.current.context.count).toBe(7);
  expect(result.current.current).toBe("maxedOut");

  act(() => {
    result.current.reset();
  });

  expect(result.current.context.count).toBe(0);
  expect(result.current.current).toBe("counting");
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
    new Promise((resolve) =>
      setTimeout(() => {
        resolve({ name: "Fini", age: 100 });
      }, 300)
    );

  const { result, waitForNextUpdate } = renderHook(() =>
    useMachine<FetcherMachine>(
      {
        initial: {
          fetch: ({ exec }, id) => {
            exec(
              (dispatch) =>
                void fetchUser(id).then((user) => {
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
          failed: (context) => ({
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
              (dispatch) =>
                void fetchUser(context.params.id).then((user) => {
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
    )
  );

  act(() => {
    result.current.fetch("test");
  });

  expect(result.current.current).toBe("fetching");

  await waitForNextUpdate();

  expect(result.current.current).toBe("success");

  act(() => {
    result.current.refetch();
  });

  expect(result.current.current).toBe("fetching");

  await waitForNextUpdate();

  expect(result.current.current).toBe("success");
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

  const { result, waitForNextUpdate } = renderHook(() =>
    // Next, let's implement the machine
    useMachine<LoginMachine>(
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
            exec((dispatch) => {
              login({ email, password })
                .then((user) => dispatch.succeeded(user))
                .catch((error) => dispatch.failed(error));
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
            exec((dispatch) => {
              login(context.params)
                .then((user) => dispatch.succeeded(user))
                .catch((error) => dispatch.failed(error));
            });
            return "fetching";
          },
        },
      },
      "initial"
    )
  );

  act(() => {
    result.current.login({ email: "test@example.com", password: "hunter2" });
  });

  expect(result.current.current).toBe("fetching");

  await waitForNextUpdate();

  expect(result.current.current).toBe("loggedIn");

  act(() => {
    result.current.retry();
  });

  expect(result.current.current).toBe("loggedIn");
  // @ts-expect-error
  expect(result.current.context.user).toEqual({ id: "123", name: "Fini" });

  act(() => {
    result.current.logout();
  });

  expect(result.current.current).toBe("initial");
  succeed = false;

  act(() => {
    result.current.login({ email: "test@example.com", password: "hunter2" });
  });

  await waitForNextUpdate();

  expect(result.current.current).toBe("error");
});

test("counter example with enter and exit effects", () => {
  type CounterMachine = Machine<
    {
      idle: State<{ start: never }>;
      counting: State<{
        increment: never;
        pause: never;
        stop: never;
      }>;
      paused: State<{ resume: never }>;
      stopped: State;
    },
    { count: number }
  >;

  const { result } = renderHook(() =>
    useMachine<CounterMachine>(
      {
        idle: {
          start: {
            state: "counting",
            context: {
              count: 0,
            },
          },
        },
        counting: {
          $entry: ({ state, previousState, context, dispatch }) => {
            console.log(`Entered ${state}, coming from ${previousState}.`);
            console.log(`Count is ${context.count}`);
            dispatch.increment();
          },
          increment: ({ context }) => ({ count: context.count + 1 }),
          pause: "paused",
          stop: "stopped",
          $exit: ({ nextState }) => console.log(`Heading off to ${nextState}`),
        },
        paused: {
          resume: "counting",
        },
        stopped: {},
      },
      { state: "idle", context: { count: 0 } }
    )
  );

  act(() => {
    result.current.start();
  });

  // entry successfully dispatched action
  expect(result.current.context.count).toBe(1);
});
