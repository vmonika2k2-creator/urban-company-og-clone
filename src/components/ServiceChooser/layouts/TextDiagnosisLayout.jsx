import React from 'react';
import GenerativeACService from '../../GenerativeACService.jsx';

export default function TextDiagnosisLayout({ onSwitchLayout, hideHeader = false }) {
  return <GenerativeACService compact hideHeader={hideHeader} onClassic={onSwitchLayout} classicLabel="Try room layout" />;
}
