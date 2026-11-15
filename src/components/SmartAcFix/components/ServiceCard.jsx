import React from 'react';
import { useSmartAc } from '../context/SmartAcContext.jsx';
import { translate, translations } from '../data/translations.js';

const currency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

export default function ServiceCard({ service }) {
  const { state } = useSmartAc();
  const lang = state.lang;
  if (!service) return <article className="coolcare-card coolcare-service-card"><h2>{translate('noIssue', lang)}</h2><p>Try adjusting the room controls to explore possible AC issues.</p></article>;

  const copy = translations.services[service.id];
  const isEnglish = lang === 0;
  const localizedSteps = isEnglish ? copy.steps : copy.steps;
  return <article className="coolcare-card coolcare-service-card" aria-live="polite">
    <span className="coolcare-kicker">{translate('recommended', lang)}</span>
    <div className="coolcare-service-title"><span aria-hidden="true">{{ i: '📦', f: '🧼', g: '❄️', r: '🔧' }[service.id]}</span><div><h2>{copy.title[lang]}</h2><p>{copy.description[lang]}</p></div></div>
    <div className="coolcare-price"><strong>{currency(service.price)}</strong><del>{currency(service.originalPrice)}</del><span>{service.discount}% off</span></div>
    <div className="coolcare-service-meta"><span>⏱ {service.duration}</span><span>🛡 30-day warranty</span><span>✓ Verified professionals</span></div>
    <h3>{translate('inspect', lang)}</h3>
    <p className="coolcare-service-why">{copy.why[lang]}</p>
    <ol className="coolcare-service-steps">{localizedSteps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>
    <div className="coolcare-impact"><span>Current impact</span><i><b style={{ width: `${service.severity}%` }} /></i><span>After service</span><i><b className="coolcare-impact-after" style={{ width: '96%' }} /></i></div>
    <p className="coolcare-sample-note">Sample demonstration price. Final scope and price are confirmed after inspection.</p>
  </article>;
}
