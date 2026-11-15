import React from 'react';
import SmartAcFix from '../../SmartAcFix/index.jsx';

export default function RoomExplorerLayout({ onSuggest }) {
  return <SmartAcFix embedded onSuggest={onSuggest} />;
}
