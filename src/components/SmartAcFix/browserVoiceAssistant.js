/**
 * Browser-native Vaayu Voice Assistant.
 * Uses Web Speech API (SpeechRecognition & SpeechSynthesis).
 * Aligned with the updated technician-inspection flow:
 * 1. Warm initial greeting inviting any language.
 * 2. Multi-turn inspection (does not prematurely blurt prices).
 * 3. Builds suspense, triggers the inspection animation, and reveals the recommendation card.
 */

const CATALOG = {
  foam_jet_1: { title: 'Foam-Jet AC Service (1 AC)', price: 599, why: 'Deep coil and vent clean with free Co-Pilot gas check.', action: 'See my diagnosis' },
  foam_jet_2: { title: 'Foam-Jet AC Service (2 ACs)', price: 1098, why: 'Save ₹100 with the 2-AC combo. Includes free gas check on both.', action: 'See my diagnosis' },
  no_cooling: { title: 'Less or No Cooling Inspection', price: 299, why: 'Verified pro diagnoses root cause before any repair begins.', action: 'See my diagnosis' },
  noise_smell: { title: 'Noise or Smell Inspection', price: 499, why: 'Checks motor, fan balance and indoor unit mounting.', action: 'See my diagnosis' },
  leakage: { title: 'Water Leakage Inspection', price: 599, why: 'Checks drain pipe, tray blockage and refrigerant condensation.', action: 'See my diagnosis' },
  gas_refill: { title: 'Gas Refill & Check-Up', price: 3000, why: 'Full leak fix and complete gas refill after your approval.', action: 'See my diagnosis' },
  install_split: { title: 'Split AC Installation', price: 1699, why: 'Standard installation with indoor/outdoor unit mounting and free gas check.', action: 'See my diagnosis' },
};

