let audioContext;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ||= new AudioContextClass();
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}

function tone(context, { frequency, endFrequency = frequency, start, duration, volume = 0.035, type = 'sine', delay = 0 }) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const begins = start + delay;
  const ends = begins + duration;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, begins);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), ends);
  gain.gain.setValueAtTime(0.0001, begins);
  gain.gain.exponentialRampToValueAtTime(volume, begins + Math.min(0.025, duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, ends);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(begins);
  oscillator.stop(ends + 0.01);
}

export function playConditionSound(condition, intensity = 1) {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime + 0.01;
  const level = Math.min(1, Math.max(0.25, Number(intensity) || 0.25));

  switch (condition) {
    case 'water':
      tone(context, { frequency: 1050, endFrequency: 560, start, duration: 0.14, volume: 0.055 });
      break;
    case 'sun':
      tone(context, { frequency: 660, start, duration: 0.19, volume: 0.025 });
      tone(context, { frequency: 880, start, delay: 0.075, duration: 0.22, volume: 0.018 });
      break;
    case 'hot':
      tone(context, { frequency: 290, endFrequency: 430, start, duration: 0.2, volume: 0.035, type: 'triangle' });
      break;
    case 'cold':
      tone(context, { frequency: 880, endFrequency: 620, start, duration: 0.23, volume: 0.026 });
      break;
    case 'noise':
      tone(context, { frequency: 72 + level * 28, endFrequency: 58 + level * 24, start, duration: 0.19, volume: 0.025 * level, type: 'sawtooth' });
      tone(context, { frequency: 150 + level * 80, endFrequency: 105 + level * 60, start, delay: 0.045, duration: 0.14, volume: 0.014 * level, type: 'square' });
      break;
    default:
      break;
  }
}
