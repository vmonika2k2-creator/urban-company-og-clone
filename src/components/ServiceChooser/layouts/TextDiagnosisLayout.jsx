import React from 'react';
import GenerativeACService from '../../GenerativeACService.jsx';

export default function TextDiagnosisLayout({ onSwitchLayout, hideHeader = false, onSuggest }) {
  return <GenerativeACService compact hideHeader={hideHeader} onClassic={onSwitchLayout} classicLabel="Try room layout" onSuggest={onSuggest} />;
}
