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

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type Override<T1, T2> = Omit<T1, keyof T2> & T2;

type TypeOrEmpty<T> = T extends {} ? T : {};

const isFunction = (arg: any): arg is Function => typeof arg === "function";

const isObject = (arg: any): arg is object => typeof arg === "object";

type EventMapType = {
  [event: string]: any;
};

type ContextType = {
  [property: string]: any;
};

type State = {
  context: ContextType;
  on: EventMapType;
};

type StateMapType = {
  [state: string]: State;
};

type Machine = {
  states: StateMapDefinition;
  context?: ContextType;
  // events?: EventMapType;
};

type MachineType = {
  states: StateMapType;
  context: ContextType;
};

type StateWithDefaults<S extends Partial<State>> = {
  context: TypeOrEmpty<S["context"]>;
  on: TypeOrEmpty<S["on"]>;
};

type StateMapDefinitionWithDefaults<S extends StateMapDefinition> = {
  [K in keyof S]: StateWithDefaults<S[K]>;
};

type MachineTypeWithDefaults<M extends Machine> = {
  states: StateMapDefinitionWithDefaults<M["states"]>;
  context: TypeOrEmpty<M["context"]>;
  // events: TypeOrEmpty<M["events"]>
};

type StateMapDefinition = {
  [state: string]: Partial<State>;
};

type CompatibleContextStates<
  S extends StateMapType,
  Current extends keyof S
> = {
  [K in keyof S]: S[Current]["context"] extends S[K]["context"] ? K : never;
}[keyof S];

/** Transition result where the state is the same,
 * and doesn't have to be explicitly defined */
type ContextUpdate<
  S extends StateMapType,
  Current extends keyof S
> = S[Current]["context"];

/** Object describing the next state (and context, if required) for a transition */
type UpdateObject<S extends StateMapType> = {
  [K in keyof S]: {
    state: K;
  } & ({} extends S[K]["context"] // optional context if weak type
    ? { context?: S[K]["context"] }
    : S[K]["context"] extends undefined
    ? {}
    : { context: S[K]["context"] });
}[keyof S];

/** The resulting state after a transition */
type Update<S extends StateMapType, Current extends keyof S> =
  | CompatibleContextStates<S, Current>
  | XOR<ContextUpdate<S, Current>, UpdateObject<S>>;

type Dispatcher<S extends StateMapType> = UnionToIntersection<
  {
    [K in keyof S]: {
      [E in keyof S[K]["on"]]: S[K]["on"][E] extends null
        ? () => void
        : (payload: S[K]["on"][E]) => void;
    };
  }[keyof S]
>;

const createDispatcher = <M extends Machine>(
  schema: Schema<M>,
  dispatchFn: (action: any) => void
): Dispatcher<States<MachineTypeWithDefaults<M>>> => {
  const events = Array.from(
    new Set(Object.values(schema).flatMap(Object.keys))
  );
  const dispatcher = Object.assign(
    {},
    ...events.map((event) => ({
      //@ts-ignore
      [event]: (payload: unknown) => dispatchFn({ type: event, payload }),
    }))
  ) as Dispatcher<States<MachineTypeWithDefaults<M>>>;

  return dispatcher;
};

type CleanupFunction = () => void;
type EffectFunction<S extends StateMapType> = (
  dispatcher: Dispatcher<S>
) => void | CleanupFunction;

/** The result of a transition */
type Transition<S extends StateMapType, Current extends keyof S> = Update<
  S,
  Current
> | void;

type CreateTransitionFnMachineObject<
  S extends StateMapType,
  Current extends keyof S
> = {
  state: Current;
  context: S[Current]["context"];
  exec: (effect: EffectFunction<S>) => void;
};

type CreateTranstionFn<
  S extends StateMapType,
  Current extends keyof S,
  P extends any
> = [P] extends [never]
  ? (
      machine: Expand<CreateTransitionFnMachineObject<S, Current>>
    ) => Transition<S, Current>
  : (
      machine: Expand<CreateTransitionFnMachineObject<S, Current>>,
      payload: P
    ) => Transition<S, Current>;

/** Reacts to an event and describes the next state and any side-effects */
type EventHandler<
  S extends StateMapType,
  Current extends keyof S,
  P extends any
> = Transition<S, Current> | CreateTranstionFn<S, Current, P>;

type StateEntryEffect<
  S extends StateMapType,
  Current extends keyof S
> = (machine: {
  state: Current;
  previousState?: keyof S;
  context: S[Current]["context"];
  dispatch: Dispatcher<S>;
}) => void;

type StateExitEffect<S extends StateMapType, Current extends keyof S> = (
  machine: {
    [State in keyof S]: {
      nextState: State;
      context: S[State]["context"];
    };
  }[keyof S] & {
    state: keyof S;
    dispatch: Dispatcher<S>;
  }
) => void;

type EventHandlerMap<
  S extends StateMapType,
  K extends keyof S
  // BaseEvents extends EventMapType
> = {
  [E in keyof S[K]["on"]]: EventHandler<S, K, S[K]["on"][E]>;
} & {
  //   } //     [E in keyof BaseEvents]?: EventHandler<S, K, BaseEvents[E]>; //   { // &
  $entry?: StateEntryEffect<S, K>;
  $exit?: StateExitEffect<S, K>;
};

