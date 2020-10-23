import {
  useEffectReducer,
  EffectReducer,
  EffectEntity,
} from "use-effect-reducer";

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

type EventMapType = {
  [event: string]: any;
};

type ContextType = {
  [property: string]: any;
};

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

type ReducerResultState<S extends StateMap> = {
  [K in keyof S]: {
    current: K;
    context: S[K]["context"] extends undefined ? {} : S[K]["context"];
  };
}[keyof S];

type ReducerResult<S extends StateMap> = {
  state: ReducerResultState<S>;
  effects: EffectEntity<ReducerResult<S>, EventObject<S>>[];
};

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
> | void;

type CreateTransitionFnMachineObject<
  S extends StateMap,
  Current extends keyof S
> = {
  state: Current;
  context: S[Current]["context"];
  exec: (effect: EffectFunction<S>) => void;
};

type CreateTranstionFn<
  S extends StateMap,
  Current extends keyof S,
  P extends any
> = [P] extends [never]
  ? (
      machine: CreateTransitionFnMachineObject<S, Current>
    ) => Transition<S, Current>
  : (
      machine: CreateTransitionFnMachineObject<S, Current>,
      payload: P
    ) => Transition<S, Current>;

/** Reacts to an event and describes the next state and any side-effects */
type EventHandler<S extends StateMap, Current extends keyof S, P extends any> =
  | Transition<S, Current>
  | CreateTranstionFn<S, Current, P>;

type StateEntryEffect<S extends StateMap, Current extends keyof S> = (machine: {
  state: Current;
  previousState?: keyof S;
  context: S[Current]["context"];
  dispatch: Dispatcher<S>;
}) => void;

type StateExitEffect<S extends StateMap, Current extends keyof S> = (machine: {
  state: Current;
  nextState: keyof S;
  context: S[keyof S]["context"];
  dispatch: Dispatcher<S>;
}) => void;

type EventHandlerMap<S extends StateMap, K extends keyof S> = {
  [E in keyof S[K]["on"]]: EventHandler<S, K, S[K]["on"][E]>;
} & {
  $entry?: StateEntryEffect<S, K>;
  $exit?: StateExitEffect<S, K>;
};

type Schema<S extends StateMap> = {
  [K in keyof S]: EventHandlerMap<S, K>;
};

type EventObject<S extends StateMap> = {
  [K in keyof S]: {
    [E in keyof S[K]["on"]]: S[K]["on"][E] extends {}
      ? { type: E; payload: S[K]["on"][E] }
      : { type: E };
  }[keyof S[K]["on"]];
}[keyof S];

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
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

