const KEY = 'uc-reference-cart-v2';
export const emptyCart = () => ({ items: [], address: '' });
export function readCart() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    if (value && Array.isArray(value.items)) return { items: value.items.filter((item) => item && typeof item.serviceId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0), address: typeof value.address === 'string' ? value.address : '' };
  } catch { /* use an empty cart */ }
  return emptyCart();
}
export function saveCart(cart) { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* session remains usable */ } }
export function addService(cart, serviceId, issue = '', acType = '') {
  const existing = cart.items.find((item) => item.serviceId === serviceId);
  const items = existing ? cart.items.map((item) => item.serviceId === serviceId ? { ...item, issue: issue || item.issue, acType: acType || item.acType } : item) : [...cart.items, { serviceId, quantity: 1, issue, acType }];
  return { ...cart, items };
}
export function updateServiceAcType(cart, serviceId, acType) { return { ...cart, items: cart.items.map((item) => item.serviceId === serviceId ? { ...item, acType } : item) }; }
export function adjustQuantity(cart, serviceId, amount) {
  const items = cart.items.map((item) => item.serviceId === serviceId ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0);
  return { ...cart, items };
}
export function removeService(cart, serviceId) { return { ...cart, items: cart.items.filter((item) => item.serviceId !== serviceId) }; }
