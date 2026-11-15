import React from 'react';
import SmartAcFix from '../../SmartAcFix/index.jsx';

export default function VoiceAssistantLayout(props) {
  return <SmartAcFix embedded voiceOnly onSelectService={props.onSelectService} {...props} />;
}
