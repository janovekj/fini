import {
  useEffectReducer,
  EffectReducer,
  EffectEntity,
} from "use-effect-reducer";

const isProduction = process.env.NODE_ENV === "production";

const dev = {
  warn: (...args: Parameters<typeof console.warn>) =>
    !isProduction && console.warn(...args),
  error: (...args: Parameters<typeof console.error>) =>
    !isProduction && console.error(...args),
};

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type Override<T1, T2> = Omit<T1, keyof T2> & T2;

type TypeOrEmpty<T> = T extends {} ? T : {};

const isObject = (arg: any): arg is object => typeof arg === "object";

const getKeys = <T extends object>(arg: T) =>
  Object.keys(arg) as Array<keyof T>;

interface EventMapType {
  [event: string]: any;
}

interface ContextType {
  [property: string]: any;
}

interface State {
  context: ContextType;
  events: EventMapType;
}

interface StateMapType {
  [state: string]: State;
}

interface Machine {
  states: StateMapDefinition;
  context?: ContextType;
  events?: EventMapType;
}

interface MachineType {
  states: StateMapType;
  context: ContextType;
  events: EventMapType;
}

interface StateWithDefaults<S extends Partial<State>> {
  context: TypeOrEmpty<S["context"]>;
  events: TypeOrEmpty<S["events"]>;
}

type StateMapDefinitionWithDefaults<S extends StateMapDefinition> = {
  [K in keyof S]: StateWithDefaults<S[K]>;
};

interface MachineTypeWithDefaults<M extends Machine> {
  states: StateMapDefinitionWithDefaults<M["states"]>;
  context: TypeOrEmpty<M["context"]>;
  events: TypeOrEmpty<M["events"]>;
}

interface StateMapDefinition {
  [state: string]: Partial<State>;
}

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
type Update<S extends StateMapType> = UpdateObject<S>;

type DispatchEvent<P> = [void] extends [P] ? () => void : (payload: P) => void;

type Dispatcher<M extends MachineType> = UnionToIntersection<
  {
    [K in keyof States<M>]: {
      [E in keyof States<M>[K]["events"]]: DispatchEvent<
        States<M>[K]["events"][E]
      >;
    };
  }[keyof States<M>]
> &
  {
    [K in keyof M["events"]]: DispatchEvent<M["events"][K]>;
  };

type States<M extends MachineType> = {
  [K in keyof M["states"]]: {
    context: Expand<Override<M["context"], M["states"][K]["context"]>>;
    events: M["states"][K]["events"];
  };
};

const createDispatcher = <M extends Machine>(
  schema: Schema<M>,
  dispatchFn: (action: any) => void
): Dispatcher<MachineTypeWithDefaults<M>> => {
  const events = Array.from(
    new Set(Object.values(schema).flatMap(Object.keys))
  );
  const dispatcher = Object.assign(
    {},
    ...events.map((event) => ({
      //@ts-ignore
      [event]: (payload: unknown) => dispatchFn({ type: event, payload }),
    }))
  ) as Dispatcher<MachineTypeWithDefaults<M>>;

  return dispatcher;
};

interface CleanupFunction extends VoidFunction {}
interface EffectFunction<M extends MachineType> {
  (dispatcher: Dispatcher<M>): void | CleanupFunction;
}

/** The result of a transition */
type Transition<S extends StateMapType> = Update<S> | void;

type ContextDiff<
  States extends StateMapType,
  StateA extends keyof States,
  StateB extends keyof States
> = Expand<
  Override<
    States[StateB]["context"],
    {
      [K in keyof States[StateA]["context"]]?: K extends keyof States[StateB]["context"]
        ? States[StateB]["context"][K] | undefined
        : never;
    }
  >
>;

interface OptionalContextUpdater<
  M extends MachineType,
  Current extends keyof States<M>,
  Target extends keyof States<M>
> {
  (context?: ContextDiff<States<M>, Current, Target>): UpdateObject<States<M>>;
  (
    context: ContextDiff<States<M>, Current, Target>,
    effect: EffectFunction<M>
  ): UpdateObject<States<M>>;
  (effect: EffectFunction<M>): UpdateObject<States<M>>;
}

