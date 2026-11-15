---
name: genui-react-state-machine
description: Design and implement the React state machine (useReducer + discriminated unions) that drives the Generative Adaptive UI for the AC repair / Urban Company clone. Use this skill whenever the user is working on phase management, screen transitions, the Profiler -> Loading -> Adaptive Canvas flow, Heat/Dust/Vibration mode switching, AI loading/error/fallback states, the Classic View safety hatch, or the admin Kill Switch, even if they just say "manage state", "handle loading", "switch modes" or "what happens when the AI fails".
---

# GenUI React State Machine Architecture

The whole product is one idea: **the UI morphs based on a validated AI result.** That only works if every possible state is explicit, every transition is deliberate, and nothing can end in a broken screen. Use a finite state machine with `useReducer`, not scattered `useState` booleans.

## Why a state machine here

Our users are anxious, elderly or low-tech. A flicker, a stuck spinner, or a half-rendered screen reads to them as "this app is broken / I did something wrong." Boolean soup (`isLoading && !hasError && mode === 'heat'`) produces impossible states. A reducer with a discriminated union makes impossible states unrepresentable.

## The phases

```
idle ──submit──▶ loading ──success──▶ adaptive(heat | dust | vibration)
                    │                        │
                    ├──invalid/timeout──▶ fallback ──▶ classic
                    └──killSwitch────────────────────▶ classic
adaptive/fallback ──switchToClassic──▶ classic
adaptive ──reset──▶ idle
```

| Phase | What the user sees | Notes |
|---|---|---|
| `idle` | Profiler screen: big text area, one prompt | No chat bubbles, ever |
| `loading` | Calm, neutral skeleton + one reassuring line | Must have a timeout |
| `adaptive` | Themed AC graphic + "Why This Matters" card | Carries a validated `AiResult` |
| `fallback` | Neutral screen: "Let us show you the standard options" | Entered on bad JSON, timeout or API error |
| `classic` | Traditional service list (the original clone UI) | Safety hatch; also the kill-switch target |

## Types (single source of truth)

```ts
// types.ts
import { z } from "zod";

export const AiResultSchema = z.object({
  primaryCondition: z.enum(["heat", "dust", "vibration"]),
  calculatedSeverity: z.number().int().min(1).max(5),
  translatedJargonFreeExplanation: z.string().min(10).max(400),
  recommendedServiceTitle: z.string().min(3).max(80),
  estimatedUpfrontPrice: z.number().int().positive().max(50000),
});
export type AiResult = z.infer<typeof AiResultSchema>;

export type FallbackReason = "timeout" | "invalid_json" | "network" | "low_confidence";

export type State =
  | { phase: "idle"; draft: string }
  | { phase: "loading"; userText: string; requestId: number }
  | { phase: "adaptive"; userText: string; result: AiResult; audioOn: boolean }
  | { phase: "fallback"; userText: string; reason: FallbackReason }
  | { phase: "classic" };

export type Action =
  | { type: "DRAFT_CHANGED"; value: string }
  | { type: "SUBMIT" }
  | { type: "AI_SUCCESS"; requestId: number; result: AiResult }
  | { type: "AI_FAILURE"; requestId: number; reason: FallbackReason }
  | { type: "TOGGLE_AUDIO" }
  | { type: "SWITCH_TO_CLASSIC" }
  | { type: "RESET" }
  | { type: "KILL_SWITCH_ON" };
```

## The reducer

```ts
// reducer.ts
export function reducer(state: State, action: Action): State {
  // Kill switch overrides everything, from any phase.
  if (action.type === "KILL_SWITCH_ON") return { phase: "classic" };
  if (action.type === "SWITCH_TO_CLASSIC") return { phase: "classic" };

  switch (state.phase) {
    case "idle":
      if (action.type === "DRAFT_CHANGED") return { ...state, draft: action.value };
      if (action.type === "SUBMIT" && state.draft.trim().length > 2)
        return { phase: "loading", userText: state.draft.trim(), requestId: Date.now() };
      return state;

    case "loading":
      // Ignore stale responses (user resubmitted or reset).
      if (action.type === "AI_SUCCESS" && action.requestId === state.requestId)
        return { phase: "adaptive", userText: state.userText, result: action.result, audioOn: false };
      if (action.type === "AI_FAILURE" && action.requestId === state.requestId)
        return { phase: "fallback", userText: state.userText, reason: action.reason };
      return state;

    case "adaptive":
      if (action.type === "TOGGLE_AUDIO") return { ...state, audioOn: !state.audioOn };
      if (action.type === "RESET") return { phase: "idle", draft: "" };
      return state;

    case "fallback":
      if (action.type === "RESET") return { phase: "idle", draft: state.userText };
      return state;

    case "classic":
      if (action.type === "RESET") return { phase: "idle", draft: "" };
      return state;
  }
}
```

