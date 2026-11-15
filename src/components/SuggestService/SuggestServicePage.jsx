import React, { useEffect, useRef } from 'react';
import { mountSuggestApp } from './suggestApp.js';

/**
 * The "Suggest a service" screen. It works like an add-to-cart page: the services
 * we think fit are already ticked, the user can change them, and one button puts
 * them in the cart.
 *
 * analysis       result of buildAnalysis() (see analysis.js)
 * onAddToCart    (lines: [{ serviceId, quantity }], { issue, acType }) => void
 * onChangeAnswers () => void   go back to the input the user came from
 */
export default function SuggestServicePage({ analysis, onAddToCart, onChangeAnswers }) {
  const hostRef = useRef(null);
  const callbacks = useRef({ onAddToCart, onChangeAnswers });
  callbacks.current = { onAddToCart, onChangeAnswers };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
    const app = mountSuggestApp(root, {
      analysis,
      onAddToCart: (...args) => callbacks.current.onAddToCart?.(...args),
      onChangeAnswers: () => callbacks.current.onChangeAnswers?.(),
    });
    return () => app.destroy();
  }, [analysis]);

  return <div ref={hostRef} className="suggest-service-host" />;
}
