/*
 * Suggest a service screen.
 *
 * A self-contained screen that lives inside a shadow root, so its styles (taken
 * as-is from the design reference) cannot clash with the rest of the app, and the
 * app's styles cannot reach in. React only mounts it and passes callbacks.
 *
 *   mountSuggestApp(shadowRoot, { analysis, onAddToCart, onChangeAnswers })
 *
 * `analysis` comes from analysis.js, so typed, controls and voice all look the same here.
 */
import css from './suggest.css?inline';
import { ICONS, ico, ILLOS } from './suggestAssets.js';
import { SYMPTOMS, SERVICES, PRIORITY, SCENARIO_FOR, OPEN_QUESTIONS, rankServices } from './analysis.js';

const SERVICE = SERVICES;
const INR = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* How each way of telling us the problem is named on the screen. */
const SOURCES = {
  text:     { pill: 'Typed by you',      label: 'You said', kicker: 'Your words',    icon: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>' },
  controls: { pill: 'Set with controls', label: 'You set',  kicker: 'Your settings', icon: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>' },
  voice:    { pill: 'Told by voice',     label: 'You said', kicker: 'Your words',    icon: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>' },
};

const HEADLINES = {
  cooling: 'Your AC runs, but the room stays warm',
  power:   'Your AC is not switching on',
  gas:     'Your AC may be low on gas',
  clean:   'Your AC needs a deep clean',
  noise:   'Your AC is making noise or smelling off',
  leak:    'Water is dripping from your AC',
};

function ensureFont () {
  if (document.getElementById('suggest-service-font')) return;
  const pre1 = document.createElement('link');
  pre1.rel = 'preconnect'; pre1.href = 'https://fonts.googleapis.com';
  const pre2 = document.createElement('link');
  pre2.rel = 'preconnect'; pre2.href = 'https://fonts.gstatic.com'; pre2.crossOrigin = '';
  const font = document.createElement('link');
  font.id = 'suggest-service-font'; font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
  document.head.append(pre1, pre2, font);
}

export function mountSuggestApp (root, config) {
  const { analysis } = config;
  const source = SOURCES[analysis.source] || SOURCES.text;

  ensureFont();
  root.replaceChildren();
  const style = document.createElement('style');
  style.textContent = css;
  const screen = document.createElement('main');
  screen.id = 'screen';
  screen.className = 'screen';
  root.append(style, screen);

  /* ============================================================
     STATE (seeded from the analysis)
     ============================================================ */
  const state = {
    scenario: analysis.scenario,
    step: 0,
    density: 1,
    hot: 1,
    units: 1,
    sel: { cool: false, power: false, gas: false, clean: false, noise: false, leak: false },
    addOpen: false,
    quote: analysis.quote || '',
    fallback: analysis.fallback,
    symptoms: {},
  };
  analysis.confirmed.forEach((id) => { if (SYMPTOMS[id]) state.symptoms[id] = 'confirmed'; });
  (OPEN_QUESTIONS[analysis.scenario] || []).forEach((id) => { if (!state.symptoms[id]) state.symptoms[id] = 'unknown'; });

  const kickerOf = (st, i) => (i === 0 ? source.kicker : st.kicker);
  const labelOf  = (st, k) => (k === 0 ? source.label : st.label);

  function computeSuggestion () {
    const confirmed = Object.keys(state.symptoms).filter((id) => state.symptoms[id] === 'confirmed');
    return rankServices(confirmed);
  }

  function syncSel () {
    const sug = computeSuggestion();
    const picks = sug.ranked.length ? sug.ranked : (state.fallback ? ['cool'] : []);
    const next = { cool: false, power: false, gas: false, clean: false, noise: false, leak: false };
    picks.forEach((k) => { next[k] = true; });
    state.sel = next;
    const scenario = SCENARIO_FOR[sug.primary];
    if (scenario !== state.scenario) state.hot = 1;
    state.scenario = scenario;
    state.step = Math.min(state.step, MODELS[state.scenario].steps.length - 1);
  }

  function symptomLists () {
    const map = state.symptoms;
    return {
      conf: Object.keys(map).filter((k) => map[k] === 'confirmed'),
      unk:  Object.keys(map).filter((k) => map[k] === 'unknown'),
      rest: Object.keys(SYMPTOMS).filter((k) => !map[k]),
    };
  }

  const TINTS = ['#F4F9DC', '#E6F1FB', '#FDECDC', '#FBE8EF'];
  const WAVE  = [12,20,32,16,38,24,14,30,42,22,12,28,36,18,32,40,16,26,34,14,24,30,16,12,22,36,20,28,40,18,26,32,16,20];
  const TONE  = { low:'#9FC6E8', ok:'#C8E64C', high:'#F0AFC5' };
  const DNAMES = ['Text heavy', 'Balanced', 'Visual heavy'];

  const MODELS = {
    cooling: {
      tab: 'Cooling',
      steps: [
        { label:'You said', kicker:'Your words', title:'What you told us',
          lead:'Every chip below is editable. Tap to confirm or unconfirm, and the suggestion follows.',
          visual:{ type:'wave' } },
        { label:'Likely spots', kicker:'Where it goes wrong', title:'Three places cooling is lost',
          lead:'Tap a bar. These are possibilities, not a diagnosis.',
          body:[
            '<b>Air first.</b> A clogged filter or a dusty coil stops cold air from reaching the room. Most common, and the cheapest to fix.',
            '<b>Gas second.</b> A slow leak drops pressure over months, so the AC runs longer for less cold.',
            '<b>Compressor third.</b> It pumps the gas. If it is weak, the unit sounds normal but never cools.'
          ],
          visual:{ type:'diagram', spots:[
            { short:'Airflow',    title:'Air can’t flow freely',  desc:'A clogged filter or dusty coil blocks cool air.', weight:46 },
            { short:'Gas',        title:'Gas level may be low',   desc:'A small leak weakens cooling over months.',       weight:31 },
            { short:'Compressor', title:'Compressor may be weak', desc:'It pumps the gas that makes the air cold.',       weight:23 }
          ]} },
        { label:'Checks', kicker:'At the visit', title:'What the technician checks',
          lead:'Five steps, in order. You hear the cause in plain words.',
          body:[
            'The visit starts with a temperature test at the vent, so we know how far off the cooling is.',
            'Then airflow — filter, coil and fan. Then gas pressure and the compressor.',
            'Only after that does anyone talk about a repair or a price. You hear the cause before you hear a number.'
          ],
          visual:{ type:'timeline', items:[
            { t:'Test the cooling',         d:'How cold the air really gets',   icon:'thermo' },
            { t:'Look at airflow',          d:'Filter, coil and fan',           icon:'wind'   },
            { t:'Check gas and compressor', d:'Signs of a leak or a weak pump', icon:'gauge'  },
            { t:'Find the root cause',      d:'Explained before any repair',    icon:'search' },
            { t:'Share the repair cost',    d:'You say yes first',              icon:'rupee'  }
          ]} },
        { label:'Cost', kicker:'Price', title:'What you pay, and when',
          lead:'One price at the door. Anything more needs your yes.',
          body:[
            '₹299 covers the visit and the diagnosis. If you go ahead with the repair, that amount is adjusted into the repair cost.',
            'Parts, gas or a bigger repair are quoted after the diagnosis. Nothing is added without your approval.'
          ],
          visual:{ type:'price', now:299, compact:['₹299 at visit','rest after diagnosis'],
            primary:  { k:'AT THE VISIT',   amount:'Starts at ₹299',           label:'Inspection and diagnosis', note:'Adjusted in your repair cost if you go ahead.' },
            secondary:{ k:'ONLY IF NEEDED', amount:'Confirmed after diagnosis', label:'Repair, parts or gas',     note:'You see the exact quote and approve it first.' }
          },
          note:'Repairs carry up to 30 days of warranty. Free spare-part cover applies only to parts bought from Urban Company. Terms apply.' }
      ]
    },

    gas: {
      tab: 'Gas',
      steps: [
        { label:'You said', kicker:'Your words', title:'What you told us',
          lead:'Every chip below is editable. Add or remove signs and the service changes with them.',
          visual:{ type:'wave' } },
        { label:'What we measure', kicker:'Pressure test', title:'One gauge reading splits two causes',
          lead:'Low pressure is not always “top up the gas”.',
          body:[
            'The technician attaches a gauge while the AC is running. The needle sits in one of three bands: low, normal or high.',
            'Low usually means a leak. High usually means too much gas or a blocked coil. Either way, the fix starts with the reading — not with a refill.'
          ],
          visual:{ type:'gauge', value:22, min:0, max:100, reading:'22', unit:'PSI',
            bands:[ { name:'Low', from:0, to:38, tone:'low' }, { name:'Normal', from:38, to:72, tone:'ok' }, { name:'High', from:72, to:100, tone:'high' } ],
            caption:'Below the normal band. We find the leak before refilling anything.' } },
        { label:'Checks', kicker:'At the visit', title:'What the technician checks',
          lead:'Four steps. No refill happens without your yes.',
          body:[
            'First the pressure reading, then a leak test on every joint with soap solution and a torch.',
            'Only then does anyone price a repair or a refill. Gas never goes in before the leak is found.'
          ],
          visual:{ type:'timeline', items:[
            { t:'Read the pressure',    d:'At the service port, running',       icon:'gauge'  },
            { t:'Leak test the joints', d:'Soap solution and a torch',          icon:'search' },
            { t:'Price the fix',        d:'Repair, or refill, or both',         icon:'rupee'  },
            { t:'Refill only on yes',   d:'You approve before any gas goes in', icon:'check'  }
          ]} },
        { label:'Cost', kicker:'Price', title:'What you pay, and when',
          lead:'The check-up is fixed. The refill is only if needed.',
          body:[
            '₹3,000 covers the pressure test, the leak fix and the top-up. It is a fixed price, not a starting price.',
            'If a spare part must be replaced, it is quoted separately and only after you approve it.'
          ],
          visual:{ type:'price', now:3000, compact:['₹3,000 check-up','parts only if needed'],
            primary:  { k:'AT THE VISIT',   amount:'₹3,000',                    label:'Gas check-up and refill', note:'Covers the pressure test, the leak fix and the top-up.' },
            secondary:{ k:'ONLY IF NEEDED', amount:'Confirmed after diagnosis', label:'Spare parts',    note:'You see the exact quote and approve it first.' }
          },
          note:'We never refill gas to fix weak cooling without finding the leak first.' }
      ]
    },

    noise: {
      tab: 'Noise',
      steps: [
        { label:'You said', kicker:'Your words', title:'What you told us',
          lead:'Two clues, two causes. Edit the chips and watch both the service and the estimate move.',
          visual:{ type:'wave' } },
        { label:'Likely spots', kicker:'Two clues', title:'A rattle and a smell are different fixes',
          lead:'Same visit. Two separate causes.',
          body:[
            '<b>Rattling</b> is mechanical: a loose fan blade or a panel that vibrates at start-up. Usually a ten-minute fix.',
            '<b>Musty smell</b> is biological: mould on the coil or standing water in the drain pan. That needs a deep clean, not a screwdriver.'
          ],
          visual:{ type:'compare',
            left:{ title:'Rattling',    points:['Loose fan blade','Panel vibration'] },
            right:{ title:'Musty smell',points:['Mould on the coil','Clogged drain pan'] },
            caption:'A deep clean fixes the smell. The rattle is usually a 10-minute fix.' } },
        { label:'Checks', kicker:'At the visit', title:'What the technician checks',
          lead:'Four steps, then one quote for both.',
          body:[
            'He listens at start-up to place the rattle, then opens the indoor unit to look for mould and standing water.',
            'The coil gets cleaned on the spot. Both problems land in a single quote, so you are not paying two call-out fees.'
          ],
          visual:{ type:'timeline', items:[
            { t:'Listen at start-up',   d:'Finds where the rattle comes from', icon:'sound'  },
            { t:'Open the indoor unit', d:'Look for mould and standing water', icon:'search' },
            { t:'Clean the coil',       d:'Removes the smell at the source',   icon:'wind'   },
            { t:'Price the fix',        d:'You approve before any work',       icon:'rupee'  }
          ]} },
        { label:'Cost', kicker:'Price', title:'What you pay, and when',
          lead:'One visit covers both problems.',
          body:[
            '₹499 covers the visit and the diagnosis of both issues.',
            'A deep clean or a replacement part is quoted after inspection, and only added once you say yes.'
          ],
          visual:{ type:'price', now:499, compact:['₹499 at visit','parts after diagnosis'],
            primary:  { k:'AT THE VISIT',   amount:'Starts at ₹499',            label:'Noise or smell service', note:'Adjusted in your repair cost if you go ahead.' },
            secondary:{ k:'ONLY IF NEEDED', amount:'Confirmed after diagnosis', label:'Parts or deep clean',    note:'You see the exact quote and approve it first.' }
          },
          note:'Repairs carry up to 30 days of warranty. Terms apply.' }
      ]
    },

    power: {
      tab: 'Power',
      steps: [
        { label:'You said', kicker:'Your words', title:'What you told us',
          lead:'Every chip below is editable. Add or remove signs and the service changes with them.',
          visual:{ type:'wave' } },
        { label:'Likely spots', kicker:'Where it goes wrong', title:'Three places power can stop',
          lead:'Tap a bar. These are possibilities, not a diagnosis.',
          body:[
            '<b>Supply first.</b> A tripped switch, a loose plug or a faulty socket is the most common reason an AC stays dead.',
            '<b>Remote second.</b> Flat batteries or a faulty receiver can look like an AC that will not start.',
            '<b>Control board third.</b> A failed part on the board can stop the unit even when power reaches it.'
          ],
          visual:{ type:'diagram', spots:[
            { short:'Supply', title:'Power may not reach the AC',        desc:'A tripped switch, loose plug or faulty socket.',   weight:44 },
            { short:'Remote', title:'The remote or display may be at fault', desc:'Flat batteries or a faulty receiver.',         weight:31 },
            { short:'Board',  title:'The control board may be faulty',   desc:'A failed part can stop the unit from starting.',   weight:25 }
          ]} },
        { label:'Checks', kicker:'At the visit', title:'What the technician checks',
          lead:'Four steps, in order. You hear the cause in plain words.',
          body:[
            'The visit starts at the plug and the switch, so we know the AC is getting power.',
            'Then the remote and display, then the control board. Only after that does anyone talk about a repair or a price.'
          ],
          visual:{ type:'timeline', items:[
            { t:'Check the power supply',      d:'Socket, plug and switch',   icon:'power' },
            { t:'Test the remote and display', d:'Batteries and receiver',    icon:'search' },
            { t:'Check the control board',     d:'Fuse and start-up parts',   icon:'gauge' },
            { t:'Share the repair cost',       d:'You say yes first',         icon:'rupee' }
          ]} },
        { label:'Cost', kicker:'Price', title:'What you pay, and when',
          lead:'One price at the door. Anything more needs your yes.',
          body:[
            '₹299 covers the visit and the diagnosis. If you go ahead with the repair, that amount is adjusted into the repair cost.',
            'Parts or a bigger repair are quoted after the diagnosis. Nothing is added without your approval.'
          ],
          visual:{ type:'price', now:299, compact:['₹299 at visit','rest after diagnosis'],
            primary:  { k:'AT THE VISIT',   amount:'Starts at ₹299',           label:'Inspection and diagnosis', note:'Adjusted in your repair cost if you go ahead.' },
            secondary:{ k:'ONLY IF NEEDED', amount:'Confirmed after diagnosis', label:'Repair or parts',          note:'You see the exact quote and approve it first.' }
          },
          note:'Repairs carry up to 30 days of warranty. Free spare-part cover applies only to parts bought from Urban Company. Terms apply.' }
      ]
    },

    leak: {
      tab: 'Leak',
      steps: [
        { label:'You said', kicker:'Your words', title:'What you told us',
          lead:'Every chip below is editable. Add or remove signs and the service changes with them.',
          visual:{ type:'wave' } },
        { label:'Likely spots', kicker:'Two usual causes', title:'Water drips for one of two reasons',
          lead:'Same visit. Two different fixes.',
          body:[
            '<b>A drain problem.</b> A clogged drain pipe or a dirty drain tray lets water spill from the indoor unit. Often a quick clear-out.',
            '<b>A cooling problem.</b> A frozen coil melts and drips, or low gas lets ice form. That needs a closer look.'
          ],
          visual:{ type:'compare', icons:['drop','ice'],
            left:{ title:'Drain problem',   points:['Clogged drain pipe','Dirty drain tray'] },
            right:{ title:'Cooling problem', points:['Frozen coil melting','Low gas level'] },
            caption:'A blocked drain is the usual cause, and it is often a quick fix.' } },
        { label:'Checks', kicker:'At the visit', title:'What the technician checks',
          lead:'Four steps, then one quote.',
          body:[
            'He follows the water back to where it starts: the drain line first, then the tray under the coil.',
            'If the coil is iced up, he checks airflow and gas next. Only then does anyone price a fix.'
          ],
          visual:{ type:'timeline', items:[
            { t:'Look at the drain line', d:'Pipe and outlet',                icon:'drop' },
            { t:'Check the drain tray',   d:'Blockage and standing water',    icon:'search' },
            { t:'Look at the coil',       d:'Ice or frost build-up',          icon:'ice' },
            { t:'Price the fix',          d:'You approve before any work',    icon:'rupee' }
          ]} },
        { label:'Cost', kicker:'Price', title:'What you pay, and when',
          lead:'One price at the door. Anything more needs your yes.',
          body:[
            '₹599 covers the visit and the diagnosis of the leak.',
            'A part or a bigger repair is quoted after inspection, and only added once you say yes.'
          ],
          visual:{ type:'price', now:599, compact:['₹599 at visit','parts after diagnosis'],
            primary:  { k:'AT THE VISIT',   amount:'Starts at ₹599',           label:'Water leakage inspection', note:'Adjusted in your repair cost if you go ahead.' },
            secondary:{ k:'ONLY IF NEEDED', amount:'Confirmed after diagnosis', label:'Parts or a bigger repair', note:'You see the exact quote and approve it first.' }
          },
          note:'Repairs carry up to 30 days of warranty. Terms apply.' }
      ]
    },

    clean: {
      tab: 'Clean',
      steps: [
        { label:'You said', kicker:'Your words', title:'What you told us',
          lead:'Every chip below is editable. Add or remove signs and the service changes with them.',
          visual:{ type:'wave' } },
        { label:'Likely spots', kicker:'Where dust builds up', title:'Three places dust slows the air',
          lead:'Tap a bar. These are possibilities, not a diagnosis.',
          body:[
            '<b>The filter first.</b> Dust clogs it and the air that reaches the room gets weak.',
            '<b>The coil second.</b> A dirty coil cannot take the heat out of the air.',
            '<b>The outdoor unit third.</b> Dust there makes the AC work harder for the same cooling.'
          ],
          visual:{ type:'diagram', spots:[
            { short:'Filter',  title:'The filter may be clogged',      desc:'Dust blocks the air that reaches the room.',        weight:46 },
            { short:'Coil',    title:'The coil may be dirty',          desc:'Dirt stops the coil from cooling the air.',         weight:34 },
            { short:'Outdoor', title:'The outdoor unit may be dusty',  desc:'The AC works harder for the same cooling.',         weight:20 }
          ]} },
        { label:'Checks', kicker:'At the visit', title:'What the technician does',
          lead:'Four steps. A free gas check comes with it.',
          body:[
            'Pre-service checks first, then the indoor unit gets a foam and jet-spray deep clean.',
            'The outdoor unit is cleaned next, and the technician tidies up before leaving.'
          ],
          visual:{ type:'timeline', items:[
            { t:'Pre-service checks',      d:'Including a free gas check',   icon:'search' },
            { t:'Deep clean indoor unit',  d:'Foam and jet spray',           icon:'wind' },
            { t:'Clean the outdoor unit',  d:'Jet-spray cleaning',           icon:'wind' },
            { t:'Final clean-up',          d:'Spill protection and tidy-up', icon:'check' }
          ]} },
        { label:'Cost', kicker:'Price', title:'What you pay, and when',
          lead:'The cleaning price is clear before the visit.',
          body:[
            '₹599 covers the foam-jet cleaning of one AC, with a free gas check.',
            'A gas refill is only done if the check shows it is needed, and you approve the quote first.'
          ],
          visual:{ type:'price', now:599, compact:['₹599 per AC','refill only if needed'],
            primary:  { k:'AT THE VISIT',   amount:'Starts at ₹599',           label:'Foam-jet AC service',  note:'Includes a free gas check.' },
            secondary:{ k:'ONLY IF NEEDED', amount:'Confirmed after diagnosis', label:'Gas refill or parts', note:'You see the exact quote and approve it first.' }
          },
          note:'Gas refill, if required, is charged separately. Terms apply.' }
      ]
    }
  };

  /* ============================================================
     EDITABLE CHIPS
     ============================================================ */
  function chipsEditable (small) {
    const { conf, unk, rest } = symptomLists();
    const sm = small ? ' sm' : '';

    const confHTML = conf.map(id => `
      <button class="chipBtn${sm}" data-action="demote" data-id="${id}" title="Tap to move to ‘not known yet’">
        <span class="ic">${ico(SYMPTOMS[id].icon, 15)}</span>
        <span>${SYMPTOMS[id].label}</span>
        <span class="mk">${ico('x', 12, 2.6)}</span>
      </button>`).join('');

    const unkHTML = unk.map(id => `
      <button class="chipBtn unk${sm}" data-action="confirm" data-id="${id}" title="Tap to confirm this sign">
        <span class="ic">${ico(SYMPTOMS[id].icon, 15)}</span>
        <span>${SYMPTOMS[id].label}</span>
        <span class="mk">${ico('plus', 12, 2.6)}</span>
      </button>`).join('');

    const addHTML = rest.length ? `
      ${state.addOpen ? rest.map(id => `
        <button class="chipBtn ghost${sm}" data-action="add" data-id="${id}">
          <span class="ic">${ico(SYMPTOMS[id].icon, 15)}</span>
          <span>${SYMPTOMS[id].label}</span>
          <span class="mk">${ico('plus', 12, 2.6)}</span>
        </button>`).join('') : ''}
      <button class="chipBtn add${sm}" data-action="openAdd">
        <span class="ic">${ico(state.addOpen ? 'x' : 'plus', 14, 2.4)}</span>
        <span>${state.addOpen ? 'Close' : 'Add a sign'}</span>
      </button>` : '';

    return `<div class="chipGroup">
        <span class="chipLabel">${ico('check', 12, 2.4)} CONFIRMED BY YOU</span>
        <div class="chipsWrap">
          ${confHTML || '<span class="chipHint">Nothing confirmed yet.</span>'}
        </div>
      </div>
      ${unk.length ? `<div class="chipGroup">
        <span class="chipLabel">${ico('alert', 12, 2.2)} NOT KNOWN YET</span>
        <div class="chipsWrap">${unkHTML}</div>
      </div>` : ''}
      ${rest.length ? `<div class="chipsWrap">${addHTML}</div>` : ''}
      <span class="chipHint"><span class="dot"></span>
        Tap a green chip to unconfirm it, a dashed chip to confirm it. The suggestion, checklist and estimate all follow.</span>`;
  }

  function chipsStatic (st, small) {
    if (!st.confirmed && !st.unknown) return '';
    const sm = small ? ' sm' : '';
    const ok  = (st.confirmed || []).map(c => `<span class="chipBtn${sm}" style="cursor:default"><span class="ic">${ico('check',13,2.6)}</span><span>${c}</span></span>`).join('');
    const unk = (st.unknown || []).map(c => `<span class="chipBtn unk${sm}" style="cursor:default"><span>${c}</span></span>`).join('');
    return `<div class="chipGroup">
        <span class="chipLabel">CONFIRMED BY YOU</span>
        <div class="chipsWrap">${ok}</div>
      </div>
      <div class="chipGroup">
        <span class="chipLabel">NOT KNOWN YET</span>
        <div class="chipsWrap">${unk}</div>
      </div>`;
  }

  /* ============================================================
     VISUAL PRIMITIVES
     ============================================================ */
  function renderVisual (v, mode) {
    switch (v.type) {
      case 'wave':     return mode === 'hero' ? heroSymptoms() : waveHTML(v, mode);
      case 'diagram':  return mode === 'hero' ? heroSpots(v)   : diagramHTML(v, mode);
      case 'timeline': return mode === 'hero' ? heroJourney(v) : timelineHTML(v, mode);
      case 'price':    return mode === 'hero' ? heroPrice(v)   : priceHTML(v, mode);
      case 'gauge':    return gaugeHTML(v, mode);
      case 'compare':  return mode === 'hero' ? heroCompare(v) : compareHTML(v, mode);
      default: return '';
    }
  }

  function waveHTML (v, mode) {
    const h = mode === 'full' ? 64 : 26;
    const w = mode === 'compact' ? 3 : 4;
    const bars = WAVE.map(x =>
      `<span style="height:${Math.max(3, Math.round(x * h / 64))}px;width:${w}px"></span>`).join('');
    if (mode === 'compact') return `<div class="vCompact"><div class="waveRow" style="height:${h}px">${bars}</div></div>`;
    return `<div class="vPanel">
      <div class="waveRow" style="height:${h}px">${bars}</div>
      <p class="quote">“${esc(state.quote)}”</p>
    </div>`;
  }

  function heroSymptoms () {
    const { conf, unk } = symptomLists();
    const total = conf.length + unk.length;
    const frac = total ? conf.length / total : 0;
    const R = 58, C = 2 * Math.PI * R;

    const tiles = [...conf, ...unk].map(id => {
      const isConf = conf.includes(id);
      return `<div class="iconTile ${isConf ? 'conf' : 'unk'}">
        <span class="ib">${ico(SYMPTOMS[id].icon, 16)}</span>
        <span>${SYMPTOMS[id].label}</span>
      </div>`;
    }).join('') || `<div class="iconTile"><span>No signs yet</span></div>`;

    return `<div class="heroPanel">
      <svg viewBox="0 0 300 190" width="100%" role="img" aria-label="${conf.length} of ${total} signs confirmed">
        <circle cx="150" cy="95" r="${R}" fill="none" stroke="#EDEBE8" stroke-width="16"/>
        <circle cx="150" cy="95" r="${R}" fill="none" stroke="#C8E64C" stroke-width="16"
                stroke-linecap="round" transform="rotate(-90 150 95)"
                stroke-dasharray="${(C * frac).toFixed(1)} ${C.toFixed(1)}"/>
        <text x="150" y="90" text-anchor="middle" font-size="46" font-weight="600"
              fill="#1F1A1D" font-family="Poppins, sans-serif">${conf.length}</text>
        <text x="150" y="112" text-anchor="middle" font-size="10.5" font-weight="600"
              fill="#5F5A5E" letter-spacing="1.4" font-family="Poppins, sans-serif">CONFIRMED</text>
        <text x="150" y="130" text-anchor="middle" font-size="11" fill="#8B8288"
              font-family="Poppins, sans-serif">of ${total} signs</text>
      </svg>
      <div class="iconGrid">${tiles}</div>
    </div>`;
  }

  function diagramHTML (v, mode) {
    const a = state.hot;
    if (mode === 'compact') {
      return `<div class="vCompact">
        ${v.spots.map((sp, i) => `<button class="miniSpot${a === i + 1 ? ' on' : ''}"
          data-action="hot" data-n="${i + 1}"><i>${i + 1}</i>${sp.short}</button>`).join('')}
      </div>`;
    }
    const f = n => (a === n ? '#1F1A1D' : '#FFFFFF');
    const t = n => (a === n ? '#FFFFFF' : '#1F1A1D');
    const act = v.spots[a - 1] || v.spots[0];
    return `<div class="vPanel">
      <svg viewBox="0 0 318 190" width="100%" fill="none" stroke="#1F1A1D" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" role="img"
           aria-label="Split AC diagram with three numbered places where cooling can be lost">
        <rect x="6" y="14" width="190" height="64" rx="14" fill="#F4F9DC"/>
        <rect x="20" y="26" width="128" height="22" rx="6" fill="#FFFFFF" stroke-dasharray="4 4"/>
        <rect x="20" y="60" width="160" height="8" rx="4" fill="#E6F1FB"/>
        <circle cx="170" cy="36" r="3.5" fill="#B5D336" stroke="none"/>
        <path d="M40 92c0 6-4 6-4 12M80 92c0 6-4 6-4 12M120 92c0 6-4 6-4 12M160 92c0 6-4 6-4 12" stroke="#7FB2DE"/>
        <path d="M196 46H244V116" stroke="#B8A9B0" stroke-width="5"/>
        <rect x="196" y="116" width="116" height="66" rx="10" fill="#FFFFFF"/>
        <circle cx="254" cy="149" r="22" fill="#E6F1FB"/>
        <path d="M254 132v34M237 149h34M242 137l24 24M266 137l-24 24"/>
        <circle cx="40" cy="37" r="13" fill="${f(1)}"/>
        <text x="40" y="42" text-anchor="middle" font-size="13" font-weight="600" stroke="none" fill="${t(1)}">1</text>
        <circle cx="244" cy="80" r="13" fill="${f(2)}"/>
        <text x="244" y="85" text-anchor="middle" font-size="13" font-weight="600" stroke="none" fill="${t(2)}">2</text>
        <circle cx="294" cy="130" r="13" fill="${f(3)}"/>
        <text x="294" y="135" text-anchor="middle" font-size="13" font-weight="600" stroke="none" fill="${t(3)}">3</text>
      </svg>
      <div class="spotPills">
        ${v.spots.map((sp, i) => `<button class="pill${a === i + 1 ? ' on' : ''}"
          data-action="hot" data-n="${i + 1}">${i + 1} ${sp.short}</button>`).join('')}
      </div>
      <p class="cap"><b>${act.title}.</b> ${act.desc}</p>
    </div>`;
  }

  function heroSpots (v) {
    const total = v.spots.reduce((a, s) => a + (s.weight || 33), 0);
    const rows = v.spots.map((s, i) => {
      const pct = Math.round((s.weight || 33) / total * 100);
      const on = state.hot === i + 1;
      return `<button data-action="hot" data-n="${i + 1}"
        style="display:flex;flex-direction:column;gap:6px;text-align:left;background:transparent;border:0;padding:0;width:100%">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span style="display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600">
            <span style="width:20px;height:20px;border-radius:50%;background:${on ? '#1F1A1D' : '#F2F1EF'};
                         color:${on ? '#fff' : '#5F5A5E'};display:flex;align-items:center;justify-content:center;
                         font-size:10.5px;font-weight:600;flex:none">${i + 1}</span>
            ${s.title}
          </span>
          <span style="font-size:12.5px;font-weight:600;color:${on ? '#1F1A1D' : '#8B8288'}">${pct}%</span>
        </div>
        <div style="height:14px;border-radius:7px;background:#F0EEEB;overflow:hidden">
          <div style="width:${pct}%;height:100%;border-radius:7px;background:${on ? '#1F1A1D' : '#B9D94E'};
                      transition:width .35s ease,background .2s"></div>
        </div>
      </button>`;
    }).join('');
    return `<div class="heroPanel">
      ${rows}
      <p class="cap" style="font-size:11.5px">Illustrative likelihoods, not a diagnosis. Only an inspection confirms the cause.</p>
    </div>`;
  }

  function timelineHTML (v, mode) {
    if (mode === 'compact') {
      const dots = v.items.map((_, i) => {
        const last = i === v.items.length - 1;
        return `<span class="dot${last ? ' last' : ''}">${i + 1}</span>`
          + (last ? '' : '<span class="dashLine"></span>');
      }).join('');
      return `<div class="vCompact" style="padding:12px"><div class="dotRow">${dots}</div></div>`;
    }
    return `<div class="vPanel"><div class="tl">
      ${v.items.map((it, i) => {
        const last = i === v.items.length - 1;
        return `<div class="tlRow">
          <div class="tlMark">
            <span class="tlNum${last ? ' last' : ''}">${i + 1}</span>
            ${last ? '' : '<span class="tlLine"></span>'}
          </div>
          <div class="tlText"><b>${it.t}</b><span>${it.d}</span></div>
        </div>`;
      }).join('')}
    </div></div>`;
  }

  function heroJourney (v) {
    const n = v.items.length;
    return `<div class="heroPanel">
      ${v.items.map((it, i) => {
        const last = i === n - 1;
        return `<div style="display:flex;gap:12px;align-items:stretch">
          <div style="display:flex;flex-direction:column;align-items:center">
            <span style="width:42px;height:42px;border-radius:50%;flex:none;
                         background:${last ? '#C8E64C' : '#1F1A1D'};color:${last ? '#1F1A1D' : '#fff'};
                         display:flex;align-items:center;justify-content:center">
              ${ico(it.icon || 'search', 19)}
            </span>
            ${last ? '' : '<span style="width:2px;flex:1;min-height:16px;background:linear-gradient(#1F1A1D,#D9CDD2)"></span>'}
          </div>
          <div style="padding-bottom:${last ? 0 : 14}px;display:flex;flex-direction:column;gap:1px">
            <span style="font-size:9.5px;font-weight:600;letter-spacing:.08em;color:#8B8288">STEP ${i + 1}</span>
            <span style="font-size:13.5px;font-weight:600">${it.t}</span>
            <span style="font-size:11.5px;line-height:1.35;color:#5F5A5E">${it.d}</span>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function priceHTML (v, mode) {
    if (mode === 'compact') {
      return `<div class="vCompact">
        <span class="pMini"><b>${v.compact[0]}</b></span>
        <span class="pMini dim">· ${v.compact[1]}</span>
      </div>`;
    }
    return `<div class="vPanel">
      <div class="priceCard solid">
        <span class="k">${v.primary.k}</span>
        <span class="amt">${v.primary.amount}</span>
        <span class="pl">${v.primary.label}</span>
        <span class="pn">${v.primary.note}</span>
      </div>
      <div class="priceCard dashed">
        <span class="k">${v.secondary.k}</span>
        <span class="pamt">${v.secondary.amount}</span>
        <span class="pl">${v.secondary.label}</span>
        <span class="pn">${v.secondary.note}</span>
      </div>
    </div>`;
  }

  function heroPrice (v) {
    const now = v.now || 299;
    return `<div class="heroPanel">
      <div style="display:flex;gap:10px">
        <div style="flex:1.08;background:#1F1A1D;color:#fff;border-radius:16px;padding:13px;display:flex;flex-direction:column;gap:7px">
          <span style="width:26px;height:26px;color:#C8E64C">${ico('wrench', 20)}</span>
          <span style="font-size:27px;font-weight:600;line-height:1">₹${now}</span>
          <span style="font-size:9.5px;font-weight:600;letter-spacing:.08em;color:#CFC6CA">AT THE VISIT</span>
          <span style="font-size:11px;line-height:1.35;color:#CFC6CA">${v.primary.label}</span>
        </div>
        <div style="flex:1;border:2px dashed #8B8288;border-radius:16px;padding:13px;display:flex;flex-direction:column;gap:7px">
          <span style="width:26px;height:26px;color:#5F5A5E">${ico('clock', 20)}</span>
          <span style="font-size:27px;font-weight:600;line-height:1">?</span>
          <span style="font-size:9.5px;font-weight:600;letter-spacing:.08em;color:#5F5A5E">AFTER DIAGNOSIS</span>
          <span style="font-size:11px;line-height:1.35;color:#5F5A5E">${v.secondary.label} — quoted first</span>
        </div>
      </div>
      <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;background:#F2F1EF">
        <div style="width:32%;background:#1F1A1D"></div>
        <div style="flex:1;border:1.5px dashed #8B8288;border-left:0;border-radius:0 6px 6px 0"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#5F5A5E">
        <span>Paid today · ₹${now}</span><span>Decided later · unknown</span>
      </div>
    </div>`;
  }

  function gaugeHTML (v, mode) {
    const frac = Math.min(1, Math.max(0, (v.value - v.min) / (v.max - v.min)));
    const th = (180 - 180 * frac) * Math.PI / 180;
    const nx = 110 + 62 * Math.cos(th);
    const ny = 108 - 62 * Math.sin(th);
    const width = mode === 'compact' ? 168 : mode === 'hero' ? 290 : 236;

    const arcs = v.bands.map(b => `
      <path d="M34 108A76 76 0 0 1 186 108" pathLength="100" fill="none"
            stroke="${TONE[b.tone]}" stroke-width="16" stroke-linecap="butt"
            stroke-dasharray="${b.to - b.from} 100" stroke-dashoffset="${-b.from}"/>`).join('');
    const active = v.bands.find(b => v.value >= b.from && v.value <= b.to) || v.bands[0];

    const ticks = Array.from({ length: 11 }, (_, i) => {
      const ang = Math.PI - (i / 10) * Math.PI;
      const x1 = 110 + 84 * Math.cos(ang), y1 = 108 - 84 * Math.sin(ang);
      const x2 = 110 + 90 * Math.cos(ang), y2 = 108 - 90 * Math.sin(ang);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
                    stroke="#CFC7CC" stroke-width="1.6"/>`;
    }).join('');

    const svg = `<svg viewBox="0 0 220 130" width="100%" role="img"
        aria-label="Gas pressure gauge reading ${v.reading} ${v.unit}, below the normal band">
      ${mode === 'hero' ? ticks : ''}
      ${arcs}
      <text x="110" y="86" text-anchor="middle" font-size="30" font-weight="600" fill="#1F1A1D"
            font-family="Poppins, sans-serif">${v.reading}</text>
      <text x="110" y="102" text-anchor="middle" font-size="11" font-weight="500" fill="#5F5A5E"
            font-family="Poppins, sans-serif">${v.unit}</text>
      <line x1="110" y1="108" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#1F1A1D" stroke-width="4" stroke-linecap="round"/>
      <circle cx="110" cy="108" r="7" fill="#1F1A1D"/>
    </svg>`;

    if (mode === 'compact') return `<div class="vCompact"><div style="width:100%;max-width:${width}px">${svg}</div></div>`;

    return `<div class="vPanel">
      <div style="width:100%;max-width:${width}px;margin:0 auto">${svg}</div>
      <div class="bands">${v.bands.map(b =>
        `<span class="bandChip${b === active ? ' on' : ''}" style="--c:${TONE[b.tone]}">${b.name}</span>`).join('')}</div>
      ${v.caption ? `<p class="cap">${v.caption}</p>` : ''}
    </div>`;
  }

  function compareHTML (v, mode) {
    if (mode === 'compact') {
      return `<div class="vCompact" style="gap:6px">
        <span class="cmpChip">${v.left.title}</span><span class="cmpChip">${v.right.title}</span>
      </div>`;
    }
    return `<div class="vPanel">
      <div class="cmp">${[v.left, v.right].map(c => `
        <div class="cmpCol"><b>${c.title}</b><ul>${c.points.map(p => `<li>${p}</li>`).join('')}</ul></div>`).join('')}
      </div>
      ${v.caption ? `<p class="cap">${v.caption}</p>` : ''}
    </div>`;
  }

  function heroCompare (v) {
    const col = (c, icon) => `<div style="flex:1;background:#F7F9FB;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:9px">
      <span style="width:34px;height:34px;border-radius:50%;background:#fff;border:1.5px solid #EBDDE3;
                   display:flex;align-items:center;justify-content:center;color:#1F1A1D">${ico(icon, 18)}</span>
      <b style="font-size:13.5px">${c.title}</b>
      ${c.points.map((p, i) => `<div style="display:flex;align-items:center;gap:7px">
        <span style="flex:1;font-size:11px;line-height:1.3;color:#5F5A5E">${p}</span>
        <span style="width:${58 - i * 18}px;height:6px;border-radius:3px;flex:none;background:${i ? '#B9D94E' : '#1F1A1D'}"></span>
      </div>`).join('')}
    </div>`;
    return `<div class="heroPanel">
      <div style="display:flex;gap:10px">${col(v.left, (v.icons || ['sound', 'smell'])[0])}${col(v.right, (v.icons || ['sound', 'smell'])[1])}</div>
      <p class="cap" style="font-size:11.5px">${v.caption || ''}</p>
    </div>`;
  }

  /* ============================================================
     WHY PANEL
     ============================================================ */
  function stepOneBody () {
    const { conf, unk } = symptomLists();
    if (!conf.length) return [state.fallback
      ? 'We could not pick out a sign from what you told us, so we start with a plain diagnosis visit. Tap a sign below to be more specific.'
      : 'Nothing is confirmed yet. Tap a sign below and the service, checklist and estimate update straight away.'];
    const labels = conf.map(id => SYMPTOMS[id].label);
    const sug = computeSuggestion();
    const names = sug.ranked.map(k => SERVICE[k].short);
    return [
      `You confirmed ${conf.length} sign${conf.length > 1 ? 's' : ''}: <b>${labels.join(', ')}</b>.`,
      `That points at <b>${names.join(' + ')}</b>${unk.length ? `, while ${unk.length} open question${unk.length > 1 ? 's' : ''} wait for the visit` : ''}.`
    ];
  }

  function resonanceHTML () {
    const sug = computeSuggestion();
    const { conf } = symptomLists();
    if (!conf.length) return '';
    const ticks = sug.ranked.map(k =>
      `<span class="resTick">${SERVICE[k].short} · ₹${SERVICE[k].price}</span>`).join('');
    return `<div class="resonance">
      <span class="rIc">${ico('spark', 20)}</span>
      <div>
        <p>From these signs we suggest <b>${sug.ranked.map(k => SERVICE[k].short).join(' + ')}</b>. The checklist and estimate below are already set to match.</p>
        <div class="resTicks">${ticks}</div>
      </div>
    </div>`;
  }

  function headerHTML (st, n, i, withBody, body) {
    return `<div class="stepHead">
      <span class="kicker">STEP ${i + 1} OF ${n} · ${kickerOf(st, i).toUpperCase()}</span>
      <h3>${st.title}</h3>
      <p class="lead">${st.lead}</p>
      ${withBody ? `<div class="bodyCopy">${body.map(p => `<p>${p}</p>`).join('')}</div>` : ''}
    </div>`;
  }

  function whyPanelHTML () {
    const m = MODELS[state.scenario], n = m.steps.length;
    const i = Math.min(state.step, n - 1);
    const st = m.steps[i];
    const d = state.density;
    const first = i === 0;
    const body = first ? stepOneBody() : (st.body || []);

    if (d === 0) {
      return `<div class="stepPanel">
        ${headerHTML(st, n, i, true, body)}
        ${first ? chipsEditable(false) + resonanceHTML() : chipsStatic(st, false)}
        ${renderVisual(st.visual, 'compact')}
        ${st.note ? `<p class="foot">${st.note}</p>` : ''}
      </div>`;
    }

    if (d === 1) {
      return `<div class="stepPanel">
        ${headerHTML(st, n, i, false, body)}
        ${renderVisual(st.visual, 'full')}
        ${first ? chipsEditable(false) + resonanceHTML() : chipsStatic(st, false)}
        ${st.note ? `<p class="foot">${st.note}</p>` : ''}
      </div>`;
    }

    return `<div class="stepPanel">
      ${renderVisual(st.visual, 'hero')}
      <div class="stepHead">
        <span class="kicker">STEP ${i + 1} OF ${n} · ${kickerOf(st, i).toUpperCase()}</span>
        <h3>${st.title}</h3>
        <p class="lead" style="font-weight:500;color:#1F1A1D">${first
          ? 'The chart is live. Change a sign and it redraws.'
          : (st.visual.caption || st.lead)}</p>
      </div>
      ${first ? chipsEditable(true) + resonanceHTML() : chipsStatic(st, true)}
    </div>`;
  }

  function whyLabelsHTML () {
    const m = MODELS[state.scenario], n = m.steps.length, i = Math.min(state.step, n - 1);
    return m.steps.map((st, k) => {
      let pos;
      if (k === 0) pos = 'left:0';
      else if (k === n - 1) pos = 'right:0';
      else pos = `left:calc(15px + (100% - 30px) * ${(k / (n - 1)).toFixed(4)});transform:translateX(-50%)`;
      return `<button class="stepLabel${k === i ? ' on' : ''}" data-action="step" data-i="${k}" style="${pos}">${labelOf(st, k)}</button>`;
    }).join('');
  }

  function updateWhy () {
    const card = root.getElementById('whyCard');
    if (!card) return;
    const m = MODELS[state.scenario], n = m.steps.length, i = Math.min(state.step, n - 1);

    card.style.background = TINTS[i % TINTS.length];
    root.getElementById('whyFill').style.width = (n === 1 ? 100 : (i / (n - 1)) * 100) + '%';
    root.getElementById('whyLabels').innerHTML = whyLabelsHTML();
    root.getElementById('whyPanel').innerHTML = whyPanelHTML();

    const range = root.getElementById('stepRange');
    range.max = n - 1;
    range.value = i;
    range.setAttribute('aria-valuetext', m.steps[i].label);

    const dn = root.getElementById('densityName');
    if (dn) dn.textContent = DNAMES[state.density];
  }

  /* ============================================================
     REST OF SCREEN
     ============================================================ */
  const defs = () => PRIORITY.map(id => ({ id, ...SERVICE[id] }));
  const selectedDefs = () => defs().filter(d => state.sel[d.id]);

  function unitsHTML () {
    const u = state.units;
    const angles = [165, 127, 90, 53, 15];
    const tints = ['#EAF6C2', '#E3F0FB', '#F1F8D6', '#FDEBD6', '#FBE6EE'];

    const bubbles = angles.map((a, i) => {
      const r = a * Math.PI / 180;
      const x = 155 + 118 * Math.cos(r);
      const y = 165 - 118 * Math.sin(r);
      const on = u === i + 1;
      return `<button class="bubble" data-action="units" data-n="${i + 1}" aria-pressed="${on}"
        aria-label="${i + 1} AC${i ? 's' : ''}"
        style="left:${Math.round(x - 22)}px;top:${Math.round(y - 22)}px;background:${on ? '#C8E64C' : tints[i]}">${i + 1}</button>`;
    }).join('');

    const circ = 2 * Math.PI * 46;
    const dash = (circ * u / 5).toFixed(1) + ' ' + circ.toFixed(1);

    return `<div class="dial">
        ${bubbles}
        <div class="ringWrap">
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true">
            <circle cx="70" cy="70" r="66" fill="#F7F9FB" stroke="#C8E64C" stroke-width="4"/>
            <circle cx="70" cy="70" r="46" stroke="#ECECEE" stroke-width="12"/>
            <circle cx="70" cy="70" r="46" stroke="#B5D336" stroke-width="12" stroke-linecap="round"
                    transform="rotate(-90 70 70)" stroke-dasharray="${dash}"/>
          </svg>
          <div class="center">
            <span class="num">${u}</span>
            <span class="unit">${u === 1 ? 'AC UNIT' : 'AC UNITS'}</span>
          </div>
        </div>
      </div>
      <div class="stepper">
        <button class="round" data-action="minus" ${u <= 1 ? 'disabled' : ''} aria-label="Remove one AC"
          style="background:#F9EEF2;opacity:${u <= 1 ? .4 : 1}">−</button>
        <span class="count">${u} of 5 units</span>
        <button class="round" data-action="plus" ${u >= 5 ? 'disabled' : ''} aria-label="Add one AC"
          style="background:#C8E64C;opacity:${u >= 5 ? .4 : 1}">+</button>
      </div>`;
  }

  function checklistHTML () {
    const sug = computeSuggestion();
    return defs().map(d => {
      const on = !!state.sel[d.id];
      const isSuggested = sug.ranked.includes(d.id);
      return `<label class="item" style="border:2px solid ${on ? '#1F1A1D' : '#EBDDE3'};background:#fff">
        <input type="checkbox" data-check="${d.id}" ${on ? 'checked' : ''}>
        <span class="body">
          <span class="name">${d.name}</span>
          <span class="note">${d.note}</span>
          ${isSuggested ? '<span class="rec">Suggested from your signs</span>' : ''}
        </span>
        <span class="right">
          <span class="price">${INR(d.price)}</span>
          <span class="per">per AC</span>
        </span>
      </label>`;
    }).join('');
  }

  function totals () {
    const units = state.units;
    const picked = selectedDefs();
    const perUnit = picked.reduce((a, d) => a + d.price, 0);
    const total = perUnit * units;
    return { units, picked, perUnit, total };
  }

  function estimateHTML () {
    const { units, picked, total } = totals();
    const rows = picked.length
      ? picked.map(d => `<div class="row"><span>${d.name}${units > 1 ? ' × ' + units : ''}</span><b>${INR(d.price * units)}</b></div>`).join('')
      : `<div class="row"><span>Nothing selected yet</span><b>₹0</b></div>`;

    return `<div class="est">
      <span class="label">YOUR ESTIMATE · ${units} AC${units === 1 ? '' : 's'}</span>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${rows}
      </div>
      <div class="hr"></div>
      <div class="total"><span class="t">Starting total</span><span class="v">${INR(total)}</span></div>
      <div class="fine">
        <div><b>Included:</b> technician visit and diagnosis.</div>
        <div style="margin-top:6px"><b>Not confirmed yet:</b> repair parts or gas, if the technician finds they are needed. You approve any extra cost first.</div>
      </div>
    </div>`;
  }

  /* ---------- WHAT HAPPENS NEXT — illustrated ---------- */
  function nextStepsHTML () {
    const steps = [
      { n:'1', bg:'#FBE8EF', title:'You add this to your cart',     desc:'Pick a time and address next. Nothing is charged yet.', illo: ILLOS.approve },
      { n:'2', bg:'#FDECDC', title:'A technician visits and inspects', desc:'Trained, verified, on time.',      illo: ILLOS.tech    },
      { n:'3', bg:'#E6F1FB', title:'You get the cause and a quote', desc:'Plain words, exact price.',            illo: ILLOS.quote   },
      { n:'4', bg:'#C8E64C', title:'Repair starts only after you say yes', desc:'No work without your go-ahead.', illo: ILLOS.repair  }
    ];
    return `<div class="nextList">
      ${steps.map(s => `
        <div class="nextRow">
          <div class="nextIllo" style="background:${s.bg}">
            ${s.illo}
            <span class="nextBadge">${s.n}</span>
          </div>
          <div class="nextBody">
            <span class="nextTitle">${s.title}</span>
            <span class="nextDesc">${s.desc}</span>
          </div>
        </div>`).join('')}
    </div>`;
  }

  /* ============================================================
     FULL RENDER
     ============================================================ */
  const sourceIcon = (n = 14) => `<svg width="${n}" height="${n}" viewBox="0 0 24 24" fill="none" stroke="#566E00" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${source.icon}</svg>`;

  function render () {
    const m = MODELS[state.scenario];
    const n = m.steps.length;
    const i = Math.min(state.step, n - 1);
    const sug = computeSuggestion();
    const p = sug.primary;
    const { conf } = symptomLists();
    const { units, total } = totals();
    const others = sug.ranked.filter((k) => k !== p);
    const headline = conf.length || !state.fallback ? HEADLINES[state.scenario] : 'Let’s start with a diagnosis visit';
    const intro = sug.ranked.length > 1
      ? `We think ${sug.ranked.length} services fit. Slide through the story, edit the signs, and shift the balance between words and visuals.`
      : 'We think one service fits. Slide through the story, edit the signs, and shift the balance between words and visuals.';

    screen.innerHTML = `
    <!-- HEADER -->
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:13px;font-weight:500;color:#5F5A5E">AC Repair · Copilot</span>
        <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:#F4F9DC;font-size:12px;font-weight:500;color:#566E00">
          ${sourceIcon()}
          ${source.pill}
        </span>
      </div>
      <h1>${headline}</h1>
      <p class="sub">${intro}</p>

      <div class="card">
        <div style="width:64px;height:64px;flex:none;border-radius:16px;background:#E6F1FB;display:flex;align-items:center;justify-content:center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#1F1A1D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="4" y="9" width="32" height="14" rx="5" fill="#FFFFFF"/><path d="M9 18h22"/>
            <path d="M12 28c0 2-1.5 2-1.5 4M20 28c0 2-1.5 2-1.5 4M28 28c0 2-1.5 2-1.5 4"/>
          </svg>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
          <span class="recBadge">${sug.ranked.length > 1 ? 'Recommended for you' : 'Best match'}</span>
          <span style="font-size:17px;font-weight:600;margin-top:4px">${SERVICE[p].short}</span>
          <span class="price">Starts at ₹${SERVICE[p].price.toLocaleString('en-IN')} <span>· ${SERVICE[p].reviews} reviews</span></span>
          ${others.length ? `<div class="alsoRow">${others.map((k) =>
            `<span class="resTick">+ ${SERVICE[k].short}</span>`).join('')}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- WHY (GENERATIVE) -->
    <section>
      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
        <h2>Why we suggest this</h2>
        <p class="sub">Drag the slider, or tap a label.</p>
      </div>

      <div class="whyCard" id="whyCard" style="background:${TINTS[i % TINTS.length]}">
        <div>
          <div class="slider">
            <div class="track"><div class="fill" id="whyFill" style="width:${n === 1 ? 100 : (i / (n - 1)) * 100}%"></div></div>
            <input id="stepRange" class="stepRange" type="range" min="0" max="${n - 1}" step="1" value="${i}"
                   aria-label="Explanation step" aria-valuetext="${labelOf(m.steps[i], i)}">
          </div>
          <div class="labels" id="whyLabels">${whyLabelsHTML()}</div>

          <div class="balanceRow">
            <span class="bIco" aria-hidden="true">Aa</span>
            <input class="densityRange" id="densityRange" type="range" min="0" max="2" step="1"
                   value="${state.density}" aria-label="Text to visual balance"
                   aria-valuetext="${DNAMES[state.density]}">
            <span class="bIco" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5F5A5E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/>
                <path d="M21 16l-5-5-6 6"/>
              </svg>
            </span>
            <span class="bName" id="densityName">${DNAMES[state.density]}</span>
          </div>
        </div>

        <div id="whyPanel">${whyPanelHTML()}</div>
      </div>
    </section>

    <!-- UNITS -->
    <section style="border:1.5px solid #EBDDE3;border-radius:28px;padding:22px 16px 20px;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;flex-direction:column;gap:4px;padding:0 4px">
        <h2>How many ACs need this?</h2>
        <p class="sub">Tap a number or use the buttons. Each AC gets the services you tick.</p>
      </div>
      ${unitsHTML()}
    </section>

    <!-- CHECKLIST + ESTIMATE -->
    <section style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;flex-direction:column;gap:4px">
        <h2>What should we check?</h2>
        <p class="sub">Auto-set from your signs. Tick or untick to override.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">${checklistHTML()}</div>
      ${estimateHTML()}
    </section>

    <!-- WHAT HAPPENS NEXT (illustrated) -->
    <section style="display:flex;flex-direction:column;gap:14px">
      <h2>What happens next</h2>
      ${nextStepsHTML()}

      <div class="prep">
        <span style="font-size:15px;font-weight:600">Before the technician arrives</span>
        <div class="prepRow">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F1A1D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">
            <path d="M7 21L10 3M17 21L14 3M8.5 8h5M8 13h6M7.5 18h7"/>
          </svg>
          <span>Keep a ladder or stool ready if your AC is high up. The technician does not carry one.</span>
        </div>
        <div class="prepRow">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F1A1D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">
            <rect x="4" y="5" width="16" height="14" rx="4"/><path d="M9 10v2M15 10v2M10 16h4"/>
          </svg>
          <span>Make sure a working power socket is reachable near the AC.</span>
        </div>
      </div>

      <div class="actions">
        <button class="cta" data-action="addToCart" ${total === 0 ? 'disabled' : ''}
          style="opacity:${total === 0 ? .4 : 1}">Add to cart · ${INR(total)}${units > 1 ? ` · ${units} ACs` : ''}</button>
        <button class="ghost" data-action="change">Change what I told you</button>
      </div>
    </section>
  `;
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  function onInput (e) {
    if (e.target.id === 'stepRange') {
      state.step = Number(e.target.value);
      updateWhy();
    }
    if (e.target.id === 'densityRange') {
      state.density = Number(e.target.value);
      updateWhy();
    }
  }

  function onClick (e) {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const a = el.dataset.action;

    if (a === 'step') {
      state.step = Number(el.dataset.i);
      updateWhy();
    } else if (a === 'hot') {
      state.hot = Number(el.dataset.n);
      updateWhy();
    } else if (a === 'confirm') {
      state.symptoms[el.dataset.id] = 'confirmed';
      state.fallback = false;
      syncSel(); render();
    } else if (a === 'demote') {
      state.symptoms[el.dataset.id] = 'unknown';
      state.fallback = false;
      syncSel(); render();
    } else if (a === 'add') {
      state.symptoms[el.dataset.id] = 'confirmed';
      state.fallback = false;
      state.addOpen = false;
      syncSel(); render();
    } else if (a === 'openAdd') {
      state.addOpen = !state.addOpen;
      render();
    } else if (a === 'units') {
      state.units = Number(el.dataset.n); render();
    } else if (a === 'minus') {
      state.units = Math.max(1, state.units - 1); render();
    } else if (a === 'plus') {
      state.units = Math.min(5, state.units + 1); render();
    } else if (a === 'addToCart') {
      const lines = selectedDefs().map((d) => ({ serviceId: d.serviceId, quantity: state.units }));
      if (lines.length) config.onAddToCart?.(lines, { issue: state.quote, acType: analysis.acType });
    } else if (a === 'change') {
      config.onChangeAnswers?.();
    }
  }

  function onChange (e) {
    const id = e.target.dataset?.check;
    if (id) {
      state.sel[id] = e.target.checked;
      render();
    }
  }

  root.addEventListener('input', onInput);
  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);

  syncSel();
  render();

  return {
    destroy () {
      root.removeEventListener('input', onInput);
      root.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
      root.replaceChildren();
    },
  };
}