interface RequiredContextUpdater<
  M extends MachineType,
  Current extends keyof States<M>,
  Target extends keyof States<M>
> {
  (
    context: ContextDiff<States<M>, Current, Target>,
    effect?: EffectFunction<M>
  ): UpdateObject<States<M>>;
}

type Updater<
  M extends MachineType,
  Current extends keyof States<M>,
  Target extends keyof States<M>
> = {} extends ContextDiff<States<M>, Current, Target>
  ? OptionalContextUpdater<M, Current, Target>
  : RequiredContextUpdater<M, Current, Target>;

type UpdaterMap<M extends MachineType, Current extends keyof States<M>> = {
  (effect: EffectFunction<M>): UpdateObject<States<M>>;
} & {
  [K in keyof States<M>]: Updater<M, Current, K>;
};

const createUpdaterMap = <
  M extends MachineType,
  Current extends keyof States<M>
>(
  schema: Schema<M>,
  state: ReducerResultState<M>,
  exec: (effect: EffectFunction<M>) => void
): UpdaterMap<M, Current> => {
  const update = (effect: EffectFunction<M>) => {
    exec(effect);
    return {
      state: state.current,
      context: state.context,
    };
  };

  return Object.assign(
    update,
    ...getKeys(schema).map((key) => {
      return {
        [key]: (arg1, arg2) => {
          const { context, effect } = isObject(arg1)
            ? {
                context: arg1,
                effect: arg2 && typeof arg2 === "function" ? arg2 : undefined,
              }
            : {
                context: undefined,
                effect: arg1 && typeof arg1 === "function" ? arg1 : undefined,
              };

          if (effect) {
            exec(effect);
          }

          return {
            state: key,
            context: context
              ? {
                  ...state.context,
                  ...context,
                }
              : state.context,
          };
        },
      };
    })
  );
};

interface CreateTransitionFnMachineObject<
  M extends MachineType,
  Current extends keyof States<M>
> {
  state: Current;
  context: States<M>[Current]["context"];
  update: UpdaterMap<M, Current>;
}

type CreateTranstionFn<
  M extends MachineType,
  Current extends keyof States<M>,
  P extends any
> = [void] extends [P]
  ? (
      machine: Expand<CreateTransitionFnMachineObject<M, Current>>
    ) => Transition<States<M>>
  : (
      machine: Expand<CreateTransitionFnMachineObject<M, Current>>,
      payload: P
    ) => Transition<States<M>>;

/** Reacts to an event and describes the next state and any side-effects */
type EventHandler<
  M extends MachineType,
  Current extends keyof States<M>,
  P extends any
> = CreateTranstionFn<M, Current, P>;

interface StateEntryEffect<
  M extends MachineType,
  Current extends keyof States<M>
> {
  (machine: {
    state: Current;
    previousState?: keyof States<M>;
    context: States<M>[Current]["context"];
    dispatch: Dispatcher<M>;
  }): void;
}

interface StateExitEffect<M extends MachineType> {
  (
    machine: {
      [State in keyof States<M>]: {
        nextState: State;
        context: States<M>[State]["context"];
      };
    }[keyof States<M>] & {
      state: keyof States<M>;
      dispatch: Dispatcher<M>;
    }
  ): void;
}

type EventHandlerMap<M extends MachineType, K extends keyof States<M>> = {
  [E in keyof States<M>[K]["events"]]: EventHandler<
    M,
    K,
    States<M>[K]["events"][E]
  >;
} &
  {
    [E in keyof M["events"]]?: EventHandler<M, K, M["events"][E]>;
  } & {
    $entry?: StateEntryEffect<M, K>;
    $exit?: StateExitEffect<M>;
  };

type EventObject<S extends StateMapType> = {
  [K in keyof S]: {
    [E in keyof S[K]["events"]]: S[K]["events"][E] extends {}
      ? { type: E; payload: S[K]["events"][E] }
      : { type: E };
  }[keyof S[K]["events"]];
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
      Dispatcher<MachineTypeWithDefaults<M>>;
  }[keyof States<MachineTypeWithDefaults<M>>]
>;

type ReducerResultState<M extends MachineType> = {
  [K in keyof States<M>]: {
    current: K;
    context: {} extends States<M>[K]["context"] ? {} : States<M>[K]["context"];
  };
}[keyof States<M>];