type MachineResult<S extends StateMap> = {
  [K in keyof S]: {
    current: K;
    context: S[K]["context"];
  } & {
    [KK in keyof S]: KK extends K ? true : false;
  } &
    Dispatcher<S>;
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
): ReducerResultState<S> => {
  if (typeof initialState === "string") {
    if (initialState in schema) {
      return {
        current: initialState,
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
      return {
        current: initialState.state,
        context: initialState.context ?? {},
      };
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

type CreateMachineResult<S extends StateMap> = {
  schema: Schema<S>;
  createReducer: (
    dispatcher: Dispatcher<S>
  ) => EffectReducer<ReducerResult<S>, EventObject<S>>;
};

const isCreateMachineResult = <S extends StateMap>(
  arg: MachineDefinition<S>
): arg is CreateMachineResult<S> => "schema" in arg && "createReducer" in arg;

type MachineDefinition<S extends StateMap> = Schema<S> | CreateMachineResult<S>;

export const createMachine = <S extends StateMap>(schema: Schema<S>) => ({
  schema,
  createReducer: (dispatcher: Dispatcher<S>) => {
    const reducer: EffectReducer<ReducerResult<S>, EventObject<S>> = (
      { state, effects: oldEffects },
      event,
      exec
    ) => {
      if (!(state.current in schema)) {
        dev.error(`State '${state.current}' does not exist in schema`);
        return { state, effects: [] };
      }

      const { $exit: exitEffect, ...eventHandlerMap } = schema[state.current];

      if (!eventHandlerMap) {
        if (exitEffect) {
          dev.error(
            `Exit effect was found on state '${state.current}' where no event handlers are defined. This is nonsensical behaviour, as the state can never be exited.`
          );
        }

        return { state, effects: [] };
      }

      // @ts-ignore
      const eventHandler = eventHandlerMap[event.type];

      if (!eventHandler) {
        dev.warn(
          `Event handler for '${event.type}' does not exist in state '${state.current}'`
        );

        return { state, effects: [] };
      }

      const newEffects: EffectEntity<ReducerResult<S>, EventObject<S>>[] = [];

      const execAndStoreEntity = (effect: EffectFunction<S>) => {
        const effectEntity = exec(() => effect(dispatcher));
        newEffects.push(effectEntity);
        return effectEntity;
      };

      const transition = isFunction(eventHandler)
        ? eventHandler(
            {
              state: state.current,
              context: state.context,
              exec: execAndStoreEntity,
            },
            // @ts-ignore
            event?.payload
          )
        : eventHandler;

      const update = transition;

      const getNextState = () => {
        if (isObject(update)) {
          //@ts-ignore
          return "state" in update ? update.state : state.current;
        } else if (typeof update === "string" && update in schema) {
          return update;
        } else if (update === undefined) {
          return state.current;
        } else {
          return undefined;
        }
      };

      const getNextContext = () => {
        if (isObject(update)) {
          return "state" in update
            ? // @ts-ignore
              update.context
            : update;
        } else if (typeof update === "string" && update in schema) {
          return state.context;
        } else if (update === undefined) {
          return state.context;
        } else {
          return undefined;
        }
      };

      const nextState = getNextState();

      const nextContext = getNextContext();

      let allEffects: EffectEntity<ReducerResult<S>, EventObject<S>>[] = [];
      if (nextState && nextState !== state.current) {
        exec(() => {
          oldEffects.forEach((effect) => {
            effect.stop();
          });
        });

        if (exitEffect) {
          const entity = exec(() =>
            exitEffect({
              context: nextContext,
              nextState,
              dispatch: dispatcher,
              state: state.current,
            })
          );
          // Can't call .stop directly, as that will just cancel the effect
          // before it gets a chance to run. have to schedule the stopping
          // as a separate effect
          exec(() => entity.stop());
        }

        const { $entry: nextStateEntryEffect } = schema[nextState];

        if (nextStateEntryEffect) {
          execAndStoreEntity(() => {
            return nextStateEntryEffect({
              context: nextContext,
              previousState: state.current,
              dispatch: dispatcher,
              state: nextState,
            });
          });
        }
        allEffects = newEffects;
      } else {
        allEffects = [...oldEffects, ...newEffects];
      }

      if (!nextState && !nextContext) {
        dev.error(`unknown type of EventNode`, update);
      } else {
        return {
          state: {
            current: nextState,
            context: nextContext,
          },
          effects: allEffects,
        };
      }

      return { state, effects: allEffects };
    };

    return reducer;
  },
});

export const useMachine = <S extends StateMap>(
  machine: MachineDefinition<S>,
  initialState: InitialState<S>
) => {
  const schema = isCreateMachineResult(machine)
    ? (machine.schema as Schema<S>)
    : machine;

  const events = Array.from(
    new Set(Object.values(schema).flatMap(Object.keys))
  );
  const dispatcher = Object.assign(
    {},
    ...events.map((event) => ({
      //@ts-ignore
      [event]: (payload: unknown) => dispatch({ type: event, payload }),
    }))
  ) as Dispatcher<S>;

  const reducer: EffectReducer<
    ReducerResult<S>,
    EventObject<S>
  > = isCreateMachineResult(machine)
    ? machine.createReducer(dispatcher)
    : createMachine(schema).createReducer(dispatcher);

  const [reducerState, dispatch] = useEffectReducer(reducer, (exec) => {
    const initial = parseInitialState(schema, initialState);

    const initialStateNode = schema[initial.current];
    const effects: EffectEntity<ReducerResult<S>, EventObject<S>>[] = [];
    if (initialStateNode.$entry) {
      const effectEntity = exec(
        () =>
          initialStateNode.$entry &&
          initialStateNode.$entry({
            state: initial.current,
            context: initial.context,
            dispatch: dispatcher,
          })
      );
      // TODO: wait for use-effect-reducer release
      // effects.push(effectEntity);
    }
    return { state: initial, effects };
  });

  const state: MachineResult<S> = {
    current: reducerState.state.current,
    ...Object.assign(
      {},
      ...Object.keys(schema).map((s) => ({
        [s]: s === reducerState.state.current,
      }))
    ),
    context: reducerState.state.context ?? {},
    // @ts-ignore
    ...dispatcher,
  };

  return state;
};
