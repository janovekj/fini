import { useEffectReducer, EffectReducer } from "use-effect-reducer";

const dev = {
  warn: (...args: Parameters<typeof console.warn>) =>
    __DEV__ && console.warn(args),
  error: (...args: Parameters<typeof console.warn>) =>
    __DEV__ && console.error(args),
};

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

const isFunction = (arg: any): arg is Function => typeof arg === "function";

const isObject = (arg: any): arg is object => typeof arg === "object";

type Override<T1, T2> = Omit<T1, keyof T2> & T2;

type EventPayload = Record<string, any> | null;
type EventMapType = Record<string, EventPayload>;

type ContextType = Record<string, any>;

export type State<
  EventMap extends EventMapType = {},
  Context extends ContextType = {}
> = {
  context: Context;
  on: EventMap;
};

type StateMap = Record<string, State>;

type ApplyBaseContext<BaseContext, StateContext> = Override<
  BaseContext,
  StateContext
>;

type MachineState<BaseContext, S extends State> = {
  on: S["on"];
  context: ApplyBaseContext<BaseContext, S["context"]>;
};

export type Event<Payload extends EventPayload = null> = Payload;

// TODO: make a union of all the state contexts,
// so everything will appear in intellisense if not narrowed by typeguards
export type Machine<
  S extends StateMap = {},
  BaseContext extends ContextType = {}
> = {
  [K in keyof S]: MachineState<BaseContext, S[K]>;
};

type CompatibleContextStates<S extends StateMap, Current extends keyof S> = {
  [K in keyof S]: S[Current]["context"] extends S[K]["context"] ? K : never;
}[keyof S];

/** Transition result where the state is the same,
 * and doesn't have to be explicitly defined */
type ContextUpdate<
  S extends StateMap,
  Current extends keyof S
> = S[Current]["context"];

/** Object describing the next state (and context, if required) for a transition */
type UpdateObject<S extends StateMap> = {
  [K in keyof S]: {
    state: K;
  } & ({} extends S[K]["context"] // optional context if weak type
    ? { context?: S[K]["context"] }
    : S[K]["context"] extends undefined
    ? {}
    : { context: S[K]["context"] });
}[keyof S];

type ReducerState<S extends StateMap> = {
  [K in keyof S]: {
    state: K;
    context: S[K]["context"] extends undefined ? {} : S[K]["context"];
  };
}[keyof S];

/** The resulting state after a transition */
type Update<S extends StateMap, Current extends keyof S> =
  | CompatibleContextStates<S, Current>
  | XOR<ContextUpdate<S, Current>, UpdateObject<S>>;

type CleanupFunction = () => void;
type EffectFunction<S extends StateMap> = (
  dispatcher: Dispatcher<S>
) => void | CleanupFunction;

/** The result of a transition */
type Transition<S extends StateMap, Current extends keyof S> = Update<
  S,
  Current
>;

type CreateTransitionFnMachineObject<
  S extends StateMap,
  Current extends keyof S
> = {
  context: S[Current]["context"];
  exec: (effect: EffectFunction<S>) => void;
};

type CreateTranstionFn<
  S extends StateMap,
  Current extends keyof S,
  P extends EventPayload
> = P extends {}
  ? (
      machine: CreateTransitionFnMachineObject<S, Current>,
      payload: P
    ) => Transition<S, Current>
  : (
      machine: CreateTransitionFnMachineObject<S, Current>
    ) => Transition<S, Current>;

/** Reacts to an event and describes the next state and any side-effects */
type EventHandler<
  S extends StateMap,
  Current extends keyof S,
  P extends EventPayload
> = Transition<S, Current> | CreateTranstionFn<S, Current, P>;

type Schema<S extends StateMap> = {
  [K in keyof S]: {
    [E in keyof S[K]["on"]]: EventHandler<S, K, S[K]["on"][E]>;
  };
};