interface ReducerResult<M extends MachineType> {
  state: ReducerResultState<M>;
  effects: EffectEntity<ReducerResult<M>, EventObject<States<M>>>[];
}

type Schema<M extends Machine> = {
  [K in keyof States<MachineTypeWithDefaults<M>>]: EventHandlerMap<
    MachineTypeWithDefaults<M>,
    K
  >;
};

type InitialState<M extends Machine> = UpdateObject<
  States<MachineTypeWithDefaults<M>>
>;

interface CreateInitialState<M extends Machine> {
  (
    initial: {
      [K in keyof States<MachineTypeWithDefaults<M>>]: {} extends States<
        MachineTypeWithDefaults<M>
      >[K]["context"]
        ? () => InitialState<M>
        : (
            context: States<MachineTypeWithDefaults<M>>[K]["context"]
          ) => InitialState<M>;
    }
  ): InitialState<M>;
}

const parseInitialState = <M extends Machine>(
  schema: Schema<M>,
  initialState: InitialState<M>
): ReducerResultState<MachineTypeWithDefaults<M>> => {
  if (initialState.state in schema) {
    return {
      current: initialState.state,
      // @ts-ignore
      context: initialState.context ?? {},
    };
  } else {
    dev.error(
      `State '${initialState.state}' does not exist in schema: ${JSON.stringify(
        schema
      )}`
    );
  }

  // @ts-ignore
  return;
};

interface CreateMachineResult<M extends Machine> {
  schema: Schema<M>;
  createReducer: (
    dispatcher: Dispatcher<MachineTypeWithDefaults<M>>
  ) => EffectReducer<
    ReducerResult<MachineTypeWithDefaults<M>>,
    EventObject<States<MachineTypeWithDefaults<M>>>
  >;
}

const isCreateMachineResult = <M extends Machine>(
  arg: MachineDefinition<M>
): arg is CreateMachineResult<M> => "schema" in arg && "createReducer" in arg;

type MachineDefinition<M extends Machine> = Schema<M> | CreateMachineResult<M>;

export const createMachine = <M extends Machine>(
  schema: Schema<M>
): CreateMachineResult<M> => ({
  schema,
  createReducer: (dispatcher: Dispatcher<MachineTypeWithDefaults<M>>) => {
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
            `Exit effect was found on state '${state.current}' where no event handlers are defined. This is undefined behaviour, as the state can never be exited.`
          );
        }

        return { state, effects: [] };
      }

      // @ts-ignore - TODO: this should really be fixed
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

      const execAndStoreEntity = (
        effect: EffectFunction<MachineWithDefaults>
      ) => {
        const effectEntity = exec(() => effect(dispatcher));
        newEffects.push(effectEntity);
        return effectEntity;
      };

      const transition = eventHandler(
        {
          state: state.current,
          context: state.context,
          // @ts-ignore
          update: createUpdaterMap(schema, state, execAndStoreEntity),
        },
        // @ts-ignore
        event?.payload
      );

      const update = transition;

      const getNextState = () => {
        if (isObject(update)) {
          // @ts-ignore
          return update.state;
        } else if (update === undefined) {
          return state.current;
        } else {
          return undefined;
        }
      };

      const getNextContext = () => {
        if (isObject(update)) {
          // @ts-ignore
          return update.context;
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
  initialState: CreateInitialState<M>
): MachineResult<M>;

export function useMachine<M extends Machine>(
  createMachineResult: CreateMachineResult<M>,
  initialState: CreateInitialState<M>
): MachineResult<M>;

export function useMachine<M extends Machine>(
  machineDefinition: MachineDefinition<M>,
  initialState: CreateInitialState<M>
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

  const states: CreateInitialState<MachineWithDefaults> = Object.assign(
    {},
    ...getKeys(schema).map((key) => ({
      [key]: (context) => ({
        state: key,
        context,
      }),
    }))
  );

  const [reducerState, dispatch] = useEffectReducer(reducer, (exec) => {
    // @ts-ignore
    const initial = parseInitialState(schema, initialState(states));

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
      })),
      dispatcher
    ),
    context: reducerState.state.context ?? {},
  };

  return state;
}
