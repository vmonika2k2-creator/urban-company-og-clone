export const VAAYU_LANGUAGES = ['en', 'hi', 'te', 'ta', 'ml', 'kn'];

function readPayload(payload) {
  try {
    const value = typeof payload === 'string' ? JSON.parse(payload) : payload;
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function formatIndianRupees(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount) : '₹0';
}

export function registerVaayuRpcMethods(localParticipant, { dispatch, getState, setRecommendation, setLanguage, setInspecting, setInterfaceRevealed }) {
  const handlers = {
    reveal_interface: async () => {
      setInterfaceRevealed?.(true);
      return 'ok';
    },
    inspection_start: async ({ payload } = {}) => {
      const value = readPayload(payload);
      setInspecting?.(true, value);
      return 'ok';
    },
    update_visual_scene: async ({ payload } = {}) => {
      const value = readPayload(payload);
      const current = getState();
      let feel = current.feel;
      if (value.environment === 'desert') feel = 'hot';
      else if (value.environment === 'antarctica') feel = 'cold';
      else if (value.environment === 'home') feel = 'ok';

      const environment = ['home', 'office'].includes(value.environment) ? value.environment : current.env;
      const acStatus = ['on', 'off', 'hidden'].includes(value.ac_status) ? value.ac_status : current.acStatus;
      const issue = ['none', 'dust', 'noise'].includes(value.issue) ? value.issue : current.issue;
      const reloc = acStatus === 'hidden' ? true : (acStatus === 'on' ? false : current.reloc);
      dispatch({ type: 'UPDATE_SCENE', payload: { environment, acStatus, issue, feel, reloc } });
      return 'ok';
    },
    show_recommendation: async ({ payload } = {}) => {
      setInspecting?.(false);
      const value = readPayload(payload);
      const estimatedCost = Number(value.estimated_cost);
      if (typeof value.title === 'string' && value.title.trim() && Number.isFinite(estimatedCost) && estimatedCost > 0
        && typeof value.why_best === 'string' && typeof value.action_label === 'string') {
        setRecommendation({ ...value, title: value.title.trim(), estimated_cost: estimatedCost });
      }
      return 'ok';
    },
    set_language: async ({ payload } = {}) => {
      const value = readPayload(payload);
      if (VAAYU_LANGUAGES.includes(value.language)) setLanguage(value.language);
      return 'ok';
    },
  };

  Object.entries(handlers).forEach(([method, handler]) => localParticipant.registerRpcMethod(method, handler));
  return () => Object.keys(handlers).forEach((method) => localParticipant.unregisterRpcMethod(method));
}
