const prices = {
  installation: { id: 'i', split: [1499, 1799], window: [1199, 1499] },
  cleaning: { id: 'f', split: [599, 799], window: [549, 749] },
  gas: { id: 'g', split: [2499, 2999], window: [2499, 2999] },
  repair: { id: 'r', split: [299, 399], window: [299, 399] },
};

// Keep the source prototype's precedence: relocation, dust, heat, then repair.
export function getRecommendedService(state) {
  const unitType = state.type === 'split' ? 'split' : 'window';
  let match = null;
  if (state.reloc) match = prices.installation;
  else if (state.dust >= 40) match = prices.cleaning;
  else if (state.feel === 'hot' && state.power) match = prices.gas;
  else if (state.water >= 0.5 || state.noise >= 40 || !state.power || state.feel === 'cold') match = prices.repair;
  if (!match) return null;

  const [price, originalPrice] = match[unitType];
  return {
    ...match,
    price,
    originalPrice,
    unitType,
    duration: { i: '120 min', f: '60–90 min', g: '90 min', r: '45 min' }[match.id],
    discount: Math.round((1 - price / originalPrice) * 100),
    severity: match.id === 'f' ? Math.min(100, Math.max(0, 100 - Math.round(state.dust * 0.5))) : ({ g: 45, r: 60, i: 70 }[match.id]),
  };
}
