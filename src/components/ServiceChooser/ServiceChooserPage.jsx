import React, { useEffect, useRef, useState } from 'react';
import TextDiagnosisLayout from './layouts/TextDiagnosisLayout.jsx';
import RoomExplorerLayout from './layouts/RoomExplorerLayout.jsx';
import VoiceAssistantLayout from './layouts/VoiceAssistantLayout.jsx';
import SuggestServicePage from '../SuggestService/SuggestServicePage.jsx';
import { buildAnalysis } from '../SuggestService/analysis.js';

/*
 * Same ask, three ways to answer it. The refresh button swaps the way:
 *   1. type the problem   2. set the controls   3. talk to the voice assistant
 * Whichever is used, the answer goes through the same analysis and ends on the
 * same Suggest a service screen, which works like an add-to-cart page.
 */
const layouts = [
  { id: 'text', name: 'Describe your AC issue', Component: TextDiagnosisLayout },
  { id: 'room', name: 'Explore the room', Component: RoomExplorerLayout },
  { id: 'voice', name: 'Voice assistant', Component: VoiceAssistantLayout },
];

const ANALYSIS_MS = 900;

export default function ServiceChooserPage({ onBack, onSelectService, onAddToCart }) {
  const [layoutIndex, setLayoutIndex] = useState(0);
  const [phase, setPhase] = useState('input'); // 'input' | 'analyzing' | 'suggest'
  const [analysis, setAnalysis] = useState(null);
  const timer = useRef(0);
  const current = layouts[layoutIndex];
  const Layout = current.Component;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const backToInput = () => {
    window.clearTimeout(timer.current);
    setPhase('input');
  };

  const switchLayout = () => {
    backToInput();
    setLayoutIndex((index) => (index + 1) % layouts.length);
  };

  /* Every version calls this with what the person told us. */
  const suggest = (input) => {
    const result = buildAnalysis(input);
    window.clearTimeout(timer.current);
    setPhase('analyzing');
    timer.current = window.setTimeout(() => {
      /* Moving an AC is an installation, not a repair: go straight to that service. */
      if (result.relocation && result.confirmed.length === 0) {
        setPhase('input');
        onSelectService?.(result.acType === 'Window AC' ? 'ac.installation-window' : 'ac.installation-split');
        return;
      }
      setAnalysis(result);
      setPhase('suggest');
    }, ANALYSIS_MS);
  };

  const inputVisible = phase === 'input';
  /* Typed text and controls are kept while the suggestion is open; a voice call is ended. */
  const keepInputMounted = inputVisible || current.id !== 'voice';
  const statusLabel = phase === 'analyzing' ? 'Reading what you told us' : phase === 'suggest' ? 'Suggested service' : current.name;

  return <section className="service-chooser-page">
    <header className="service-chooser-page-header">
      <button type="button" className="service-chooser-page-back" onClick={onBack}>← <span>AC services</span></button>
      <h1>Need a hand?</h1>
      <button className="service-chooser-refresh" type="button" onClick={switchLayout} aria-label={`Switch layout. Current layout: ${current.name}`} title="Switch layout">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.7 9a7 7 0 0 1 11.9-2L20 12M4 12l2.4 5a7 7 0 0 0 11.9-2" /></svg>
      </button>
    </header>
    <div className="service-chooser-page-current" aria-live="polite"><span className="service-chooser-dot" />{statusLabel}</div>

    <main className={`service-chooser-page-layout service-chooser-page-layout-${current.id}`} key={current.id} style={inputVisible ? undefined : { display: 'none' }}>
      {keepInputMounted && <Layout onSwitchLayout={switchLayout} hideHeader onSelectService={onSelectService} onSuggest={suggest} />}
    </main>

    {phase === 'analyzing' && <main className="service-chooser-page-layout service-chooser-page-layout-suggest">
      <section className="smart-ac">
        <div className="smart-ac-loading" role="status"><span className="smart-ac-spinner" /><h1>Looking at what you told us</h1><p>We’re picking the service that fits.</p></div>
      </section>
    </main>}

    {phase === 'suggest' && analysis && <main className="service-chooser-page-layout service-chooser-page-layout-suggest">
      <SuggestServicePage analysis={analysis} onAddToCart={onAddToCart} onChangeAnswers={backToInput} />
    </main>}
  </section>;
}
