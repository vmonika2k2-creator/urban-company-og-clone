import React, { useState } from 'react';
import TextDiagnosisLayout from './layouts/TextDiagnosisLayout.jsx';
import RoomExplorerLayout from './layouts/RoomExplorerLayout.jsx';
import VoiceAssistantLayout from './layouts/VoiceAssistantLayout.jsx';

const layouts = [
  { id: 'text', name: 'Describe your AC issue', Component: TextDiagnosisLayout },
  { id: 'room', name: 'Explore the room', Component: RoomExplorerLayout },
  { id: 'voice', name: 'Voice assistant', Component: VoiceAssistantLayout },
];

export default function ServiceChooserPage({ onBack, onSelectService }) {
  const [layoutIndex, setLayoutIndex] = useState(0);
  const current = layouts[layoutIndex];
  const Layout = current.Component;
  const switchLayout = () => setLayoutIndex((index) => (index + 1) % layouts.length);

  return <section className="service-chooser-page">
    <header className="service-chooser-page-header">
      <button type="button" className="service-chooser-page-back" onClick={onBack}>← <span>AC services</span></button>
      <h1>Need a hand?</h1>
      <button className="service-chooser-refresh" type="button" onClick={switchLayout} aria-label={`Switch layout. Current layout: ${current.name}`} title="Switch layout">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.7 9a7 7 0 0 1 11.9-2L20 12M4 12l2.4 5a7 7 0 0 0 11.9-2" /></svg>
      </button>
    </header>
    <div className="service-chooser-page-current" aria-live="polite"><span className="service-chooser-dot" />{current.name}</div>
    <main className={`service-chooser-page-layout service-chooser-page-layout-${current.id}`} key={current.id}>
      <Layout onSwitchLayout={switchLayout} hideHeader onSelectService={onSelectService} />
    </main>
  </section>;
}
