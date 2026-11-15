import React, { useRef } from 'react';
import { useSmartAc } from '../context/SmartAcContext.jsx';
import { LANGUAGES, translate } from '../data/translations.js';
import { playConditionSound } from '../utils/conditionSounds.js';

function Slider({ name, min, max, step = 1, value, display, onChange }) {
  return <div className="coolcare-control-row">
    <label className="coolcare-control-label" htmlFor={`coolcare-${name}`}><span>{name}</span><strong>{display}</strong></label>
    <input id={`coolcare-${name}`} type="range" min={min} max={max} step={step} value={value} onChange={onChange} />
  </div>;
}

function Segmented({ label, value, options, onChange }) {
  return <fieldset className="coolcare-fieldset"><legend>{label}</legend><div className="coolcare-segmented">{options.map((option) => <button key={String(option.value)} className={value === option.value ? 'is-active' : ''} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div></fieldset>;
}

export default function ControlPanel() {
  const { state, dispatch } = useSmartAc();
  const lastSoundAt = useRef({});
  const tr = (key) => translate(key, state.lang);
  const slider = (key, rawValue) => {
    const value = Number(rawValue);
    dispatch({ type: 'SET_SLIDER', key, value });
    if ((key === 'water' || key === 'sun' || key === 'noise') && value > 0) {
      const now = Date.now();
      if (now - lastSoundAt.current[key] > 450) {
        playConditionSound(key, key === 'water' ? value / 5 : value / 100);
        lastSoundAt.current[key] = now;
      }
    }
  };
  const setFeel = (value) => {
    dispatch({ type: 'SET_FEEL', value });
    if (value === 'hot' || value === 'cold') playConditionSound(value);
  };
  const feelOptions = [
    { value: 'hot', label: tr('hot') },
    { value: 'ok', label: tr('fine') },
    { value: 'cold', label: tr('cold') },
  ];

  return <section className="coolcare-controls" aria-label="Room and air conditioner controls">
    <section className="coolcare-card coolcare-language-card">
      <div className="coolcare-segmented">{LANGUAGES.map((language, index) => <button key={language.code} type="button" className={state.lang === index ? 'is-active' : ''} aria-pressed={state.lang === index} onClick={() => dispatch({ type: 'SET_LANG', value: index })}>{language.name}</button>)}</div>
    </section>
    <section className="coolcare-card">
      <Segmented label={tr('serviceLocation')} value={state.env} options={[{ value: 'home', label: tr('home') }, { value: 'office', label: tr('office') }]} onChange={(value) => dispatch({ type: 'SET_ENV', value })} />
      <div className="coolcare-two-column">
        <Segmented label="AC type" value={state.type} options={[{ value: 'split', label: tr('split') }, { value: 'window', label: tr('window') }]} onChange={(value) => dispatch({ type: 'SET_TYPE', value })} />
        <label className="coolcare-select-label">{tr('brand')}<select value={state.brand} onChange={(event) => dispatch({ type: 'SET_BRAND', value: event.target.value })}>{['Voltas', 'LG', 'Samsung', 'Daikin', 'Blue Star', 'Godrej', 'Hitachi', 'Panasonic'].map((brand) => <option key={brand}>{brand}</option>)}</select></label>
      </div>
      <div className="coolcare-control-row">
        <div className="coolcare-control-label"><span>{tr('temperature')}</span><strong>{state.temp}°C</strong></div>
        <div className="coolcare-temperature"><button type="button" aria-label="Decrease AC temperature" onClick={() => dispatch({ type: 'SET_TEMP', value: state.temp - 1 })}>−</button><output>{state.temp}°C</output><button type="button" aria-label="Increase AC temperature" onClick={() => dispatch({ type: 'SET_TEMP', value: state.temp + 1 })}>+</button></div>
      </div>
      <Segmented label={tr('roomFeel')} value={state.feel} options={feelOptions} onChange={setFeel} />
    </section>
    <section className="coolcare-card">
      <Segmented label={tr('curtains')} value={state.open} options={[{ value: true, label: tr('open') }, { value: false, label: tr('closed') }]} onChange={(value) => dispatch({ type: 'SET_OPEN', value })} />
      <Slider name={tr('sun')} min={0} max={100} value={state.sun} display={`${state.sun}%`} onChange={(event) => slider('sun', event.target.value)} />
      <Slider name={tr('water')} min={0} max={5} step={0.1} value={state.water} display={`${state.water.toFixed(1)} / 5`} onChange={(event) => slider('water', event.target.value)} />
      <Slider name={tr('dust')} min={0} max={100} value={state.dust} display={`${state.dust}%`} onChange={(event) => slider('dust', event.target.value)} />
      <Slider name={tr('noise')} min={0} max={100} value={state.noise} display={`${state.noise}%`} onChange={(event) => slider('noise', event.target.value)} />
    </section>
    <section className="coolcare-card coolcare-switches">
      <button className={`coolcare-switch ${state.power ? 'is-on' : ''}`} type="button" aria-pressed={state.power} onClick={() => dispatch({ type: 'TOGGLE_POWER' })}><span>{tr('power')}</span><i aria-hidden="true" /></button>
      <button className={`coolcare-switch ${state.reloc ? 'is-on' : ''}`} type="button" aria-pressed={state.reloc} onClick={() => dispatch({ type: 'SET_RELOC', value: !state.reloc })}><span>{tr('relocation')}</span><i aria-hidden="true" /></button>
    </section>
    <p className="coolcare-demo-note">{tr('demoInfo')}</p>
  </section>;
}
