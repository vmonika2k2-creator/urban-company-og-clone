/*
 * The shared "understanding" step for all three Need-a-hand versions.
 *
 *   typed text  ─┐
 *   controls    ─┼─►  buildAnalysis()  ─►  signs the user has confirmed  ─►  suggested services
 *   voice       ─┘
 *
 * Every version ends up with the same shape, so the Suggest a service screen
 * does not care how the problem was told.
 */

/* Signs (symptoms) the user can confirm. Each one points at one service. */
export const SYMPTOMS = {
  on:      { label: 'AC switches on',       icon: 'power',  services: ['cool'] },
  off:     { label: 'AC won’t switch on',   icon: 'power',  services: ['power'] },
  nonstop: { label: 'Runs non-stop',        icon: 'fan',    services: ['cool'] },
  warm:    { label: 'Room not cooling',     icon: 'snow',   services: ['cool'] },
  weak:    { label: 'Cooling very weak',    icon: 'thermo', services: ['gas'] },
  ice:     { label: 'Ice on pipes',         icon: 'ice',    services: ['gas'] },
  dust:    { label: 'Dust or weak airflow', icon: 'wind',   services: ['clean'] },
  noise:   { label: 'Rattle on start',      icon: 'sound',  services: ['noise'] },
  smell:   { label: 'Musty smell',          icon: 'smell',  services: ['noise'] },
  leak:    { label: 'Water dripping',       icon: 'drop',   services: ['leak'] },
  error:   { label: 'Error code shown',     icon: 'alert',  services: ['cool'] },
};

/*
 * Services shown on the Suggest a service screen. `serviceId` is the id in the
 * catalogue (src/data/services.js), so what is ticked here is exactly what lands
 * in the cart, at the same price.
 */
export const SERVICES = {
  cool:  { id: 'cool',  serviceId: 'ac.repair-cooling', name: 'Less/No Cooling repair', short: 'Less/No Cooling', price: 299,  reviews: '505K', note: 'Checks gas, airflow and compressor, then finds the cause.' },
  power: { id: 'power', serviceId: 'ac.repair-power',   name: 'Power issue repair',     short: 'Power issue',     price: 299,  reviews: '145K', note: 'Only if the AC does not switch on or shuts off by itself.' },
  clean: { id: 'clean', serviceId: 'ac.service',        name: 'Foam-jet AC service',    short: 'Foam-jet service', price: 599, reviews: '883K', note: 'Only if dust or weak airflow is the problem. Includes a free gas check.' },
  noise: { id: 'noise', serviceId: 'ac.repair-noise',   name: 'Unwanted Noise/Smell',   short: 'Noise/Smell',     price: 499,  reviews: '43K',  note: 'Only if you hear odd sounds or notice a smell.' },
  leak:  { id: 'leak',  serviceId: 'ac.repair-leak',    name: 'Water Leakage',          short: 'Water Leakage',   price: 599,  reviews: '190K', note: 'Only if water drips from the indoor unit.' },
  gas:   { id: 'gas',   serviceId: 'ac.gas-refill',     name: 'Gas Check-up & Refill',  short: 'Gas check',       price: 3000, reviews: '111K', note: 'Only when gas signs are confirmed. The technician checks first, and you approve before any refill.' },
};

/* When two services score the same, the one earlier in this list wins. */
export const PRIORITY = ['cool', 'power', 'gas', 'clean', 'noise', 'leak'];

/* Which story (Why we suggest this) goes with the main service. */
export const SCENARIO_FOR = { cool: 'cooling', power: 'power', gas: 'gas', clean: 'clean', noise: 'noise', leak: 'leak' };

/* Questions that stay open until the technician visits. */
export const OPEN_QUESTIONS = {
  cooling: ['noise', 'leak', 'error'],
  power:   ['error', 'noise'],
  gas:     ['noise', 'error'],
  clean:   ['smell', 'leak'],
  noise:   ['leak', 'error'],
  leak:    ['noise', 'error'],
};

/* ---------- ranking ---------- */

export function rankServices(confirmedIds) {
  const score = { cool: 0, power: 0, gas: 0, clean: 0, noise: 0, leak: 0 };
  confirmedIds.forEach((id) => (SYMPTOMS[id]?.services || []).forEach((s) => { score[s] += 1; }));
  const ranked = PRIORITY.filter((k) => score[k] > 0)
    .sort((a, b) => score[b] - score[a] || PRIORITY.indexOf(a) - PRIORITY.indexOf(b));
  return { score, ranked, primary: ranked[0] || 'cool' };
}

/* ---------- 1. typed text (and anything the voice assistant said) ---------- */

