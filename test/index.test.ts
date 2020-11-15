import { renderHook, act } from "@testing-library/react-hooks";
import { useMachine, createMachine } from "../src/index";
import { suite } from "uvu";
import { is, equal, type, ok, not } from "uvu/assert";

const test = suite("useMachine");

test.before(() => {
  global.__DEV__ = true;
});

test("string shorthand initial state", () => {
  type M = {
    states: {
      a: {};
    };
  };

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {},
      },
      "a"
    )
  );
  is(result.current.current, "a");
  // context should be defined, even if doesn't have any initial values
  equal(result.current.context, {});
});

test("object initial state and context", () => {
  type M = {
    states: {
      a: {};
    };
    context: {
      prop: number;
    };
  };
  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {},
      },
      { state: "a", context: { prop: 123 } }
    )
  );
  is(result.current.current, "a");
  is(result.current.context.prop, 123);
});

test("string shorthand state transition", () => {
  type M = {
    states: {
      a: {
        on: {
          p: void;
        };
      };
      b: {};
    };
  };

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

  is(result.current.current, "b");
});

test("object state transition", () => {
  type M = {
    states: {
      a: {
        on: {
          p: void;
        };
      };
      b: {};
    };
  };

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

  is(result.current.current, "b");
});

test("shorthand context update", () => {
  type M = {
    states: {
      a: {
        on: {
          p: void;
        };
      };
    };
    context: { prop: string };
  };

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

  is(result.current.context.prop, "new value");

  // shouldn't change state
  is(result.current.current, "a");
});

test("context and state update object", () => {
  type M = {
    states: {
      a: {
        on: {
          p: void;
        };
      };
      b: {};
    };
    context: { prop: string };
  };

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

  is(result.current.current, "b");
  is(result.current.context.prop, "new value");
});

test("string shorthand state transition by function", () => {
  type M = {
    states: {
      a: {
        on: {
          p: void;
        };
      };
      b: {};
    };
  };

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

  is(result.current.current, "b");
});

test("object state transition by function", () => {
  type M = {
    states: {
      a: {
        on: {
          p: void;
        };
      };
      b: {};
    };
  };

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
    console.log(result.current.p);

    // result.current.p();
  });

  is(result.current.current, "b");
});

test("shorthand context update by object", () => {
  type M = {
    states: {
      a: {
        on: {
          p: void;
        };
      };
    };
    context: { prop: string; anotherProp: string };
  };

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: { prop: "new value" },
        },
      },
      { state: "a", context: { prop: "old value", anotherProp: "some value" } }
    )
  );

  act(() => {
    result.current.p();
  });

  // should only update the returned value
  is(result.current.context.prop, "new value");

  // the other value shouldn't have changed
  is(result.current.context.anotherProp, "some value");

  // shouldn't change state
  is(result.current.current, "a");
});

test("shorthand context update by function", () => {
  type M = {
    states: {
      a: {
        on: {
          p: void;
        };
      };
    };
    context: { prop: string; anotherProp: string };
  };

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: () => ({ prop: "new value" }),
        },
      },
      { state: "a", context: { prop: "old value", anotherProp: "some value" } }
    )
  );

  act(() => {
    result.current.p();
  });

  // should only update the returned value
  is(result.current.context.prop, "new value");

  // the other value shouldn't have changed
  is(result.current.context.anotherProp, "some value");

  // shouldn't change state
  is(result.current.current, "a");
});

test("context and state update object by function", () => {
  type M = {
    states: {
      a: {
        on: {
          p: void;
        };
      };
      b: {};
    };
    context: { prop: string };
  };

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

  is(result.current.context.prop, "new value");
  is(result.current.current, "b");
});

test("void event handler", () => {
  type M = {
    states: {
      state1: {
        on: {
          event1: void;
        };
      };
    };
  };

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        state1: {
          event1: () => void 0,
        },
      },
      "state1"
    )
  );
  act(() => result.current.event1());

  is(result.current.current, "state1");
});

test("dispatch event with payload", () => {
  type M = {
    states: {
      a: {
        on: {
          p: string;
        };
      };
      b: {};
    };
    context: { prop: string };
  };

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

  is(result.current.context.prop, "new value");
});

test("event handler with side-effect", () => {
  type M = {
    states: {
      a: {
        on: {
          p: void;
          next: void;
        };
      };
      b: {};
    };
  };

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

  is(value, "new value");

  act(() => {
    result.current.next();
  });

  // should have run cleanup
  is(value, "final value");
});

test("entry effect on initial state", () => {
  type M = {
    states: {
      a: {};
      b: {};
    };
    events: {
      stop: void;
    };
  };

  let hasRunEffect = false;
  let hasCleanedUp = false;

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          $entry: (machine: any) => {
            is(machine.previousState, undefined);
            is(machine.state, "a");
            equal(machine.context, {});
            hasRunEffect = true;
            return () => {
              hasCleanedUp = true;
            };
          },
          stop: "b",
        },
        b: {},
      },
      "a"
    )
  );

  ok(hasRunEffect);
  not(hasCleanedUp);

  act(() => {
    result.current.stop();
  });

  // Should run cleanup upon leaving the state
  ok(hasCleanedUp);
});