Key properties: unknown action + phase combos return `state` unchanged; `requestId` guards against race conditions; `KILL_SWITCH_ON` and `SWITCH_TO_CLASSIC` work from every phase.

## Side effects live outside the reducer

The reducer stays pure. The AI call happens in an effect keyed on the `loading` phase.

```tsx
// useGenUI.ts
export function useGenUI(killSwitch: boolean) {
  const [state, dispatch] = useReducer(reducer, { phase: "idle", draft: "" });

  useEffect(() => { if (killSwitch) dispatch({ type: "KILL_SWITCH_ON" }); }, [killSwitch]);

  useEffect(() => {
    if (state.phase !== "loading") return;
    const { requestId, userText } = state;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);

    classifyProblem(userText, ctrl.signal) // returns unknown JSON
      .then((raw) => {
        const parsed = AiResultSchema.safeParse(raw);
        if (!parsed.success) return dispatch({ type: "AI_FAILURE", requestId, reason: "invalid_json" });
        dispatch({ type: "AI_SUCCESS", requestId, result: parsed.data });
      })
      .catch((e) =>
        dispatch({ type: "AI_FAILURE", requestId, reason: e.name === "AbortError" ? "timeout" : "network" })
      )
      .finally(() => clearTimeout(timer));

    return () => { ctrl.abort(); clearTimeout(timer); };
  }, [state.phase === "loading" ? state.requestId : null]);

  return [state, dispatch] as const;
}
```

During the `setTimeout` simulation phase, `classifyProblem` can be a mock that resolves after ~1.5s with strict JSON. Swap it for the real API later without touching the reducer.

## Rendering: exhaustive switch, component whitelist

```tsx
function App() {
  const killSwitch = useRemoteFlag("genui_disabled"); // admin panel flag
  const [state, dispatch] = useGenUI(killSwitch);

  switch (state.phase) {
    case "idle":     return <ProfilerScreen ... />;
    case "loading":  return <CalmLoader />;
    case "adaptive": return <AdaptiveCanvas result={state.result} dispatch={dispatch} />;
    case "fallback": return <FallbackNotice reason={state.reason} dispatch={dispatch} />;
    case "classic":  return <ClassicView />;
    default: { const _exhaustive: never = state; return _exhaustive; }
  }
}

// AI never emits markup. It only picks from this map.
const MODE_COMPONENTS = { heat: HeatCard, dust: DustCard, vibration: VibrationCard } as const;
```

## Rules for this project

1. **No raw AI output reaches the DOM.** Only Zod-validated fields, rendered through whitelisted components.
2. **Every non-happy path ends somewhere kind.** Timeout, bad JSON, network failure, kill switch all land in `fallback` or `classic`, never a blank or spinner.
3. **"Switch to Classic View" is visible in every phase except `classic`.** It is a first-class action, not a footer link.
4. **Loading has a ceiling (8s).** Anxious users assume a frozen screen means failure.
5. **No chat state.** No message arrays, no typing indicators. One input, one visual morph.
6. **Severity drives emphasis, not just colour.** Severity 4 to 5 must use high-contrast treatment (never pale tones on warnings).
7. **Log every transition into `fallback` and every `adaptive` result** so the admin "human-in-the-loop" panel can review misclassifications.
8. **Respect `prefers-reduced-motion`.** Shaking and melting must degrade to a static icon plus border or tint.

## Testing checklist

- Reducer unit tests: each phase x each action (including ignored ones)
- Stale `requestId` is ignored
- Invalid JSON (missing field, severity 9, unknown condition) lands in `fallback`
- Kill switch flips from every phase to `classic`
- Resubmit during loading does not show an old result

## Common mistakes to avoid

- Storing `mode`, `isLoading`, `error` as separate `useState` values
- Running fetch inside the reducer
- Letting the model return `"mode": "heat-and-dust"` and rendering it anyway (Zod enum catches this)
- Mutating the theme via inline AI-provided class strings (use a lookup table of Tailwind classes instead)