export function startBrowserVoiceSession({
  dispatch,
  setRecommendation,
  setLanguage,
  setInspecting,
  setInterfaceRevealed,
  onSpeaking,
  onStatus,
  onSttText,
  onTtsText,
}) {
  let active = true;
  let recognition = null;
  let isHoldingSpace = false;
  let currentTranscript = '';
  let turnCount = 0;
  let detectedIssue = 'foam_jet_1';
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function speak(text, lang = 'en-IN', onEnd) {
    if (!active || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.1;
    utterance.pitch = 1.0;

    onTtsText?.(text);

    utterance.onstart = () => onSpeaking(true);
    utterance.onend = () => {
      onSpeaking(false);
      onTtsText?.('');
      onEnd?.();
    };
    utterance.onerror = () => {
      onSpeaking(false);
      onTtsText?.('');
      onEnd?.();
    };
    window.speechSynthesis.speak(utterance);
  }

  function revealRecommendation(item, isHindi) {
    setInspecting?.(true);
    const suspenseLine = isHindi
      ? 'Hmm... ek minute rukiye, main poora check kar ke batata hoon.'
      : 'Hmm... give me a moment, let me put this together.';

    speak(suspenseLine, isHindi ? 'hi-IN' : 'en-IN', () => {
      setTimeout(() => {
        if (!active) return;
        setInspecting?.(false);
        setInterfaceRevealed?.(true);
        setRecommendation(item);
        const revealLine = isHindi
          ? 'Theek hai, mujhe lagta hai samasya mil gayi hai. Screen par diya button tap karein.'
          : 'Okay, I think I have found it. Tap the button on your screen to see what I found.';
        speak(revealLine, isHindi ? 'hi-IN' : 'en-IN');
      }, 1200);
    });
  }

  function handleUserUtterance(rawText) {
    const text = rawText.toLowerCase();
    turnCount++;

    // Script/language detection
    const isHindi = /(bhai|batao|aawaz|paani|garmi|thanda|chal|raha|nahin|karo|kaise|haan|ji|theek|seeti|khadkhad)/.test(text);
    if (isHindi) {
      setLanguage('hi');
    }

    // Safety rule: burning / sparks
    if (/(burn|smoke|spark|fire|shock|current|jalne)/.test(text)) {
      dispatch({ type: 'UPDATE_SCENE', payload: { environment: 'home', acStatus: 'off', issue: 'none', feel: 'ok' } });
      const reply = isHindi
        ? 'Kripya AC ko turant wall switch aur main switch se band kar dein aur haath na lagayein. Power issue inspection ke liye button tap karein.'
        : 'Please switch off the AC at the wall and main switch immediately, and keep away. You should book a power issue inspection.';
      speak(reply, isHindi ? 'hi-IN' : 'en-IN', () => {
        setInterfaceRevealed?.(true);
        setRecommendation(CATALOG.no_cooling);
      });
      return;
    }

    // Classify / update scene
    if (/(hot|heat|warm|cooling|cool|pasi|garmi|thand)/.test(text)) {
      dispatch({ type: 'UPDATE_SCENE', payload: { environment: 'home', acStatus: 'on', issue: 'none', feel: 'hot' } });
      detectedIssue = /(warm|gas|ice|frost)/.test(text) ? 'no_cooling' : 'foam_jet_1';
    } else if (/(noise|sound|rattle|whistle|vibrat|smell|khadkhad|seeti|aawaz)/.test(text)) {
      dispatch({ type: 'UPDATE_SCENE', payload: { environment: 'home', acStatus: 'on', issue: 'noise', feel: 'ok' } });
      detectedIssue = 'noise_smell';
    } else if (/(leak|drip|water|drop|paani)/.test(text)) {
      dispatch({ type: 'UPDATE_SCENE', payload: { environment: 'home', acStatus: 'on', issue: 'none', feel: 'ok' } });
      detectedIssue = 'leakage';
    } else if (/(install|shift|mov|relocat)/.test(text)) {
      dispatch({ type: 'UPDATE_SCENE', payload: { environment: 'home', acStatus: 'hidden', issue: 'none', reloc: true, feel: 'ok' } });
      detectedIssue = 'install_split';
    }

    if (/(2|two|do ac|both)/.test(text)) {
      detectedIssue = 'foam_jet_2';
    }

    // Turn 1: Acknowledge & ask first inspection question
    if (turnCount === 1) {
      let q = isHindi
        ? 'Achha... aisi samasya sach mein pareshan karti hai. Yeh bataiye, kab se ho raha hai, aur hawa thandi aa rahi hai ya poori garam?'
        : 'Ah... that must be exhausting in this heat. Since when has it been like this, and is the air weak or blowing completely warm?';
      if (detectedIssue === 'noise_smell') {
        q = isHindi
          ? 'Oho... aawaz kaafi pareshan karti hai. Yeh bataiye, start karte hi aati hai ya poora time chalti rehti hai?'
          : 'Right... unusual noise can be quite annoying. Does it rattle all the time, or mostly when it first turns on?';
      } else if (detectedIssue === 'leakage') {
        q = isHindi
          ? 'Achha, paani room ke andar tapak raha hai ya bahar drain pipe se?'
          : 'Got it... water dripping can worry anyone. Is it dripping inside the room, or outside?';
      }
      speak(q, isHindi ? 'hi-IN' : 'en-IN');
      return;
    }

    // Turn 2: Narrow cause
    if (turnCount === 2) {
      const q = isHindi
        ? 'Hmm, samajh gaya... Pipe par koi baraf jamti dekhi hai, aur aapke paas ek AC hai ya zyada?'
        : 'Hmm, okay... so that is what is happening. Have you noticed any ice on the pipe, and how many ACs do you have?';
      speak(q, isHindi ? 'hi-IN' : 'en-IN');
      return;
    }

    // Turn 3+: Reveal with suspense animation
    revealRecommendation(CATALOG[detectedIssue] || CATALOG.foam_jet_1, isHindi);
  }

  function startListening() {
    if (!active || !SpeechRecognition || isHoldingSpace) return;
    isHoldingSpace = true;
    currentTranscript = '';
    onSttText?.('');
    onStatus?.('listening');

    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        if (active) onStatus?.('listening');
      };

      recognition.onresult = (event) => {
        let final = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }
        currentTranscript = final || interim;
        onSttText?.(currentTranscript);
      };

      recognition.onerror = () => {
        if (active) {
          isHoldingSpace = false;
          onStatus?.('idle');
          onSttText?.('');
        }
      };

      recognition.onend = () => {
        if (active && isHoldingSpace) {
          startListening();
        } else {
          isHoldingSpace = false;
          onStatus?.('idle');
        }
      };

      recognition.start();
    } catch {
      isHoldingSpace = false;
      onStatus?.('idle');
    }
  }

  function stopListening() {
    if (!active || !isHoldingSpace) return;
    isHoldingSpace = false;

    if (recognition) {
      try { recognition.stop(); } catch {}
      recognition = null;
    }

    setTimeout(() => {
      if (currentTranscript && currentTranscript.trim()) {
        handleUserUtterance(currentTranscript);
      }
      currentTranscript = '';
      onSttText?.('');
      onStatus?.('idle');
    }, 100);
  }

  function onKeyDown(event) {
    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault();
      startListening();
    }
  }

  function onKeyUp(event) {
    if (event.code === 'Space') {
      event.preventDefault();
      stopListening();
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Initial greeting from Vaayu (no auto-listen; user must hold space)
  const initialGreeting = 'Namaste and hello! I am Vaayu from Urban Company. Hold the space bar to speak.';
  speak(initialGreeting, 'en-IN', () => {
    if (active) {
      onStatus?.('idle');
    }
  });

  return () => {
    active = false;
    isHoldingSpace = false;
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (recognition) {
      try { recognition.abort(); } catch {}
    }
    setInspecting?.(false);
    onSpeaking(false);
    onSttText?.('');
    onTtsText?.('');
  };
}
