import React, { useEffect, useReducer, useRef } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { requestLiveKitToken } from './SmartAcFix/livekitClient.js';

const initialState = { phase: 'profiler', problem: '', brand: '', result: null, voice: { phase: 'idle' } };

function reducer(state, action) {
  switch (action.type) {
    case 'CHANGE': return { ...state, [action.field]: action.value };
    case 'ANALYZE': return { ...state, phase: 'loading' };
    case 'RESULT': return { ...state, phase: 'adaptive', result: action.result };
    case 'BOOK': return { ...state, phase: 'booked' };
    case 'VOICE_REQUEST': return { ...state, voice: { phase: 'requesting' } };
    case 'VOICE_CONNECTED': return { ...state, voice: { phase: 'connected' } };
    case 'VOICE_SPEAKING': return { ...state, voice: { phase: action.value ? 'speaking' : 'connected' } };
    case 'VOICE_ERROR': return { ...state, voice: { phase: 'error', message: action.message } };
    case 'VOICE_RESET': return { ...state, voice: { phase: 'idle' } };
    case 'RESET': return { ...initialState };
    default: return state;
  }
}

function diagnose(problem) {
  const text = problem.toLowerCase();
  if (['warm', 'hot', 'heat'].some((word) => text.includes(word))) return {
    condition: 'heat', title: 'Your AC may be overheating',
    why: 'Warm air can point to a cooling or airflow issue. A technician can check the system and confirm the cause before recommending a repair.',
    service: 'AC inspection and repair', price: 'Price confirmed after inspection',
  };
  if (['sound', 'shake', 'noise', 'rattle'].some((word) => text.includes(word))) return {
    condition: 'vibration', title: 'Your AC may need a sound check',
    why: 'Unusual sounds or shaking can come from loose parts or a fan issue. An inspection can identify the cause and help prevent further damage.',
    service: 'AC inspection and repair', price: 'Price confirmed after inspection',
  };
  return {
    condition: 'dust', title: 'Your AC may need a cleaning',
    why: 'Weak airflow or dust can mean the filters need attention. A technician can inspect and clean the unit as needed.',
    service: 'AC foam-jet service', price: 'From ₹549 per AC',
  };
}

