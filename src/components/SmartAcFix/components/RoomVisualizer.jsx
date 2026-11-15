import React, { useMemo, useState } from 'react';
import { useSmartAc } from '../context/SmartAcContext.jsx';
import { LANGUAGES, translate } from '../data/translations.js';
import Tooltip from './Tooltip.jsx';

function seededParticles(count, seed, width, height) {
  let value = seed;
  const random = () => { value = (value * 16807) % 2147483647; return (value - 1) / 2147483646; };
  return Array.from({ length: count }, (_, index) => ({
    id: `${seed}-${index}`,
    x: Math.round(20 + random() * (width - 40)),
    y: Math.round(24 + random() * (height - 48)),
    radius: +(1.2 + random() * 2).toFixed(1),
    delay: `${-(random() * 6).toFixed(2)}s`,
    duration: `${(4 + random() * 3).toFixed(2)}s`,
  }));
}

export default function RoomVisualizer() {
  const { state } = useSmartAc();
  const [tip, setTip] = useState('');
  const dustParticles = useMemo(() => seededParticles(60, 4201, 360, 212), []);
  const snowflakes = useMemo(() => seededParticles(30, 7817, 360, 230), []);
  const lang = LANGUAGES[state.lang]?.locale || LANGUAGES[0].locale;
  const warm = state.feel === 'hot' && state.power;
  const cold = state.feel === 'cold' && state.power;
  const office = state.env === 'office';
  const dustVisible = Math.round(state.dust * 0.6);
  const dripPoint = state.type === 'split' ? { x: 328, y: 92 } : { x: 138, y: 159 };
  const showDrops = state.water >= 0.05;
  const showPuddle = state.water >= 2.5;
  const labels = [];
  if (state.sun > 0) labels.push({ key: 'sun', text: translate('sun', state.lang) });
  if (warm) labels.push({ key: 'warm', text: translate('feelHot', state.lang) });
  if (cold) labels.push({ key: 'cold', text: translate('feelCold', state.lang) });
  if (state.dust > 20) labels.push({ key: 'dust', text: translate('dustIssue', state.lang) });
  if (state.power && state.noise >= 10) labels.push({ key: 'noise', text: translate('noiseIssue', state.lang) });
  if (showDrops) labels.push({ key: 'water', text: translate('waterIssue', state.lang) });
  if (!state.power) labels.push({ key: 'power', text: translate('powerIssue', state.lang) });
  if (state.reloc) labels.push({ key: 'relocation', text: translate('relocationIssue', state.lang) });

  const explain = (event) => {
    const target = event.target.closest('[data-tip]');
    if (!target) return;
    const tips = {
      ac: `${state.brand} ${state.type === 'split' ? translate('split', state.lang) : translate('window', state.lang)}, ${state.temp}°C`,
      window: translate('sun', state.lang), curtains: translate('curtains', state.lang),
      airflow: translate('dustIssue', state.lang), pipe: translate('waterIssue', state.lang),
      dust: translate('dustLevel', state.lang),
    };
    setTip(tips[target.dataset.tip] || translate('readTip', state.lang));
  };

  return (
    <figure className={`coolcare-room ${warm ? 'room-is-hot' : ''} ${cold ? 'room-is-cold' : ''}`}>
      <div className="coolcare-scene">
        <svg viewBox="0 0 360 300" role="img" aria-label={translate('currentRoom', state.lang)} onClick={explain}>
          <defs>
            <linearGradient id="roomSky" x2="0" y2="1"><stop offset="0" stopColor={warm ? '#ffcf70' : cold ? '#8fc7ff' : '#7cc7ff'} /><stop offset="1" stopColor={warm ? '#ff8f4a' : '#e3f4ff'} /></linearGradient>
            <linearGradient id="sunBeam" x2="1" y2="1"><stop offset="0" stopColor="#ffb347" stopOpacity=".7" /><stop offset="1" stopColor="#ffb347" stopOpacity="0" /></linearGradient>
            <linearGradient id="waterFill" x2="0" y2="1"><stop offset="0" stopColor="#6bb8ff" stopOpacity=".48" /><stop offset="1" stopColor="#1f6fd1" stopOpacity=".76" /></linearGradient>
            <clipPath id="windowClip"><rect x="16" y="36" width="130" height="130" /></clipPath>
            <clipPath id="floorClip"><rect y="212" width="360" height="88" /></clipPath>
          </defs>
          <rect width="360" height="212" fill={warm ? '#f7dcae' : cold ? '#e8f3fb' : office ? '#e9eef2' : '#f6ead9'} />
          <rect y="212" width="360" height="88" fill={warm ? '#e6c48a' : cold ? '#cfe3f1' : office ? '#aeb8c0' : '#c9a77c'} />
          <path d="M0 210H360" stroke="#0002" strokeWidth="5" />
          <g opacity={state.reloc ? 0.2 : state.env === 'home' ? 1 : 0} style={{ transition: 'opacity .5s' }}>
            <ellipse cx="262" cy="262" rx="95" ry="15" fill="#d98a3d" /><ellipse cx="262" cy="262" rx="70" ry="10" fill="none" stroke="#fff" strokeOpacity=".5" strokeDasharray="6 4" />
            <rect x="190" y="164" width="146" height="34" rx="10" fill="#b8452c" /><rect x="186" y="186" width="154" height="30" rx="9" fill="#cf5a3e" /><rect x="196" y="214" width="6" height="12" fill="#5a3a22" /><rect x="324" y="214" width="6" height="12" fill="#5a3a22" />
            <rect x="26" y="198" width="16" height="16" fill="#b5651d" /><ellipse cx="34" cy="188" rx="6" ry="12" fill="#2f9e5b" /><ellipse cx="40" cy="190" rx="4" ry="9" fill="#3dbb72" />
          </g>
          <g opacity={state.reloc ? 0.2 : office ? 1 : 0} style={{ transition: 'opacity .5s' }}>
            <g fill="#fff"><rect x="30" y="4" width="70" height="7" /><rect x="145" y="4" width="70" height="7" /><rect x="260" y="4" width="70" height="7" /></g>
            <rect x="170" y="98" width="4" height="114" fill="#8fb8c9" />
            <rect x="174" y="98" width="30" height="60" fill="#bfe3f0" opacity=".6" />
            <path d="M188 197h76v7h-76zm5 7h4v22h-4zm64 0h4v22h-4z" fill="#806447" />
            <rect x="207" y="168" width="34" height="25" rx="3" fill="#2b3138" />
            <path d="M222 193v4m-7-1h14" stroke="#59636d" strokeWidth="2" />
            <path d="M214 194h20l-2 2h-16z" fill="#d9e0e5" />
            <g transform="translate(142 216)" fill="#0a7f6b" stroke="#075e50" strokeWidth="2" strokeLinejoin="round">
              <rect x="2" y="0" width="25" height="18" rx="5" />
              <rect x="0" y="16" width="29" height="8" rx="3" fill="#15937e" />
              <path d="M14 24v11m-10 0h20m-16 0-5 5m17-5 5 5" fill="none" />
              <circle cx="-3" cy="40" r="2" fill="#4d5962" stroke="none" />
              <circle cx="31" cy="40" r="2" fill="#4d5962" stroke="none" />
            </g>
            <g transform="translate(267 216)" fill="#0a7f6b" stroke="#075e50" strokeWidth="2" strokeLinejoin="round">
              <rect x="2" y="0" width="25" height="18" rx="5" />
              <rect x="0" y="16" width="29" height="8" rx="3" fill="#15937e" />
              <path d="M14 24v11m-10 0h20m-16 0-5 5m17-5 5 5" fill="none" />
              <circle cx="-3" cy="40" r="2" fill="#4d5962" stroke="none" />
              <circle cx="31" cy="40" r="2" fill="#4d5962" stroke="none" />
            </g>
            <g stroke="#62717d" strokeWidth="2" strokeLinejoin="round">
              <path d="M304 207h48m-43 0v42m38-42v42" fill="none" />
              <rect x="306" y="184" width="44" height="23" rx="3" fill="#cfd7de" />
              <rect x="312" y="178" width="32" height="10" rx="2" fill="#f8fafc" />
              <rect x="316" y="201" width="27" height="7" fill="#fff" />
              <path d="M314 197h28" />
              <circle cx="345" cy="193" r="1.5" fill="#0a7f6b" stroke="none" />
            </g>
          </g>
          <g data-tip="window" role="button" tabIndex="0" aria-label={translate('sun', state.lang)}>
            <rect x="10" y="30" width="142" height="142" rx="6" fill="#fff" stroke="#b9c2cc" strokeWidth="3" />
            <g clipPath="url(#windowClip)">
              <rect x="16" y="36" width="130" height="130" fill="url(#roomSky)" />
              <circle cx="108" cy="72" r={Math.max(8, 14 + state.sun * 0.22)} fill="#ff9800" opacity={state.sun / 100} />
              <g className="sun-rays" transform="translate(108 72)" opacity={state.sun / 100} stroke="#ff9800" strokeWidth="2.5">{Array.from({ length: 8 }, (_, i) => <line key={i} x1="20" x2="29" transform={`rotate(${i * 45})`} />)}</g>
              <path d="M16 150Q60 118 100 148T146 138V166H16Z" fill={cold ? '#fff' : '#d49a48'} opacity={cold ? 1 : 0} />
            </g>
            <rect className="room-curtain" x="16" y="36" width={state.open ? 22 : 65} height="130" fill="#e76f51" data-tip="curtains" />
            <rect className="room-curtain room-curtain-right" x="146" y="36" width={state.open ? 22 : 65} height="130" fill="#e76f51" data-tip="curtains" />
            <path d="M81 36v130M16 101h130" stroke="#b9c2cc" strokeWidth="2" pointerEvents="none" />
          </g>
          <path d="M16 40L146 40 310 285 70 292Z" fill="url(#sunBeam)" opacity={state.open ? state.sun / 170 : state.sun / 1000} pointerEvents="none" />
          {state.acStatus !== 'hidden' && !state.reloc && (state.type === 'split' ? <g data-tip="ac" role="button" tabIndex="0" aria-label={`Split air conditioner ${state.acStatus}`} className={state.acStatus === 'on' && (state.issue === 'noise' || state.noise > 35) ? 'room-ac-shake' : ''} opacity={state.acStatus === 'off' ? 0.72 : 1}>
            <path d="M330 84h12v26" stroke="#7a8794" strokeWidth="5" fill="none" strokeLinecap="round" data-tip="pipe" />
            <rect x="180" y="44" width="150" height="46" rx="9" fill="#fbfbfb" stroke="#cfd6dd" strokeWidth="2" />
            <rect x="190" y="76" width="130" height="8" rx="3" fill={state.dust >= 40 ? '#7a6a58' : '#2b3138'} data-tip="airflow" />
            <rect x="190" y="52" width={Math.min(115, 20 + state.brand.length * 6)} height="16" rx="4" fill="#0a7f6b" /><text x="196" y="64" fill="white" fontSize="10" fontWeight="700">{state.brand}</text>
            <rect x="276" y="51" width="40" height="16" rx="3" fill="#111820" /><text x="296" y="62.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#f4f7fa">{state.acStatus === 'off' ? 'OFF' : `${state.temp}°`}</text><circle cx="320" cy="53" r="3" fill={state.acStatus === 'on' ? '#22c55e' : '#3b4350'} />
            {state.power && <g className="air-waves" stroke="#2b3138" strokeWidth="1.7" fill="none"><path d="M168 56q-7 9 0 18"/><path d="M160 50q-12 15 0 30"/><path d="M152 44q-17 22 0 44"/></g>}
          </g> : <g data-tip="ac" role="button" tabIndex="0" aria-label="Window air conditioner" className={state.noise > 35 && state.power ? 'room-ac-shake' : ''}>
            <g opacity={state.acStatus === 'off' ? 0.72 : 1}>
              <rect x="26" y="108" width="110" height="56" rx="8" fill="#f3f1ec" stroke="#c9c4b8" strokeWidth="2" /><rect x="30" y="122" width="102" height="12" rx="6" fill="#2b3138" />
              <rect x="88" y="111" width="31" height="12" rx="2" fill="#111820" /><text x="103.5" y="120" textAnchor="middle" fontSize="7" fontWeight="700" fill="#f4f7fa">{state.acStatus === 'off' ? 'OFF' : `${state.temp}°`}</text>
              <path d="M34 112h44M34 116h44M84 112h4M84 116h4" stroke="#b8b3a6" />
            </g>
          </g>)}
          {state.reloc && <g className="coolcare-moving-boxes" aria-label="Packed boxes ready for AC installation">
            <rect x="178" y="184" width="48" height="43" rx="3" fill="#d9a44a" stroke="#936b2d" strokeWidth="2" />
            <path d="M202 185v42m-24-22h48m-24-21 9 9h-18z" fill="none" stroke="#936b2d" strokeWidth="2" />
            <rect x="231" y="199" width="58" height="39" rx="3" fill="#efc36c" stroke="#936b2d" strokeWidth="2" />
            <path d="M260 200v37m-29-18h58m-29-19 9 9h-18z" fill="none" stroke="#936b2d" strokeWidth="2" />
            <rect x="294" y="211" width="38" height="30" rx="3" fill="#c98d3d" stroke="#936b2d" strokeWidth="2" />
            <path d="M313 212v28m-19-14h38" fill="none" stroke="#936b2d" strokeWidth="2" />
          </g>}
          {warm && <rect width="360" height="300" fill="#ff9a1f" opacity=".13" pointerEvents="none" className="room-heat-wash" />}
          {cold && snowflakes.map((flake) => <circle key={flake.id} className="coolcare-snowflake" cx={flake.x} cy={flake.y} r={flake.radius} fill="#fff" stroke="#9fd3f5" strokeWidth=".7" style={{ animationDelay: flake.delay, animationDuration: flake.duration }} />)}
          {state.dust > 0 && dustParticles.slice(0, dustVisible).map((particle) => <circle key={particle.id} className="coolcare-dust-particle" cx={particle.x} cy={particle.y} r={particle.radius} fill="#6b5a45" opacity=".75" style={{ animationDelay: particle.delay }} />)}
          {showDrops && <g className="coolcare-drops" transform={`translate(${dripPoint.x} ${dripPoint.y})`}><ellipse cx="0" cy="0" rx="2.2" ry="3.5" fill="#4aa3ff"/><ellipse cx="0" cy="0" rx="2.2" ry="3.5" fill="#4aa3ff" style={{ animationDelay: '-.35s' }}/><ellipse cx="0" cy="0" rx="2.2" ry="3.5" fill="#4aa3ff" style={{ animationDelay: '-.7s' }}/></g>}
          {showPuddle && <g clipPath="url(#floorClip)"><ellipse cx="200" cy="272" rx={Math.min(150, 28 + state.water * 24)} ry={Math.min(38, 6 + state.water * 5)} fill="url(#waterFill)" /><ellipse className="coolcare-ripple" cx="200" cy="270" rx="34" ry="7" /></g>}
        </svg>
        {labels.length > 0 && <div className="coolcare-room-tags" aria-label="Detected conditions">{labels.map((label) => <span key={label.key}>{label.text}</span>)}</div>}
      </div>
      <Tooltip message={tip || translate('readTip', state.lang)} />
    </figure>
  );
}