test("exit and entry effect", async () => {
  type M = {
    states: {
      a: {
        on: { next: void };
      };
      b: {
        on: { previous: void };
        context: { prop: string };
      };
    };
  };

  const effects: string[] = [];

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          $exit: (machine) => {
            effects.push("exit");
            // should be called with the updated context
            // @ts-ignore: TS doesn't know the next state
            is(machine.context.prop, "test");
            is(machine.nextState, "b");
            is(machine.state, "a");

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
          $entry: (machine) => {
            effects.push("entry");
            // should be called with the updated context
            is(machine.context.prop, "test");
            is(machine.previousState, "a");
            is(machine.state, "b");
            type(machine.dispatch.next, "function");
            return () => effects.push("entry cleanup");
          },
          previous: "a",
        },
      },
      "a"
    )
  );

  equal(effects, []);

  act(() => {
    result.current.next();
  });

  is(result.current.current, "b");

  // should have been called in the correct order
  equal(effects, ["exit", "exit cleanup", "entry"]);

  act(() => {
    result.current.previous();
  });

  is(result.current.current, "a");

  // should cleanup entry effect upon leaving
  equal(effects, ["exit", "exit cleanup", "entry", "entry cleanup"]);

  act(() => {
    result.current.next();
  });

  // should run effects again
  equal(effects, [
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
  type M = {
    states: {
      a: {
        on: {
          p: string;
        };
      };
      b: {};
    };
    context: { prop: string };
  };

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

  is(result.current.context.prop, "new value");
});

/* #### Various examples #### */

test("simple counter example", () => {
  type CounterMachine = {
    states: {
      counting: {
        on: {
          increment: void;
          decrement: void;
        };
      };
      maxedOut: {
        on: {
          reset: void;
        };
      };
    };
    context: { count: number };
  };

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

  is(result.current.context.count, 1);

  act(() => {
    result.current.increment();
    result.current.increment();
    result.current.increment();
    result.current.increment();
    result.current.decrement();
  });

  is(result.current.context.count, 4);

  act(() => {
    result.current.increment();
    result.current.increment();
    result.current.increment();
    result.current.increment();
  });

  is(result.current.context.count, 7);
  is(result.current.current, "maxedOut");

  act(() => {
    result.current.reset();
  });

  is(result.current.context.count, 0);
  is(result.current.current, "counting");
});

test("async thing", async () => {
  type User = {
    name: string;
    age: number;
  };

  type FetcherMachine = {
    states: {
      initial: {
        on: {
          fetch: string;
        };
      };
      fetching: {
        on: {
          succeeded: User;
          failed: string;
        };
        context: { params: { id: string } };
      };
      success: {
        on: {
          refetch: void;
        };
        context: {
          params: { id: string };
          user: User;
        };
      };
      error: {
        context: { error: string };
      };
    };
  };

  const fetchUser = (_: string): Promise<User> =>
    new Promise((resolve) =>
      setTimeout(() => {
        resolve({ name: "Fini", age: 100 });
      }, 30)
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

  is(result.current.current, "fetching");

  await waitForNextUpdate();

  is(result.current.current, "success");

  act(() => {
    result.current.refetch();
  });

  is(result.current.current, "fetching");

  await waitForNextUpdate();

  is(result.current.current, "success");
});

test("login machine", async () => {
  type User = {
    id: string;
    name: string;
  };

  type LoginParams = { email: string; password: string };

  // First, define the schema for the machine
  type LoginMachine = {
    states: {
      initial: {
        on: {
          // Specify an event handler with the `Event` helper type,
          // which accepts a type argument for the event payload
          login: LoginParams;
        };
      };
      fetching: {
        on: {
          succeeded: User;
          failed: string;
        };
        // Add state-specific context data. TypeScript will only let you
        // access `context.params` while in the `fetching` state
        // (or any other state that specifies the property)
        context: { params: LoginParams };
      };
      loggedIn: {
        on: {
          logout: void;
        };
        context: {
          params: LoginParams;
          user: User;
        };
      };
      error: {
        on: {
          retry: void;
        };
        context: { error: string; params: LoginParams };
      };
    };
  };

  let succeed = true;

  const login = (_: LoginParams): Promise<User> =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        if (succeed) {
          resolve({ id: "123", name: "Fini" });
        } else {
          reject("something went wrong");
        }
      }, 30)
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
          login: ({ exec }, { email, password }) => {
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

  is(result.current.current, "fetching");

  await waitForNextUpdate();

  is(result.current.current, "loggedIn");

  act(() => {
    result.current.retry();
  });

  is(result.current.current, "loggedIn");
  // @ts-expect-error
  equal(result.current.context.user, { id: "123", name: "Fini" });

  act(() => {
    result.current.logout();
  });

  is(result.current.current, "initial");
  succeed = false;

  act(() => {
    result.current.login({ email: "test@example.com", password: "hunter2" });
  });

  await waitForNextUpdate();

  is(result.current.current, "error");
});

test("counter example with enter and exit effects", () => {
  type CounterMachine = {
    states: {
      idle: {
        on: { start: void };
      };
      counting: {
        on: {
          increment: void;
          pause: void;
          stop: void;
        };
      };
      paused: {
        on: { resume: void };
      };
      stopped: {};
    };
    context: { count: number };
  };

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
  is(result.current.context.count, 1);
});

test("dispatch event that isnt handled", () => {
  type M = {
    states: {
      s1: {
        on: {
          e: void;
        };
      };
      s2: {};
    };
  };

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        s1: {
          e: () => void 0,
        },
        s2: {},
      },
      "s2"
    )
  );

  act(() => {
    result.current.e();
  });
});

test.run();