export default function GenerativeACService({ onClassic, onSuggest, compact = false, hideHeader = false, classicLabel = 'Classic services' }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const roomRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (state.phase !== 'loading') return undefined;
    const timer = window.setTimeout(() => dispatch({ type: 'RESULT', result: diagnose(state.problem) }), 1200);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.problem]);

  const change = (field) => (event) => dispatch({ type: 'CHANGE', field, value: event.target.value });
  const condition = state.result?.condition || '';
  const status = state.voice.phase === 'requesting' ? 'connecting' : ['connected', 'speaking'].includes(state.voice.phase) ? 'connected' : 'disconnected';
  const endVoiceSession = () => {
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
      room.disconnect();
    }
    if (remoteAudioRef.current) remoteAudioRef.current.replaceChildren();
    dispatch({ type: 'VOICE_RESET' });
  };

  useEffect(() => () => roomRef.current?.disconnect(), []);

  const startVoiceSession = async () => {
    if (status === 'connecting' || status === 'connected') return;
    dispatch({ type: 'VOICE_REQUEST' });
    try {
      const { token, url } = await requestLiveKitToken();
      const room = new Room();
      roomRef.current = room;
      room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          const audio = track.attach();
          audio.autoplay = true;
          audio.dataset.participant = participant.identity;
          remoteAudioRef.current?.appendChild(audio);
        }
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach().forEach((element) => element.remove()));
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => dispatch({ type: 'VOICE_SPEAKING', value: speakers.some((speaker) => !speaker.isLocal) }));
      room.on(RoomEvent.Disconnected, () => dispatch({ type: 'VOICE_RESET' }));
      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);
      dispatch({ type: 'VOICE_CONNECTED' });
    } catch (error) {
      roomRef.current?.disconnect();
      roomRef.current = null;
      dispatch({ type: 'VOICE_ERROR', message: error.message || 'Unable to start the voice assistant. Please try again.' });
    }
  };

  return (
    <section className={`smart-ac smart-ac-${condition} ${compact ? 'smart-ac-embedded' : ''}`}>
      {!hideHeader && <header className="smart-ac-header">
        {state.phase !== 'profiler' && <button className="smart-ac-back" type="button" onClick={() => dispatch({ type: 'RESET' })}>← Back</button>}
        <strong>Smart AC Fix</strong>
        <button className="smart-ac-classic" type="button" onClick={onClassic}>{classicLabel}</button>
      </header>}
      <div ref={remoteAudioRef} className="coolcare-remote-audio" aria-hidden="true" />
      {state.phase === 'profiler' && <div className="smart-ac-profiler">
        <span className="smart-ac-eyebrow">AC REPAIR · SMART DIAGNOSIS</span>
        <h1>What is your AC doing?</h1>
        <p>Describe the issue in your own words. We’ll suggest a useful next step.</p>
        <label className="smart-ac-label" htmlFor="smart-ac-problem">What have you noticed?</label>
        <textarea id="smart-ac-problem" value={state.problem} onChange={change('problem')} placeholder="For example, my AC is blowing warm air and making a rattling sound" />
        <label className="smart-ac-label" htmlFor="smart-ac-brand">AC brand <span>(optional)</span></label>
        <input id="smart-ac-brand" value={state.brand} onChange={change('brand')} placeholder="e.g. Voltas, LG" />
        <p className="smart-ac-note">This preview gives general suggestions, not a confirmed diagnosis or quote.</p>
        <div className="smart-ac-voice">
          <button className="smart-ac-secondary" type="button" disabled={state.voice.phase === 'requesting' || status === 'connecting'} onClick={status === 'connected' ? endVoiceSession : startVoiceSession}>
            {state.voice.phase === 'requesting' || status === 'connecting' ? 'Connecting…' : status === 'connected' ? 'End voice session' : 'Talk to the AC assistant'}
          </button>
          <p aria-live="polite">{status === 'connected' ? 'Connected. You can speak with the assistant now.' : 'Use your microphone for a voice conversation.'}</p>
          {state.voice.phase === 'error' && <p className="smart-ac-voice-error" role="alert">{state.voice.message || 'The voice assistant could not connect. Please try again.'}</p>}
        </div>
        <button className="smart-ac-primary" type="button" disabled={state.problem.trim().length < 3} onClick={() => (onSuggest ? onSuggest({ source: 'text', text: state.problem, brand: state.brand }) : dispatch({ type: 'ANALYZE' }))}>Get a suggestion <span>→</span></button>
      </div>}
      {state.phase === 'loading' && <div className="smart-ac-loading" role="status"><span className="smart-ac-spinner" /><h1>Looking at what you described</h1><p>We’re preparing a service suggestion.</p></div>}
      {state.phase === 'adaptive' && state.result && <div className="smart-ac-result">
        <span className="smart-ac-eyebrow">SUGGESTED NEXT STEP</span>
        <h1>{state.result.title}</h1>
        <div className="smart-ac-illustration" aria-label={`${condition} AC illustration`}>
          <span className="smart-ac-unit"><span className="smart-ac-unit-brand">{state.brand || 'AC'}</span><span className="smart-ac-display">{condition === 'heat' ? '32°' : '24°'}</span><span className="smart-ac-vent" /></span>
          <span className="smart-ac-condition-mark" aria-hidden="true">{condition === 'heat' ? '〰' : condition === 'dust' ? '✦' : '⌁'}</span>
        </div>
        <article className="smart-ac-why"><strong><span aria-hidden="true">ⓘ</span> Why this matters</strong><p>{state.result.why}</p></article>
        <article className="smart-ac-service"><span className="smart-ac-eyebrow">RECOMMENDED SERVICE</span><h2>{state.result.service}</h2><p>{state.result.price}</p><button className="smart-ac-primary" type="button" onClick={() => dispatch({ type: 'BOOK' })}>Continue to services <span>→</span></button></article>
        <button className="smart-ac-secondary" type="button" onClick={() => dispatch({ type: 'RESET' })}>Describe a different issue</button>
      </div>}
      {state.phase === 'booked' && <div className="smart-ac-booked"><span className="smart-ac-check">✓</span><span className="smart-ac-eyebrow">SUGGESTION SAVED</span><h1>Choose a service to continue</h1><p>Your service has not been booked yet. Review the available services and booking details next.</p><button className="smart-ac-primary" type="button" onClick={onClassic}>Browse AC services</button><button className="smart-ac-secondary" type="button" onClick={() => dispatch({ type: 'RESET' })}>Back to diagnosis</button></div>}
    </section>
  );
}
