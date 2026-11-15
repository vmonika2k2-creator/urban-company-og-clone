import React from 'react';
import { formatIndianRupees } from './livekitRpc.js';

export default function RecommendationCard({ recommendation, onSelect, hideDetails = false }) {
  if (!recommendation) return null;
  const ctaText = 'See suggested services';
  if (hideDetails) {
    return React.createElement('section', { className: 'coolcare-card coolcare-recommendation coolcare-recommendation-minimal', 'aria-labelledby': 'coolcare-recommendation-title' },
      React.createElement('div', { className: 'coolcare-recommendation-kicker' }, 'DIAGNOSIS COMPLETE'),
      React.createElement('h2', { id: 'coolcare-recommendation-title' }, recommendation.title || 'AC Diagnosis Ready'),
      React.createElement('button', {
        className: 'smart-ac-primary coolcare-recommendation-action',
        type: 'button',
        onClick: () => onSelect?.(recommendation),
      }, ctaText),
    );
  }
  return React.createElement('section', { className: 'coolcare-card coolcare-recommendation', 'aria-labelledby': 'coolcare-recommendation-title' },
    React.createElement('div', { className: 'coolcare-recommendation-kicker' }, 'VAAYU RECOMMENDS'),
    React.createElement('h2', { id: 'coolcare-recommendation-title' }, recommendation.title),
    React.createElement('p', { className: 'coolcare-recommendation-price' }, formatIndianRupees(recommendation.estimated_cost)),
    React.createElement('p', { className: 'coolcare-recommendation-why' }, recommendation.why_best),
    React.createElement('button', {
      className: 'smart-ac-primary coolcare-recommendation-action',
      type: 'button',
      onClick: () => onSelect?.(recommendation),
    }, recommendation.action_label || ctaText),
  );
}