export function symptomsFromText(raw) {
  const t = ` ${String(raw || '').toLowerCase()} `;
  const found = new Set();
  const mentionsGas = /\bgas\b|refrigerant|refill|top.?up/.test(t);

  const off = /(won'?t|will not|doesn'?t|does not|can'?t|cannot|not)\s+(turn|switch|start|power|come)\s*(on|up)?|no power|power (issue|cut|problem|failure)|completely dead|\bdead\b/.test(t);
  const warm = /\bwarm\b|\bhot\b|\bheat|not cool|no cool|isn'?t cool|doesn'?t cool|less cool|weak cool|poor cool|cooling (is |has )?(weak|low|poor|bad|dropped|less|stopped)|not cold|no cold/.test(t);

  if (off) found.add('off');
  if (warm) found.add('warm');
  if (warm && /running|is on|turns? on|switch(es)? on|working|blowing|blows/.test(t)) found.add('on');
  if (/non.?stop|never (stops|switches off|turns off|shuts)|runs? (all the time|continuously)|keeps? running/.test(t)) found.add('nonstop');
  if (mentionsGas) found.add('weak');
  if (/\bice\b|frost|frozen/.test(t)) found.add('ice');
  if (/dust|dirty|filter|clean|air ?flow|foam/.test(t)) found.add('dust');
  if (/nois|sound|rattl|vibrat|buzz|click|shak|grind|\bhum\b/.test(t)) found.add('noise');
  if (/smell|odou?r|musty|stink/.test(t)) found.add('smell');
  if (/water|drip|puddle/.test(t) || (/leak/.test(t) && !mentionsGas)) found.add('leak');
  if (/error|blink|flash|\b[ef]\d{1,2}\b/.test(t)) found.add('error');

  return {
    confirmed: [...found],
    relocation: /install|relocat|shift(ing)? (my |the )?ac|move (my |the )?ac/.test(t),
    acType: /window/.test(t) ? 'Window AC' : /split/.test(t) ? 'Split AC' : '',
  };
}

/* ---------- 2. controls (the room explorer) ---------- */

export function symptomsFromControls(state = {}) {
  const found = new Set();
  const off = state.power === false || state.acStatus === 'off';
  if (off) found.add('off');
  if (!off && state.feel === 'hot') { found.add('warm'); found.add('on'); }
  if (!off && state.feel === 'cold') found.add('nonstop');
  if (Number(state.dust) >= 40) found.add('dust');
  if (Number(state.noise) >= 40) found.add('noise');
  if (Number(state.water) >= 0.5) found.add('leak');
  return {
    confirmed: [...found],
    relocation: Boolean(state.reloc) || state.acStatus === 'hidden',
    acType: state.type === 'window' ? 'Window AC' : state.type === 'split' ? 'Split AC' : '',
  };
}

const joinList = (parts) => (parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`);

/* A short sentence about what the controls say, used as "what the user told us". */
export function describeControls(state = {}) {
  const off = state.power === false || state.acStatus === 'off';
  const parts = [off ? 'my AC is off' : 'my AC is on'];
  if (!off && state.feel === 'hot') parts.push('the room feels hot');
  if (!off && state.feel === 'cold') parts.push('the room feels too cold');
  if (Number(state.dust) >= 40) parts.push('there is dust around the vents');
  if (Number(state.noise) >= 40) parts.push('it is making noise');
  if (Number(state.water) >= 0.5) parts.push('water is dripping');
  const sentence = joinList(parts);
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}

/* ---------- 3. the one entry point ---------- */

const unique = (list) => [...new Set(list)];

/**
 * input:
 *   { source: 'text',     text, brand }
 *   { source: 'controls', state }
 *   { source: 'voice',    recommendation, state, transcript }
 */
export function buildAnalysis(input = {}) {
  const source = input.source === 'controls' || input.source === 'voice' ? input.source : 'text';
  let confirmed = [];
  let relocation = false;
  let acType = '';
  let quote = '';
  let brand = '';

  if (source === 'text') {
    const found = symptomsFromText(input.text);
    ({ confirmed, relocation, acType } = found);
    quote = String(input.text || '').trim();
    brand = String(input.brand || '').trim();
  } else if (source === 'controls') {
    const found = symptomsFromControls(input.state);
    ({ confirmed, relocation, acType } = found);
    quote = describeControls(input.state);
    brand = input.state?.brand || '';
  } else {
    /* Voice: what Vaayu set on the scene, what was said, and the title it recommended. */
    const fromScene = symptomsFromControls(input.state);
    const fromWords = symptomsFromText(`${input.transcript || ''} ${input.recommendation?.title || ''}`);
    confirmed = unique([...fromScene.confirmed, ...fromWords.confirmed]);
    /* A scene with the AC "off" and a different spoken problem: trust the words. */
    if (fromWords.confirmed.length && !fromWords.confirmed.includes('off')) confirmed = confirmed.filter((id) => id !== 'off');
    relocation = fromWords.relocation || fromScene.relocation;
    acType = fromWords.acType || fromScene.acType;
    const spoken = String(input.transcript || '').trim();
    quote = spoken || (confirmed.length ? describeControls(input.state) : String(input.recommendation?.title || '').trim());
    brand = input.state?.brand || '';
  }

  const { ranked, primary } = rankServices(confirmed);
  return {
    source,
    confirmed,
    quote,
    brand,
    acType,
    relocation,
    ranked,
    primary,
    scenario: SCENARIO_FOR[primary],
    /* Nothing recognised: the page starts from a plain diagnosis visit. */
    fallback: confirmed.length === 0,
  };
}
