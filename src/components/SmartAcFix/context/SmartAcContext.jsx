import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

const SmartAcContext = createContext(null);

export const initialSmartAcState = {
  lang: 0,
  env: 'home',
  acStatus: 'on',
  issue: 'none',
  type: 'split',
  brand: 'Voltas',
  temp: 24,
  feel: 'ok',
  open: true,
  sun: 35,
  water: 0,
  dust: 0,
  noise: 0,
  power: true,
  reloc: false,
  svc: false,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

function reduceAction(state, action) {
  switch (action.type) {
    case 'SET_TEMP':
      return { ...state, temp: clamp(action.value, 16, 30) };
    case 'SET_FEEL':
      return { ...state, feel: ['ok', 'hot', 'cold'].includes(action.value) ? action.value : state.feel };
    case 'SET_POWER':
      return { ...state, power: Boolean(action.value), acStatus: action.value ? 'on' : 'off' };
    case 'TOGGLE_POWER':
      return { ...state, power: !state.power, acStatus: state.power ? 'off' : 'on' };
    case 'SET_SLIDER': {
      const ranges = { dust: [0, 100], water: [0, 5], noise: [0, 100], sun: [0, 100] };
      const range = ranges[action.key];
      if (!range) return state;
      const value = clamp(action.value, ...range);
      const issue = action.key === 'dust' && value > 0
        ? 'dust'
        : action.key === 'noise' && value > 0
          ? 'noise'
          : (action.key === state.issue && value === 0 ? 'none' : state.issue);
      return { ...state, [action.key]: value, issue };
    }
    case 'SET_LANG':
      return { ...state, lang: clamp(Math.round(action.value), 0, 2) };
    case 'SET_ENV':
      return { ...state, env: ['home', 'office'].includes(action.value) ? action.value : state.env };
    case 'SET_TYPE':
      return { ...state, type: ['split', 'window'].includes(action.value) ? action.value : state.type };
    case 'SET_BRAND':
      return { ...state, brand: String(action.value || '') };
    case 'SET_OPEN':
      return { ...state, open: Boolean(action.value) };
    case 'SET_RELOC':
      return { ...state, reloc: Boolean(action.value) };
    case 'SET_SERVICE_VISIBLE':
      return { ...state, svc: Boolean(action.value) };
    case 'RESET':
      return { ...initialSmartAcState };
    case 'BATCH':
      return action.actions.reduce(reduceAction, state);
    default:
      return state;
  }
}

export function smartAcReducer(state, action) {
  if (action.type === 'UPDATE_SCENE') {
    const { environment, acStatus, issue, feel, reloc } = action.payload || {};
    if (!['home', 'office'].includes(environment)
      || !['on', 'off', 'hidden'].includes(acStatus)
      || !['none', 'dust', 'noise'].includes(issue)) return state;

    return {
      ...state,
      env: environment,
      acStatus,
      power: acStatus === 'on',
      issue,
      feel: ['ok', 'hot', 'cold'].includes(feel) ? feel : state.feel,
      reloc: typeof reloc === 'boolean' ? reloc : state.reloc,
      temp: feel === 'hot' ? 32 : feel === 'cold' ? 16 : (feel === 'ok' ? 24 : state.temp),
      dust: issue === 'dust' ? 70 : 0,
      noise: issue === 'noise' ? 70 : 0,
    };
  }

  if (action.type === 'APPLY_AI_PAYLOAD') {
    const { condition, severity = 1 } = action.payload || {};
    const level = clamp(severity, 1, 5);
    const actionsByCondition = {
      heat: [
        { type: 'SET_FEEL', value: 'hot' },
        { type: 'SET_TEMP', value: 26 + level },
        { type: 'SET_POWER', value: true },
      ],
      dust: [
        { type: 'SET_SLIDER', key: 'dust', value: level * 20 },
        { type: 'SET_POWER', value: true },
      ],
      vibration: [
        { type: 'SET_SLIDER', key: 'noise', value: level * 20 },
      ],
      water: [
        { type: 'SET_SLIDER', key: 'water', value: level },
      ],
      cold: [
        { type: 'SET_FEEL', value: 'cold' },
        { type: 'SET_TEMP', value: 30 - level },
        { type: 'SET_POWER', value: true },
      ],
    };
    const actions = actionsByCondition[condition];
    return actions ? reduceAction(state, { type: 'BATCH', actions }) : state;
  }
  return reduceAction(state, action);
}

export function SmartAcProvider({ children, initialState }) {
  const [state, dispatch] = useReducer(smartAcReducer, initialState || initialSmartAcState);
  const applyAiPayload = useCallback((payload) => {
    dispatch({ type: 'APPLY_AI_PAYLOAD', payload });
  }, []);
  const value = useMemo(() => ({ state, dispatch, applyAiPayload }), [state, applyAiPayload]);

  return <SmartAcContext.Provider value={value}>{children}</SmartAcContext.Provider>;
}

export function useSmartAc() {
  const context = useContext(SmartAcContext);
  if (!context) throw new Error('useSmartAc must be used inside a SmartAcProvider');
  return context;
}
