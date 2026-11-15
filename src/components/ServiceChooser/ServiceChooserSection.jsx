import React from 'react';

export default function ServiceChooserSection({ onOpen }) {
  return <section className="service-chooser-section" aria-labelledby="service-chooser-title">
    <h2 id="service-chooser-title">Need a hand?</h2>
    <button className="service-chooser-cta" type="button" onClick={onOpen} aria-label="Need a hand? Open service chooser">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </button>
  </section>;
}