type EventObject<S extends StateMapType> = {
  [K in keyof S]: {
    [E in keyof S[K]["on"]]: S[K]["on"][E] extends {}
      ? { type: E; payload: S[K]["on"][E] }
      : { type: E };
  }[keyof S[K]["on"]];
}[keyof S];

type MachineResult<M extends Machine> = Expand<
  {
    [K in keyof States<MachineTypeWithDefaults<M>>]: {
      current: K;
      context: Expand<States<MachineTypeWithDefaults<M>>[K]["context"]>;
    } & {
      [KK in keyof States<MachineTypeWithDefaults<M>>]: KK extends K
        ? true
        : false;
    } &
      Dispatcher<States<MachineTypeWithDefaults<M>>>;
  }[keyof States<MachineTypeWithDefaults<M>>]
>;

type OptionalContextStates<S extends StateMapType> = {
  [K in keyof S]: {} extends S[K]["context"] ? K : never;
}[keyof S];

type States<M extends MachineType> = {
  [K in keyof M["states"]]: {
    context: Override<M["context"], M["states"][K]["context"]>;
    on: M["states"][K]["on"];
  };
};

type ReducerResultState<M extends MachineType> = {
  [K in keyof States<M>]: {
    current: K;
    context: {} extends States<M>[K]["context"] ? {} : States<M>[K]["context"];
  };
}[keyof States<M>];

type ReducerResult<M extends MachineType> = {
  state: ReducerResultState<M>;
  effects: EffectEntity<ReducerResult<M>, EventObject<States<M>>>[];
};

type Schema<M extends Machine> = {
  [K in keyof States<MachineTypeWithDefaults<M>>]: EventHandlerMap<
    States<MachineTypeWithDefaults<M>>,
    K
  >;
};

type InitialState<M extends Machine> =
  | OptionalContextStates<States<MachineTypeWithDefaults<M>>>
  | UpdateObject<States<MachineTypeWithDefaults<M>>>;

const parseInitialState = <M extends Machine>(
  schema: Schema<M>,
  initialState: InitialState<M>
): ReducerResultState<MachineTypeWithDefaults<M>> => {
  if (typeof initialState === "string") {
    if (initialState in schema) {
      // @ts-ignore
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
        // @ts-ignore
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
  // @ts-ignore
  return;
};

type CreateMachineResult<M extends Machine> = {
  schema: Schema<M>;
  createReducer: (
    dispatcher: Dispatcher<States<MachineTypeWithDefaults<M>>>
  ) => EffectReducer<
    ReducerResult<MachineTypeWithDefaults<M>>,
    EventObject<States<MachineTypeWithDefaults<M>>>
  >;
};

const isCreateMachineResult = <M extends Machine>(
  arg: MachineDefinition<M>
): arg is CreateMachineResult<M> => "schema" in arg && "createReducer" in arg;

type MachineDefinition<M extends Machine> = Schema<M> | CreateMachineResult<M>;

export const createMachine = <M extends Machine>(schema: Schema<M>) => ({
  schema,
  createReducer: (
    dispatcher: Dispatcher<States<MachineTypeWithDefaults<M>>>
  ) => {
    type MachineWithDefaults = MachineTypeWithDefaults<M>;
    type StateMap = States<MachineWithDefaults>;
    const reducer: EffectReducer<
      ReducerResult<MachineWithDefaults>,
      EventObject<StateMap>
    > = ({ state, effects: oldEffects }, event, exec) => {
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

      const newEffects: EffectEntity<
        ReducerResult<MachineWithDefaults>,
        EventObject<StateMap>
      >[] = [];

      const execAndStoreEntity = (effect: EffectFunction<StateMap>) => {
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

      let allEffects: EffectEntity<
        ReducerResult<MachineWithDefaults>,
        EventObject<StateMap>
      >[] = [];
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

export function useMachine<M extends Machine>(
  schema: Schema<M>,
  initialState: InitialState<M>
): MachineResult<M>;

export function useMachine<M extends Machine>(
  createMachineResult: CreateMachineResult<M>,
  initialState: InitialState<M>
): MachineResult<M>;

export function useMachine<M extends Machine>(
  machineDefinition: MachineDefinition<M>,
  initialState: InitialState<M>
): MachineResult<M> {
  type MachineWithDefaults = MachineTypeWithDefaults<M>;
  type StateMap = States<MachineWithDefaults>;

  const schema = isCreateMachineResult(machineDefinition)
    ? (machineDefinition.schema as Schema<M>)
    : machineDefinition;

  const dispatcher = createDispatcher(schema, (action) => dispatch(action));

  const reducer: EffectReducer<
    ReducerResult<MachineWithDefaults>,
    EventObject<StateMap>
  > = isCreateMachineResult(machineDefinition)
    ? machineDefinition.createReducer(dispatcher)
    : createMachine(schema).createReducer(dispatcher);

  const [reducerState, dispatch] = useEffectReducer(reducer, (exec) => {
    const initial = parseInitialState(schema, initialState);

    const initialStateNode = schema[initial.current];
    const effects: EffectEntity<
      ReducerResult<MachineWithDefaults>,
      EventObject<StateMap>
    >[] = [];
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

      effects.push(effectEntity);
    }
    return { state: initial, effects };
  });

  const state: MachineResult<M> = {
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
}