type EventObject<S extends StateMap> = {
  [K in keyof S]: {
    [E in keyof S[K]["on"]]: S[K]["on"][E] extends {}
      ? { type: E; payload: S[K]["on"][E] }
      : { type: E };
  }[keyof S[K]["on"]];
}[keyof S];

type UnionToIntersection<U> = (U extends any
? (k: U) => void
: never) extends (k: infer I) => void
  ? I
  : never;

type Dispatcher<S extends StateMap> = UnionToIntersection<
  {
    [K in keyof S]: {
      [E in keyof S[K]["on"]]: S[K]["on"][E] extends null
        ? () => void
        : (payload: S[K]["on"][E]) => void;
    };
  }[keyof S]
>;

type CurrentState<S extends StateMap> = {
  [K in keyof S]: {
    current: K;
    context: S[K]["context"];
  } & {
    [KK in keyof S]: KK extends K ? true : false;
  };
}[keyof S];

type OptionalContextStates<S extends StateMap> = {
  [K in keyof S]: {} extends S[K]["context"] ? K : never;
}[keyof S];

type InitialState<S extends StateMap> =
  | OptionalContextStates<S>
  | UpdateObject<S>;

const parseInitialState = <S extends StateMap>(
  schema: Schema<S>,
  initialState: InitialState<S>
) => {
  if (typeof initialState === "string") {
    if (initialState in schema) {
      return {
        state: initialState,
        context: {},
      };
    } else {
      dev.error(
        `State '${initialState}' does not exist in schema: ${JSON.stringify(
          schema
        )}`
      );
    }
  } else if (isObject(initialState)) {
    if (initialState.state in schema) {
      return initialState;
    } else {
      dev.error(
        `State '${
          initialState.state
        }' does not exist in schema: ${JSON.stringify(schema)}`
      );
    }
  }
  return;
};

export const useMachine = <S extends StateMap>(
  schema: Schema<S>,
  initialState: InitialState<S>
) => {
  const events = Array.from(
    new Set(Object.values(schema).flatMap(Object.keys))
  );
  const dispatcher = Object.assign(
    {},
    ...events.map(event => ({
      [event]: (payload: unknown) => dispatch({ type: event, payload }),
    }))
  ) as Dispatcher<S>;

  // @ts-ignore
  const reducer: EffectReducer<ReducerState<S>, EventObject<S>> = (
    state,
    event,
    exec
  ) => {
    // @ts-ignore
    if (!state.state in schema) {
      dev.error(`State '${state.state}' does not exist in schema`);
      return state;
    }

    const currentNode = schema[state.state];

    const eventHandler = currentNode[event.type];

    if (!eventHandler) {
      dev.warn(
        `Event handler for '${event.type}' does not exist in state '${state.state}'`
      );

      return state;
    }

    const customExec = (effect: EffectFunction<S>) =>
      exec(() => effect(dispatcher));

    const transition = isFunction(eventHandler)
      ? // @ts-ignore
        eventHandler(
          { context: state.context, exec: customExec },
          // @ts-ignore
          event?.payload
        )
      : eventHandler;

    const update = transition;

    if (isObject(update)) {
      return "state" in update
        ? update
        : {
            state: state.state,
            context: update,
          };
    } else if (typeof update === "string" && update in schema) {
      return {
        state: update,
        context: state.context,
      };
    } else {
      dev.error(`unknown type of EventNode`, update);
    }
    return state;
  };

  const initial: ReducerState<S> = (parseInitialState(
    schema,
    initialState
  ) as unknown) as ReducerState<S>;

  // @ts-ignore
  const [reducerState, dispatch] = useEffectReducer(reducer, initial);

  const state: CurrentState<S> = {
    current: reducerState.state,
    ...Object.assign(
      {},
      ...Object.keys(schema).map(s => ({ [s]: s === reducerState.state }))
    ),
    context: reducerState.context ?? {},
  };

  return [state, dispatcher] as const;
};
