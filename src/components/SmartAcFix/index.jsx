import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { SmartAcProvider, useSmartAc } from './context/SmartAcContext.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import RoomVisualizer from './components/RoomVisualizer.jsx';
import ServiceCard from './components/ServiceCard.jsx';
import RecommendationCard from './RecommendationCard.js';
import { registerVaayuRpcMethods } from './livekitRpc.js';
import { requestLiveKitToken } from './livekitClient.js';
import { getRecommendedService } from './data/services.js';
import { LANGUAGES, translate } from './data/translations.js';
import { startBrowserVoiceSession } from './browserVoiceAssistant.js';
import './styles/animations.css';

const VOICE_LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'Hindi', short: 'HI' },
  { code: 'te', label: 'Telugu', short: 'TE' },
  { code: 'ta', label: 'Tamil', short: 'TA' },
  { code: 'ml', label: 'Malayalam', short: 'ML' },
  { code: 'kn', label: 'Kannada', short: 'KN' },
];

function SmartAcCanvas({ onBack, embedded, voiceOnly, onSelectService, onSuggest }) {
  const { state, dispatch, applyAiPayload } = useSmartAc();
  const recommendation = state.svc ? getRecommendedService(state) : null;
  const language = LANGUAGES[state.lang]?.code || 'en';
  const [voiceError, setVoiceError] = useState('');
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('disconnected');
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [voiceRecommendation, setVoiceRecommendation] = useState(null);
  const [inspecting, setInspecting] = useState(false);
  const [interfaceRevealed, setInterfaceRevealed] = useState(false);
  const [sttText, setSttText] = useState('');
  const [ttsText, setTtsText] = useState('');
  const roomRef = useRef(null);
  const browserSessionRef = useRef(null);
  const stateRef = useRef(state);
  const remoteAudioRef = useRef(null);
  const rpcCleanupRef = useRef(null);
  stateRef.current = state;

  const disconnectRoom = useCallback(async () => {
    browserSessionRef.current?.();
    browserSessionRef.current = null;
    const room = roomRef.current;
    roomRef.current = null;
    rpcCleanupRef.current?.();
    rpcCleanupRef.current = null;
    remoteAudioRef.current?.querySelectorAll('audio').forEach((audio) => audio.remove());
    setAssistantSpeaking(false);
    setInspecting(false);
    setInterfaceRevealed(false);
    setVoiceStatus('disconnected');
    if (!room) return;
    try { await room.localParticipant.setMicrophoneEnabled(false); } catch { /* Already disconnected or permission revoked. */ }
    room.disconnect();
  }, []);

  useEffect(() => () => {
    browserSessionRef.current?.();
    browserSessionRef.current = null;
    rpcCleanupRef.current?.();
    roomRef.current?.disconnect();
    roomRef.current = null;
  }, []);

  const startVoiceSession = useCallback(async () => {
    if (roomRef.current || browserSessionRef.current || voiceBusy) return;
    setVoiceBusy(true);
    setVoiceError('');
    setVoiceStatus('connecting');
    try {
      const { token, url } = await requestLiveKitToken();
      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;
      rpcCleanupRef.current = registerVaayuRpcMethods(room.localParticipant, {
        dispatch,
        getState: () => stateRef.current,
        setRecommendation: setVoiceRecommendation,
        setLanguage: setActiveLanguage,
        setInspecting,
        setInterfaceRevealed,
      });
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind !== Track.Kind.Audio || !remoteAudioRef.current) return;
        const audio = track.attach();
        audio.autoplay = true;
        audio.muted = !speakerEnabled;
        remoteAudioRef.current.appendChild(audio);
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach().forEach((element) => element.remove()));
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setAssistantSpeaking(speakers.some((participant) => !participant.isLocal));
      });
      room.on(RoomEvent.Disconnected, () => {
        if (roomRef.current !== room) return;
        rpcCleanupRef.current?.();
        rpcCleanupRef.current = null;
        roomRef.current = null;
        setVoiceStatus('disconnected');
        setAssistantSpeaking(false);
      });
      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);
      setVoiceStatus('connected');
    } catch (livekitError) {
      console.warn('LiveKit connection not established, falling back to Browser Voice Assistant:', livekitError.message);
      try {
        browserSessionRef.current = startBrowserVoiceSession({
          dispatch,
          setRecommendation: setVoiceRecommendation,
          setLanguage: setActiveLanguage,
          setInspecting,
          setInterfaceRevealed,
          onSpeaking: setAssistantSpeaking,
          onStatus: (status) => {
            if (status === 'listening') setVoiceStatus('connected');
          },
          onSttText: setSttText,
          onTtsText: setTtsText,
        });
        setVoiceStatus('connected');
      } catch (browserError) {
        await disconnectRoom();
        setVoiceError('Could not start voice assistant: ' + (browserError.message || livekitError.message));
      }
    } finally {
      setVoiceBusy(false);
    }
  }, [dispatch, disconnectRoom, speakerEnabled, voiceBusy]);

  const toggleVoiceSession = () => {
    setVoiceError('');
    if (roomRef.current || browserSessionRef.current) void disconnectRoom();
    else void startVoiceSession();
  };

  const toggleSpeaker = () => {
    setSpeakerEnabled((enabled) => {
      const next = !enabled;
      remoteAudioRef.current?.querySelectorAll('audio').forEach((audio) => { audio.muted = !next; });
      return next;
    });
  };

  const cycleEnvironment = () => {
    const environments = ['home', 'office'];
    const nextIndex = (environments.indexOf(state.env) + 1) % environments.length;
    dispatch({ type: 'SET_ENV', value: environments[nextIndex] });
  };

  const environmentLabel = translate(state.env, state.lang);
  const statusLabel = state.acStatus === 'on' ? translate('power', state.lang) : state.acStatus === 'off' ? translate('powerIssue', state.lang) : 'AC hidden';
  const voiceStatusLabel = voiceBusy || voiceStatus === 'connecting'
    ? 'Connecting to Vaayu…'
    : voiceStatus === 'connected'
      ? assistantSpeaking ? 'Vaayu is speaking.' : 'Listening. Tell me what you notice.'
      : 'Tap the microphone to talk with Vaayu.';

  /* ---------- Minimal voice screen (before reveal_interface) ---------- */
  const showMinimalVoice = voiceOnly && voiceStatus !== 'disconnected' && !interfaceRevealed;

  return <section className={`smart-ac coolcare-app ${embedded ? 'coolcare-embedded' : ''} ${voiceOnly ? 'coolcare-voice-only' : ''}`} lang={language}>
    <header className="smart-ac-header coolcare-header">
      <div className="coolcare-header-leading">
        {!embedded ? <>
          <button className="smart-ac-back" type="button" onClick={onBack}>← Back</button>
          <button className="smart-ac-classic" type="button" onClick={() => applyAiPayload({ condition: 'heat', severity: 4 })} aria-label="Apply example AI heat payload">AI demo</button>
        </> : <span className="coolcare-header-space" aria-hidden="true" />}
      </div>
      <div className="coolcare-brand"><strong>CoolCare</strong><small>{translate('subtitle', state.lang)}</small></div>
      <div className="coolcare-header-actions">
        {!voiceOnly && <button className="coolcare-header-action" type="button" onClick={toggleSpeaker} aria-label={speakerEnabled ? 'Mute speaker' : 'Unmute speaker'} aria-pressed={speakerEnabled} title={speakerEnabled ? 'Mute speaker' : 'Unmute speaker'}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d={speakerEnabled ? 'M15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12' : 'M16 9l5 6m0-6-5 6'}/></svg>
        </button>}
        <button className="coolcare-header-action" type="button" onClick={toggleVoiceSession} disabled={voiceBusy || voiceStatus === 'connecting'} aria-label={voiceBusy || voiceStatus === 'connecting' ? 'Connecting to Vaayu' : roomRef.current || browserSessionRef.current ? 'Stop voice assistant' : 'Start voice assistant'} aria-pressed={voiceStatus === 'connected'} title={roomRef.current || browserSessionRef.current ? 'Stop Vaayu' : 'Talk to Vaayu'}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{roomRef.current || browserSessionRef.current ? <rect x="6" y="6" width="12" height="12" rx="2" /> : <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0m-7 7v3m-4 0h8"/></>}</svg>
        </button>
        {!voiceOnly && <button className="coolcare-header-action" type="button" onClick={cycleEnvironment} aria-label={`Change scene palette. Current scene: ${environmentLabel}`} title="Change scene palette">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.4-3.4 1.8 1.8 0 0 1 1.3-3.1H18a3 3 0 0 0 3-3c0-4.7-4-8.5-9-8.5Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/></svg>
        </button>}
      </div>
    </header>

    {/* ---- Minimal voice screen: pulsing circle + status + end call ---- */}
    {showMinimalVoice && <main className="coolcare-scroll coolcare-voice-minimal">
      <div className="coolcare-voice-orb-wrap">
        <span className={`coolcare-voice-orb ${assistantSpeaking ? 'is-speaking' : ''}`} />
      </div>
      <p className="coolcare-voice-status coolcare-voice-minimal-label" role="status" aria-live="polite">{voiceStatusLabel}</p>
      {(sttText || ttsText) && (
        <section className="coolcare-card coolcare-speech-display">
          {sttText && (
            <div className="coolcare-speech-line coolcare-stt">
              <span aria-hidden="true">🎤</span><strong>You said:</strong> {sttText}
            </div>
          )}
          {ttsText && (
            <div className="coolcare-speech-line coolcare-tts">
              <span aria-hidden="true">🔊</span><strong>Vaayu:</strong> {ttsText}
            </div>
          )}
          <p className="coolcare-speech-hint">Hold SPACE to speak · Release to send</p>
        </section>
      )}
      <button className="smart-ac-primary coolcare-voice-end" type="button" onClick={toggleVoiceSession}>End call</button>
      {voiceError && <p className="coolcare-voice-error" role="alert">{voiceError}</p>}
      <div ref={remoteAudioRef} className="coolcare-remote-audio" aria-hidden="true" />
    </main>}

    {/* ---- Full interface (after reveal_interface or non-voice mode) ---- */}
    {!showMinimalVoice && <>
      {voiceOnly && <p className="coolcare-voice-status" role="status" aria-live="polite">{voiceStatusLabel}</p>}
      {voiceError && <p className="coolcare-voice-error" role="alert">{voiceError}</p>}

      <main className={`coolcare-scroll ${voiceOnly && interfaceRevealed ? 'coolcare-revealed' : ''}`}>
        <RoomVisualizer />
        <div ref={remoteAudioRef} className="coolcare-remote-audio" aria-hidden="true" />
        {inspecting && <section className="coolcare-card coolcare-inspection" aria-live="polite">
          <div className="coolcare-inspection-pulse">
            <span className="coolcare-inspection-ring" />
            <span className="coolcare-inspection-icon">🔍</span>
          </div>
          <h2>Co-Pilot Diagnosing AC…</h2>
          <p>Analyzing symptoms with Urban Company rate card &amp; verifying scope.</p>
        </section>}
        <RecommendationCard recommendation={voiceRecommendation} onSelect={(recommendation) => (onSuggest ? onSuggest({ source: 'voice', recommendation, state: stateRef.current, transcript: sttText }) : onSelectService?.(recommendation))} hideDetails={voiceOnly} />
        {voiceOnly && interfaceRevealed && <div className="coolcare-card coolcare-language-card coolcare-revealed">
          <div className="coolcare-segmented" role="tablist" aria-label="Vaayu language">
            {VOICE_LANGUAGES.map((item) => <span key={item.code} role="tab" aria-selected={activeLanguage === item.code} className={activeLanguage === item.code ? 'is-active' : ''} title={item.label}>{item.short}</span>)}
          </div>
        </div>}
        <div className={`coolcare-summary ${voiceOnly && interfaceRevealed ? 'coolcare-revealed' : ''}`} aria-live="polite">
          <strong>{translate('serviceLocation', state.lang)}</strong>
          <span>{environmentLabel} · {state.brand} · {state.temp}°C · {statusLabel}{state.issue !== 'none' ? ` · ${state.issue}` : ''}</span>
        </div>
        {!voiceOnly && <div className="coolcare-diagnose-action">
          <button className="smart-ac-primary" type="button" onClick={() => (onSuggest ? onSuggest({ source: 'controls', state: stateRef.current }) : dispatch({ type: 'SET_SERVICE_VISIBLE', value: true }))}>{translate('diagnose', state.lang)} <span>→</span></button>
        </div>}
        {!voiceOnly && state.svc && <ServiceCard service={recommendation} />}
        {!voiceOnly && <ControlPanel />}
        {!voiceOnly && <section className="coolcare-card coolcare-payload">
          <strong>GenUI state bridge</strong>
          <p>Example payload: <code>{'{ "condition": "heat", "severity": 4 }'}</code></p>
          <button className="smart-ac-secondary" type="button" onClick={() => dispatch({ type: 'RESET' })}>Reset controls</button>
        </section>}
      </main>
    </>}
  </section>;
}

export default function SmartAcFix({ onBack, embedded = false, voiceOnly = false, onSelectService, onSuggest }) {
  return <SmartAcProvider><SmartAcCanvas onBack={onBack} embedded={embedded} voiceOnly={voiceOnly} onSelectService={onSelectService} onSuggest={onSuggest} /></SmartAcProvider>;
}
