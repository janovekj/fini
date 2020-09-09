import { useEffectReducer, EffectReducer } from "use-effect-reducer";

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

type Values<T extends {}> = T[keyof T];
type Tuplize<T extends {}[]> = Pick<
  T,
  Exclude<keyof T, Extract<keyof {}[], string> | number>
>;
type _OneOf<T extends {}> = Values<
  {
    [K in keyof T]: T[K] &
      {
        [M in Values<{ [L in keyof Omit<T, K>]: keyof T[L] }>]?: undefined;
      };
  }
>;

type OneOf<T extends {}[]> = _OneOf<Tuplize<T>>;

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

/** Helper type for defining machine types. 
 * 
 * Use the first type argument to provide your states and events.
 * 
 * Use the second type argument to provide the base machine context, 
 * i.e. the narrowest common data for all states
 
 Example:
 ```typescript
type MyMachine = Machine<
  {
    idle: State<{
      edit: Event;
    }>;
    editing: State<
      {
        change: Event<{ newValue: string }>;
      },
      { value: string }
    >;
  },
  { value?: string }
>;
```
 */
export type Machine<
  S extends StateMap,
  BaseContext extends ContextType = {}
> = {
  [K in keyof S]: MachineState<BaseContext, S[K]>;
};

type CompatibleContextStates<S extends StateMap, Current extends keyof S> = {
  [K in keyof S]: S[Current]["context"] extends S[K]["context"] ? K : never;
}[keyof S];

/** Transition result where the state is the same,
 * and doesn't have to be explicitly defined */
type SelfNextStateObject<
  S extends StateMap,
  Current extends keyof S
> = S[Current]["context"];

/** Object describing the next state (and context, if required) for a transition */
type NextStateObject<S extends StateMap> = {
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
type NextState<S extends StateMap, Current extends keyof S> =
  | CompatibleContextStates<S, Current>
  | OneOf<[SelfNextStateObject<S, Current>, NextStateObject<S>]>;

type CleanupFunction = () => void;
type EffectFunction = () => void | CleanupFunction;

/** A tuple of either just an effect,
 * or an effect and the next state for the transition */
type EffectNextStateTuple<S extends StateMap, Current extends keyof S> =
  | [EffectFunction]
  | [EffectFunction, NextState<S, Current>];

/** The result of a transition */
type Transition<S extends StateMap, Current extends keyof S> =
  | NextState<S, Current>
  | EffectNextStateTuple<S, Current>;

/** Reacts to an event and describes the next state and any side-effects */
type EventHandler<
  S extends StateMap,
  Current extends keyof S,
  P extends EventPayload
> =
  | Transition<S, Current>
  | (P extends {}
      ? (context: S[Current]["context"], payload: P) => Transition<S, Current>
      : (context: S[Current]["context"]) => Transition<S, Current>);

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
  | NextStateObject<S>;

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
      if (__DEV__) {
        console.error(
          `State '${initialState}' does not exist in schema: ${JSON.stringify(
            schema
          )}`
        );
      }
    }
  } else if (isObject(initialState)) {
    if (initialState.state in schema) {
      return initialState;
    } else {
      if (__DEV__) {
        console.error(
          `State '${
            initialState.state
          }' does not exist in schema: ${JSON.stringify(schema)}`
        );
      }
    }
  }
  return;
};

export const useMachine = <S extends StateMap>(
  schema: Schema<S>,
  initialState: InitialState<S>
) => {
  const reducer: EffectReducer<ReducerState<S>, EventObject<S>> = (
    state,
    event,
    exec
  ) => {
    // @ts-expect-error
    if (!state.state in schema) {
      if (__DEV__) {
        console.error(`State '${state.state}' does not exist in schema`);
      }
      return state;
    }

    const currentNode = schema[state.state];

    const eventHandler = currentNode[event.type];

    if (!eventHandler) {
      if (__DEV__) {
        console.warn(
          `Event handler for '${event.type}' does not exist in state '${state.state}'`
        );
      }

      return state;
    }

    const handleEffectStateTuple = (
      result: EffectNextStateTuple<S, typeof state["state"]>
    ) => {
      if (result.length === 2) {
        const [effect, newState] = result;
        exec(effect);

        return "state" in newState
          ? newState
          : {
              state: state.state,
              context: newState,
            };
      } else {
        const [effect] = result;
        exec(effect);
        return state;
      }
    };

    const update = isFunction(eventHandler)
      ? eventHandler(state.context, event?.payload)
      : eventHandler;

    if (Array.isArray(update)) {
      return handleEffectStateTuple(update);
    } else if (isObject(update)) {
      // somethings wrong
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
      if (__DEV__) {
        console.error(`unknown type of EventNode`, update);
      }
    }
    return state;
  };

  const initial: ReducerState<S> = (parseInitialState(
    schema,
    initialState
  ) as unknown) as ReducerState<S>;

  const [reducerState, dispatch] = useEffectReducer(reducer, initial);

  const state: CurrentState<S> = {
    current: reducerState.state,
    ...Object.assign(
      {},
      ...Object.keys(schema).map(s => ({ [s]: s === reducerState.state }))
    ),
    context: reducerState.context ?? {},
  };

  const events = Array.from(
    new Set(Object.values(schema).flatMap(Object.keys))
  );
  const dispatcher = Object.assign(
    {},
    ...events.map(event => ({
      [event]: (payload: unknown) => dispatch({ type: event, payload }),
    }))
  ) as Dispatcher<S>;

  return [state, dispatcher] as const;
};
