import React, { useEffect, useRef, useState } from 'react';
import { categories, services, approvalCopy } from './data/services.js';
import { addService, adjustQuantity, readCart, removeService, saveCart, updateServiceAcType } from './lib/cart.js';

const glyph = (name) => `/assets/${name}.svg`;

function Icon({ name, className = '' }) {
  return <img className={`icon ${className}`} src={glyph(name)} alt="" aria-hidden="true" />;
}

function PrimaryButton({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}

function CartButton({ count, onClick }) {
  return (
    <button className="cart-button" type="button" aria-label={`Cart, ${count} selected units`} onClick={onClick}>
      <Icon name="shopping-cart" /><span>{count}</span>
    </button>
  );
}

function Header({ title, onBack, onCart, count }) {
  return (
    <header className="page-header">
      {onBack ? <button type="button" className="back-button" onClick={onBack}>← <span>Back</span></button> : <span className="header-side-space" />}
      <span className="page-header-title">{title}</span>
      <CartButton count={count} onClick={onCart} />
    </header>
  );
}

function LocationBar({ value, onClick }) {
  return (
    <button type="button" className="location-bar" onClick={onClick}>
      <Icon name="map-pin" />
      <span>{value || 'Delhi NCR · Select address'}</span>
      <Icon name="chevron-down" className="location-chevron" />
    </button>
  );
}

function SearchField({ value, onChange, onSubmit, inputRef, placeholder = 'Search AC services' }) {
  return (
    <form className="search-field" onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }}>
      <Icon name="search" />
      <input ref={inputRef} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {value && <button className="clear-search" type="button" onClick={() => onChange('')} aria-label="Clear search">×</button>}
    </form>
  );
}

function StickyFooter({ note, action, onClick, disabled = false, secondary = false }) {
  return (
    <footer className="sticky-footer">
      <p className="footer-note">{note}</p>
      <PrimaryButton variant={disabled ? 'disabled' : secondary ? 'secondary' : 'primary'} disabled={disabled} onClick={onClick}>{action}</PrimaryButton>
    </footer>
  );
}

function BottomNav({ active = 'Services', onSelect }) {
  const items = [
    { label: 'Services', icon: 'wind' },
    { label: 'Search', icon: 'search' },
    { label: 'Cart', icon: 'shopping-cart' },
    { label: 'Account', icon: 'shield' },
  ];
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map((item) => <button key={item.label} className={active === item.label ? 'nav-item is-active' : 'nav-item'} type="button" onClick={() => onSelect(item.label)}><Icon name={item.icon} /><span>{item.label}</span></button>)}
    </nav>
  );
}

function Notice({ children, tone = 'info' }) {
  return <div className={`notice notice-${tone}`}><Icon name={tone === 'warning' ? 'triangle-alert' : 'info'} /><span>{children}</span></div>;
}

function Accordion({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="accordion">
      <button className="accordion-trigger" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span>{title}</span><Icon name="chevron-down" className={open ? 'turn-up' : ''} />
      </button>
      {open && <p className="accordion-body">{children}</p>}
    </section>
  );
}

function QuantityControl({ quantity, onDecrease, onIncrease }) {
  return (
    <div className="quantity-control" aria-label="Selected service quantity">
      <button type="button" aria-label="Remove one unit" onClick={onDecrease}><Icon name="minus" /></button>
      <span aria-live="polite">{quantity}</span>
      <button type="button" aria-label="Add one unit" onClick={onIncrease}><Icon name="plus" /></button>
    </div>
  );
}

function ServiceCard({ service, onDetails, onAdd, isSelected, selectedCount = 0 }) {
  const isPackage = service.category === 'Super saver packages';
  return (
    <article className={`service-card ${isSelected ? 'service-card-selected' : ''} ${isPackage ? 'package-service-card' : ''}`}>
      {service.image && <div className="service-card-image"><img src={service.image} alt="" />{service.badge && <span className="service-badge">{service.badge}</span>}{isPackage && <div className="package-image-copy"><strong>Foam-jet AC service</strong><span>Deep clean AC vents for efficient cooling</span></div>}</div>}
      <div className="service-card-copy">
        <p className="service-category-label">{service.category}</p>
        <h3>{service.name}</h3>
        {service.rating && <p className="service-rating">★ <span>{service.rating}</span></p>}
        <div className="service-price-line"><strong>{service.price || 'Price pending'}</strong>{service.original && <del>{service.original}</del>}{service.duration && <span>• {service.duration}</span>}</div>
        {service.perUnit && <p className="per-unit">◆ {service.perUnit}</p>}
        {service.details?.length > 0 && <ul className="service-detail-list">{service.details.slice(0, 2).map((line) => <li key={line}>{line}</li>)}</ul>}
      </div>
      <div className="service-card-actions">
        <button type="button" className="text-link" onClick={onDetails}>View details</button>
        <PrimaryButton variant="outline" onClick={onAdd}>{isSelected ? `Add another (${selectedCount})` : 'Add'}</PrimaryButton>
      </div>
    </article>
  );
}
function ApplianceTile({ label, description, icon, onClick, disabled = false }) {
  return (
    <button className="appliance-tile" type="button" onClick={onClick} disabled={disabled}>
      <span className="appliance-icon"><Icon name={icon} /></span>
      <span>{label}</span>
      {description && <small>{description}</small>}
    </button>
  );
}

function EmptyState({ title, copy, button, onClick }) {
  return (
    <section className="empty-state">
      <div className="empty-state-icon"><Icon name="wind" /></div>
      <h1 className="heading-1">{title}</h1>
      <p className="body-copy">{copy}</p>
      {button && <PrimaryButton variant="outline" onClick={onClick}>{button}</PrimaryButton>}
    </section>
  );
}

export default function App() {
  const [cart, setCart] = useState(() => readCart());
  const [stack, setStack] = useState([{ page: 'home' }]);
  const [activeServiceId, setActiveServiceId] = useState('');
  const [issueDraft, setIssueDraft] = useState('');
  const [acType, setAcType] = useState('Split AC');
  const [professional, setProfessional] = useState('');
  const [arrivalType, setArrivalType] = useState('Schedule for later');
  const [serviceDate, setServiceDate] = useState('Sun 01');
  const [serviceTime, setServiceTime] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All services');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [applianceUnavailable, setApplianceUnavailable] = useState('');
  const searchRef = useRef(null);

  useEffect(() => saveCart(cart), [cart]);

  const page = stack[stack.length - 1]?.page || 'home';
  const selectedService = services.find((item) => item.id === activeServiceId) || null;
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const cartHasUnpricedItems = cart.items.some((item) => services.find((service) => service.id === item.serviceId)?.amount == null);
  const cartItemTotal = cart.items.reduce((sum, item) => sum + (services.find((service) => service.id === item.serviceId)?.amount || 0) * item.quantity, 0);
  const cartItemTotalLabel = cartHasUnpricedItems ? 'Some prices need confirmation' : `₹${cartItemTotal.toLocaleString('en-IN')}`;
  const isScreenshotPaymentExample = cart.items.length === 1 && cart.items[0].serviceId === 'ac.foam-jet-3ac' && cart.items[0].quantity === 1;
  const slotSurcharge = arrivalType === 'Schedule for later' && /:45/.test(serviceTime) ? 100 : 0;
  const paymentTotal = isScreenshotPaymentExample ? `₹${(1736 + slotSurcharge).toLocaleString('en-IN')}` : 'Pending taxes & fees';
  const selectedCartItem = cart.items.find((item) => item.serviceId === activeServiceId) || null;

  const push = (nextPage) => setStack((current) => [...current, { page: nextPage }]);
  const back = () => setStack((current) => current.length > 1 ? current.slice(0, -1) : [{ page: 'home' }]);
  const home = () => setStack([{ page: 'home' }]);
  const openCart = () => { if (page !== 'cart') push('cart'); };
  const openDetails = (serviceId) => { setActiveServiceId(serviceId); setIssueDraft(''); setAcType(cart.items.find((item) => item.serviceId === serviceId)?.acType || 'Split AC'); push('details'); };
  const setAddress = (address) => setCart((current) => ({ ...current, address }));
  const decrement = (serviceId) => setCart((current) => adjustQuantity(current, serviceId, -1));
  const increment = (serviceId) => setCart((current) => adjustQuantity(current, serviceId, 1));
  const addFromList = (serviceId) => setCart((current) => current.items.some((item) => item.serviceId === serviceId) ? adjustQuantity(current, serviceId, 1) : addService(current, serviceId));
  const addActiveService = (issue = '') => {
    if (!selectedService) return;
    setCart((current) => addService(current, selectedService.id, issue, acType));
    push('addons');
  };
  const shareAcPage = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Urban Company AC services', url: window.location.href });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(window.location.href); setShareStatus('Link copied'); }
      else setShareStatus('Sharing is unavailable here');
    } catch { setShareStatus('Sharing was cancelled'); }
  };

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape' && stack.length > 1) back(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stack.length]);

  const navAction = (destination) => {
    if (destination === 'Services') push('services');
    else if (destination === 'Search') {
      setStack((current) => [...current, { page: 'services' }]);
      requestAnimationFrame(() => searchRef.current?.focus());
    } else if (destination === 'Cart') openCart();
    else push('account-preview');
  };

  return (
    <div className="device">
      <main className="app-screen" data-screen={page}>
        {page === 'home' && (
          <>
            <div className="urban-top">
              <header className="home-header"><span className="home-title">Home</span><CartButton count={cartCount} onClick={openCart} /></header>
              <LocationBar value={cart.address} onClick={() => push('address')} />
              <SearchField value={search} onChange={setSearch} onSubmit={() => push('services')} placeholder="Search for AC services" />
            </div>
            <div className="content-scroll home-content">
              <img className="home-banner" src="/assets/urban-banner.png" alt="Diwali home service banner from the Figma screenshot" />
              <h1 className="heading-1 home-section-title">All services</h1>
              <div className="home-service-grid">
                {[
                  ['Wall makeover', '/assets/home-wall.png'],
                  ['Painting & Water-proofing', '/assets/home-paint.png'],
                  ['AC & Appliance Repair', '/assets/ac-category.png'],
                  ['Electrician, Plumber & Carpenter', '/assets/home-electrician.png'],
                ].map(([name, src]) => <button key={name} className="home-service-tile" type="button" onClick={() => { if (name === 'AC & Appliance Repair') push('appliances'); else { setApplianceUnavailable(name); push('appliance-preview'); } }}><img src={src} alt="" /><span>{name}</span></button>)}
              </div>
              <section className="home-ac-card">
                <img src="/assets/foam-cleaning.png" alt="Air conditioner being cleaned with foam" />
                <div><span className="eyebrow">AC &amp; APPLIANCE REPAIR</span><h2>Book an AC service</h2><p>Choose from AC cleaning, repair and installation.</p><button className="home-ac-link" type="button" onClick={() => push('appliances')}>Explore AC services <span>→</span></button></div>
              </section>
              <p className="preview-caption">{approvalCopy.project}</p>
            </div>            <BottomNav active="Services" onSelect={navAction} />
          </>
        )}

        {page === 'appliances' && (
          <>
            <Header title="AC & Appliance Repair" onBack={back} onCart={openCart} count={cartCount} />
            <div className="content-scroll category-content">
              <h1 className="heading-1">AC &amp; Appliance Repair</h1>
              <section className="category-section">
                <h2 className="heading-2">Large appliances</h2>
                <div className="appliance-grid">
              <ApplianceTile label="AC" description="Air conditioner" icon="wind" onClick={() => push('ac-overview')} />
                  <ApplianceTile label="Washing Machine" icon="wind" onClick={() => { setApplianceUnavailable('Washing Machine'); push('appliance-preview'); }} />
                  <ApplianceTile label="Refrigerator" icon="wind" onClick={() => { setApplianceUnavailable('Refrigerator'); push('appliance-preview'); }} />
                </div>
              </section>
              <section className="category-section">
                <h2 className="heading-2">Other appliances</h2>
                <div className="appliance-grid">
                  {['Chimney', 'Microwave', 'Stove', 'RO/Water Purifier', 'Geyser'].map((name) => <ApplianceTile key={name} label={name} icon="wrench" onClick={() => { setApplianceUnavailable(name); push('appliance-preview'); }} />)}
                </div>
              </section>
            </div>
          </>
        )}

        {page === 'ac-overview' && (
          <>
            <header className="ac-topbar">
              <button type="button" className="ac-back" onClick={back} aria-label="Go back">‹</button>
              <div className="ac-topbar-copy"><strong>AC</strong><span>⚡ Pro arrives in 44 mins</span></div>
              <button type="button" className="ac-top-icon" aria-label="Search AC services" onClick={() => { setCategory('All services'); push('services'); requestAnimationFrame(() => searchRef.current?.focus()); }}>⌕</button>
              <button type="button" className="ac-top-icon" aria-label="Share AC services" onClick={shareAcPage}>↗</button>
            </header>
            {shareStatus && <p className="share-status" aria-live="polite">{shareStatus}</p>}
            <div className="content-scroll ac-overview-content">
              <section className="diagnosis-feature">
                <div><span className="free-check-label">FREE GAS CHECK</span><h1>AC diagnosis<br />with Co-pilot</h1><p>No gas refill without a reading</p></div>
                <img src="/assets/ac-diagnosis-device.png" alt="Urban Company AC diagnostic device" />
              </section>
              <section className="ac-rating-row"><div><h2>AC</h2><p>★ 4.78 (14.3M bookings)</p></div><div className="earliest-slot"><span>◷ Earliest</span><strong>Tue, 8:00 AM</strong></div></section>
              <button className="cover-promo" type="button" onClick={() => push('cover-preview')}><span><strong>● UC COVER</strong><span>Up to 30 days warranty on repairs</span></span><span className="cover-arrow">›</span></button>
              <div className="ac-shortcuts">
                {[
                  ['Super saver packages', '/assets/category-super-saver.png'],
                  ['Service', '/assets/category-service.png'],
                  ['Repair & gas refill', '/assets/category-repair.png'],
                  ['Installation/uninstallation', '/assets/category-install.png'],
                ].map(([label, src]) => <button key={label} type="button" onClick={() => { setCategory(label); push('services'); }}><img src={src} alt=""/><span>{label}</span></button>)}
              </div>
              <section className="overview-section" id="packages"><h2 className="heading-2">Super saver packages</h2>
                <div className="service-list">
                  {services.filter((item) => item.category === 'Super saver packages').map((item) => <ServiceCard key={item.id} service={item} isSelected={cart.items.some((line) => line.serviceId === item.id)} selectedCount={cart.items.find((line) => line.serviceId === item.id)?.quantity || 0} onDetails={() => openDetails(item.id)} onAdd={() => addFromList(item.id)} />)}
                </div>
              </section>
              {['Service', 'Repair & gas refill', 'Installation/uninstallation'].map((group) => <section className="overview-section" key={group}><div className="section-heading-row"><h2 className="heading-2">{group}</h2><button type="button" className="text-link" onClick={() => { setCategory(group); push('services'); }}>View all</button></div><div className="service-list">{services.filter((item) => item.category === group).map((item) => <ServiceCard key={item.id} service={item} isSelected={cart.items.some((line) => line.serviceId === item.id)} selectedCount={cart.items.find((line) => line.serviceId === item.id)?.quantity || 0} onDetails={() => openDetails(item.id)} onAdd={() => addFromList(item.id)} />)}</div></section>)}
              <p className="preview-caption">{approvalCopy.project}</p>
            </div>
            {cart.items.length > 0 && <StickyFooter note={`${cartCount} item${cartCount === 1 ? '' : 's'} added`} action="View cart" onClick={openCart} />}
          </>
        )}

        {page === 'cover-preview' && (
          <>
            <Header title="UC Cover" onBack={back} onCart={openCart} count={cartCount} />
            <div className="content-scroll cover-content">
              <h1 className="heading-1">UC Cover</h1><p className="body-copy">End-to-end service protection</p>
              <section className="cover-info-card"><span className="cover-mark">✓</span><h2>90-day warranty on repairs</h2><ul><li>Free repairs if the same issue arises</li><li>One-click hassle-free claims</li><li>Up to ₹10,000 cover if anything is damaged during the repair</li></ul></section>
              <section className="cover-info-card cover-expert"><h2>Expert verified repair quotes</h2><p>We will verify the repair quote shared by the professional.</p><p>If you’re still unsure, you can ask an expert for a second opinion.</p></section>
              <section className="cover-info-card"><h2>Fixed rate card</h2><p>Review the service details before adding a service to your cart.</p></section>
            </div>
          </>
        )}

        {page === 'services' && (
          <>
            <Header title="AC services" onBack={back} onCart={openCart} count={cartCount} />
            <LocationBar value={cart.address} onClick={() => push('address')} />
            <SearchField value={search} onChange={setSearch} inputRef={searchRef} onSubmit={() => {}} />
            <div className="content-scroll services-content">
              <h1 className="heading-1">AC services &amp; repair</h1>
              <p className="body-copy">Choose a service to review its details.</p>
              <div className="filter-row" aria-label="Service categories">
                {categories.map((item) => <button key={item} type="button" className={`filter-chip ${category === item ? 'is-selected' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}
              </div>
              <div className="filter-row service-filters">
                <button type="button" className={`filter-chip ${serviceFilter === 'all' ? 'is-selected' : ''}`} onClick={() => setServiceFilter('all')}>All services</button>
                <button type="button" className={`filter-chip ${serviceFilter === 'selected' ? 'is-selected' : ''}`} onClick={() => setServiceFilter((value) => value === 'selected' ? 'all' : 'selected')}>Selected ({cart.items.length})</button>
              </div>
              <div className="service-list">
                {services
                  .filter((item) => category === 'All services' || item.category === category)
                  .filter((item) => serviceFilter !== 'selected' || cart.items.some((cartItem) => cartItem.serviceId === item.id))
                  .filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase()))
                  .map((item) => <ServiceCard key={item.id} service={item} isSelected={cart.items.some((cartItem) => cartItem.serviceId === item.id)} onDetails={() => openDetails(item.id)} onAdd={() => addFromList(item.id)} selectedCount={cart.items.find((cartItem) => cartItem.serviceId === item.id)?.quantity || 0} />)}
                {services.filter((item) => (category === 'All services' || item.category === category) && (serviceFilter !== 'selected' || cart.items.some((cartItem) => cartItem.serviceId === item.id)) && item.name.toLowerCase().includes(search.trim().toLowerCase())).length === 0 && (
                  <EmptyState title="No matching services" copy="Try a different service name or clear your filters." button="Clear filters" onClick={() => { setSearch(''); setCategory('All services'); setServiceFilter('all'); }} />
                )}
              </div>
              <p className="preview-caption">{approvalCopy.project}</p>
            </div>
            {cart.items.length > 0 ? <StickyFooter note={`${cartCount} item${cartCount === 1 ? '' : 's'} added`} action="View cart" onClick={openCart} /> : <BottomNav active="Services" onSelect={navAction} />}
          </>
        )}

        {page === 'details' && selectedService && (
          <>
            <Header title="Service details" onBack={back} onCart={openCart} count={cartCount} />
            <div className="content-scroll details-content">
              <p className="breadcrumbs">AC services / {selectedService.category}</p>
              <h1 className="heading-1">{selectedService.name}</h1>
              {selectedService.image && <img className="service-detail-photo" src={selectedService.image} alt="" />}
              <p className="service-id">{selectedService.rating ? `★ ${selectedService.rating}` : selectedService.id}</p>
              <div className="detail-price-row"><strong>{selectedService.price || 'Price pending'}</strong>{selectedService.original && <del>{selectedService.original}</del>}<span>{selectedService.duration || 'Duration pending'}</span></div>
              {selectedService.category === 'Super saver packages' && <section className="field-block"><label htmlFor="ac-type">AC type</label><select id="ac-type" value={acType} onChange={(event) => { setAcType(event.target.value); if (selectedCartItem) setCart((current) => updateServiceAcType(current, selectedService.id, event.target.value)); }}><option>Split AC</option><option>Window AC</option></select><p className="field-hint">The reference service applies to both window and split ACs.</p></section>}
              <hr className="divider" />
              <section className="fact-section">
                <h2 className="heading-2">About this service</h2>
                <h3>{selectedService.category === 'Super saver packages' ? selectedService.name : 'Service details'}</h3>
                <p className="body-copy">{selectedService.details?.join(' · ') || 'Service details shown as in the Figma screenshot.'}</p>
              </section>
              <hr className="divider" />
              <section className="fact-section">
                <h2 className="heading-2">Service information</h2>
                <div className="accordion-list">
                  <Accordion title="What is included?">Scope pending approval. No inclusion or exclusion is implied.</Accordion>
                  <Accordion title="Warranty">Warranty pending approval. No verified warranty or guarantee is implied.</Accordion>
                  <Accordion title="Safety & policies">Safety and policy wording is pending approval.</Accordion>
                </div>
              </section>
              {selectedService.category.includes('Installation') && <Notice tone="warning">Installation extras and policy wording require approved project data before booking.</Notice>}
              {selectedService.id === 'ac.repair' && <button type="button" className="text-link" onClick={() => push('repair-process')}>How does a repair work?</button>}
              <p className="preview-caption">{approvalCopy.project}</p>
            </div>
            <StickyFooter note={selectedCartItem ? `${selectedCartItem.quantity} selected · ${selectedService.price || 'Price pending'}` : `${selectedService.price || 'Price pending'} · ${selectedService.duration || 'Duration pending'}`} action={selectedService.id === 'ac.repair' ? 'Choose issue' : selectedCartItem ? 'Continue to options' : 'Add to selection'} onClick={() => selectedService.id === 'ac.repair' ? push('repair-issue') : selectedCartItem ? push('addons') : addActiveService()} />
          </>
        )}

        {page === 'repair-issue' && selectedService && (
          <>
            <Header title="AC repair" onBack={back} onCart={openCart} count={cartCount} />
            <div className="content-scroll issue-content">
              <p className="breadcrumbs">AC services / Repair</p>
              <h1 className="heading-1">What needs attention?</h1>
              <p className="body-copy">Tell us what you noticed. The preview saves your note with the selection.</p>
              <label className="field-label" htmlFor="issue-note">Describe the issue</label>
              <textarea id="issue-note" className="issue-input" value={issueDraft} onChange={(event) => setIssueDraft(event.target.value)} placeholder="Enter your issue" rows="4" />
              <p className="field-hint">Issue categories, diagnosis, repair method and safety instructions are pending approval.</p>
              <Notice tone="warning">No repair or cleaning instructions have been approved.</Notice>
            </div>
            <StickyFooter note={issueDraft.trim() ? 'Issue note saved locally with this selection.' : 'Describe the issue to continue.'} action="Add to selection" disabled={!issueDraft.trim()} onClick={() => addActiveService(issueDraft.trim())} />
          </>
        )}

        {page === 'repair-process' && (
          <>
            <Header title="Repair process" onBack={back} onCart={openCart} count={cartCount} />
            <div className="content-scroll process-content">
              <p className="breadcrumbs">AC services / Repair</p>
              <h1 className="heading-1">How a repair works</h1>
              <p className="body-copy">Process structure only. These are not approved repair instructions.</p>
              <div className="steps-list">
                {[
                  ['1', 'Identify the service', 'AC repair · service selection'],
                  ['2', 'Review service facts', 'Price pending · Duration pending · Scope pending approval'],
                  ['3', 'Review approval blockers', 'Warranty, safety and policies pending approval. Booking unavailable until required data is approved.'],
                ].map(([number, title, copy]) => <article className="step-row" key={number}><span className="step-number">{number}</span><div><h2>{title}</h2><p>{copy}</p></div></article>)}
              </div>
              <Notice tone="warning">Never reorder steps or generate technical instructions.</Notice>
              <p className="preview-caption">{approvalCopy.project}</p>
            </div>
          </>
        )}

        {page === 'addons' && selectedService && selectedCartItem && (
          <>
            <Header title="AC add-ons" onBack={back} onCart={openCart} count={cartCount} />
            <div className="content-scroll addons-content">
              <h1 className="heading-1">Optional add-ons</h1>
              <p className="body-copy">Review extras for your selection. You can continue without adding anything.</p>
              <div className="selected-service-panel">
                <p className="small-muted">Your selected service</p>
                <h2>{selectedService.name}</h2>
                <p className="body-copy">Duration pending · Scope pending approval</p>
                <div className="selected-service-bottom"><strong>Price pending</strong><QuantityControl quantity={selectedCartItem?.quantity || 1} onDecrease={() => decrement(selectedService.id)} onIncrease={() => increment(selectedService.id)} /></div>
              </div>
              <h2 className="heading-2 section-gap">Add-ons for your service</h2>
              <p className="body-copy muted-line">Not selected · Unavailable</p>
              <article className="addon-card">
                <h3>AC add-on</h3>
                <strong>Name awaiting approval</strong>
                <p className="body-copy">Price pending · Duration pending</p>
                <p className="body-copy">Scope pending approval. Compatibility with the selected service is not confirmed.</p>
                <PrimaryButton variant="disabled" disabled>Add unavailable</PrimaryButton>
                <p className="field-hint">Disabled until scope and price are approved.</p>
              </article>
              <hr className="divider" />
              <h2 className="heading-2">No paid extras selected</h2>
              <p className="body-copy">Your selection contains only {selectedService.name}, quantity {selectedCartItem?.quantity || 0}.</p>
              <p className="preview-caption">{approvalCopy.project}</p>
            </div>
            <StickyFooter note="Continue with your existing selection" action="Continue to cart" onClick={openCart} />
          </>
        )}

        {page === 'cart' && (
          <>
            <Header title="Cart review" onBack={back} onCart={openCart} count={cartCount} />
            <div className="content-scroll cart-content">
              {cart.items.length ? <>
                <h1 className="heading-1">Review your cart</h1>
                <p className="body-copy">{cart.items.length} service{cart.items.length === 1 ? '' : 's'} · No paid extras selected</p>
                {cart.items.map((item) => {
                  const service = services.find((entry) => entry.id === item.serviceId);
                  if (!service) return null;
                  return <article className="cart-item" key={item.serviceId}>
                    <p className="small-muted">Your selected service</p>
                    <div className="cart-item-heading"><h2>{service.name}</h2><button className="text-link" type="button" onClick={() => openDetails(service.id)}>Edit</button></div>
                    <p className="body-copy">{service.duration || 'Duration pending'} · Scope pending approval</p>
                    {item.issue && <p className="issue-summary">Issue: {item.issue}</p>}
                    {item.acType && <p className="issue-summary">AC type: {item.acType}</p>}
                    <div className="selected-service-bottom"><strong>{service.price || 'Price pending'}</strong><QuantityControl quantity={item.quantity} onDecrease={() => decrement(item.serviceId)} onIncrease={() => increment(item.serviceId)} /></div>
                    <button className="remove-link" type="button" onClick={() => setCart((current) => removeService(current, item.serviceId))}>Remove service</button>
                  </article>;
                })}
                <div className="cart-actions"><button type="button" className="text-link" onClick={() => push('services')}>Add more items</button><button type="button" className="text-link" onClick={() => push('addons')}>Review add-ons</button></div>
                <section className="cart-section">
                  <h2 className="heading-2">Service location</h2>
                  <label className="field-label" htmlFor="service-address">Service address</label>
                  <input id="service-address" className="text-input" value={cart.address} onChange={(event) => setAddress(event.target.value)} placeholder="Enter service address" />
                  <p className="field-hint">Choose an address to check availability. This does not reserve a booking.</p>
                </section>
                <hr className="divider" />
                <section className="cart-section booking-details-section">
                  <h2 className="heading-2">Professional &amp; arrival</h2>
                  <p className="body-copy">{professional || 'Choose a professional'}{serviceTime ? ` · ${arrivalType === 'Instant' ? 'In 30 mins' : `${serviceDate}, ${serviceTime}`}` : ' · Choose a time'}</p>
                  <div className="cart-actions"><button type="button" className="text-link" onClick={() => push('professional')}>{professional ? 'Change professional' : 'Select professional'}</button><button type="button" className="text-link" onClick={() => push('timing')}>Choose time</button></div>
                </section>
                <hr className="divider" />
                <section className="cart-section">
                  <h2 className="heading-2">Cost breakdown</h2>
                  <CostRow left={`Item total × ${cartCount}`} right={cartItemTotalLabel} />
                  <CostRow left="Service charge" right={isScreenshotPaymentExample ? '₹100' : 'Pending approval'} />
                  <CostRow left="Taxes and fees" right={isScreenshotPaymentExample ? '₹139' : 'Pending approval'} />
                  {isScreenshotPaymentExample && serviceTime && <CostRow left="Time slot charge" right={slotSurcharge ? '₹100' : '₹0'} />}
                  <CostRow left="Amount payable" right={paymentTotal} strong />
                  <p className="field-hint">Figures are from the supplied Figma screenshots. Payment is not connected in this preview.</p>
                </section>
                <hr className="divider" />
                <section className="cart-section">
                  <h2 className="heading-2">Before you book</h2>
                  <Notice tone="info">Warranty pending approval. Safety and policy wording is pending approval.</Notice>
                </section>
                <p className="preview-caption">{approvalCopy.project}</p>
              </> : <EmptyState title="Your cart is empty" copy="Add a service to review it here." button="Explore AC services" onClick={() => push('services')} />}
            </div>
            {cart.items.length > 0 && <StickyFooter note={serviceTime ? 'Review your payment details.' : 'Choose a professional and arrival time to continue.'} action={serviceTime ? 'Review payment' : professional ? 'Choose arrival time' : 'Select a professional'} onClick={() => push(serviceTime ? 'payment-summary' : professional ? 'timing' : 'professional')} />}
          </>
        )}

        {page === 'professional' && (
          <>
            <Header title="Select a professional" onBack={back} onCart={openCart} count={cartCount} />
            <div className="content-scroll professional-content">
              <h1 className="heading-1">Select a professional</h1>
              <p className="body-copy">Choose who should arrive for your AC service.</p>
              {[
                ['Best available', 'BA', 'First available professional'],
                ['Jafar', 'J', 'Professional shown in your screenshot'],
                ['Tapadin', 'T', 'Professional shown in your screenshot'],
              ].map(([name, initials, note]) => <button key={name} type="button" className={`professional-option ${professional === name ? 'is-selected' : ''}`} onClick={() => setProfessional(name)}><span className="pro-avatar">{initials}</span><span className="pro-copy"><strong>{name}</strong><small>{note}</small></span><span className="radio-mark">{professional === name ? '●' : '○'}</span></button>)}
            </div>
            <StickyFooter note={professional ? `${professional} selected` : 'Choose a professional to continue.'} action="Choose arrival time" disabled={!professional} onClick={() => push('timing')} />
          </>
        )}

        {page === 'timing' && (
          <>
            <Header title="Choose a time" onBack={back} onCart={openCart} count={cartCount} />
            <div className="content-scroll timing-content">
              <h1 className="heading-1">When should {professional || 'your professional'} arrive?</h1>
              <button type="button" className={`arrival-choice ${arrivalType === 'Instant' ? 'is-selected' : ''}`} disabled={professional === 'Jafar'} onClick={() => { setArrivalType('Instant'); setServiceTime('In 30 mins'); }}><span><strong>In 30 mins</strong><small>{professional === 'Jafar' ? 'Unavailable with Jafar' : 'Earliest arrival'}</small></span><span className="radio-mark">{arrivalType === 'Instant' ? '●' : '○'}</span></button>
              <section className="schedule-panel">
                <button type="button" className={`arrival-choice ${arrivalType === 'Schedule for later' ? 'is-selected' : ''}`} onClick={() => { setArrivalType('Schedule for later'); setServiceTime(''); }}><span><strong>Schedule for later</strong><small>Select your preferred day &amp; time</small></span><span className="radio-mark">{arrivalType === 'Schedule for later' ? '●' : '○'}</span></button>
                <div className="date-choices">{['Today 31', 'Sun 01', 'Mon 02'].map((date) => <button key={date} type="button" className={serviceDate === date ? 'is-selected' : ''} onClick={() => { setServiceDate(date); setArrivalType('Schedule for later'); setServiceTime(''); }}>{date}</button>)}</div>
                <p className="field-label">Select start time of service</p>
                <div className="time-grid">{['08:00 AM','08:15 AM','08:30 AM','08:45 AM','09:00 AM','09:15 AM','09:30 AM','09:45 AM','10:00 AM','10:15 AM','10:30 AM','10:45 AM','11:00 AM','11:15 AM','11:30 AM','11:45 AM','12:00 PM','12:15 PM','12:30 PM','12:45 PM','01:00 PM','01:15 PM','01:30 PM','01:45 PM','02:00 PM','02:15 PM','02:30 PM','02:45 PM','03:00 PM','03:15 PM','03:30 PM','03:45 PM','04:00 PM','04:15 PM','04:30 PM','04:45 PM','05:00 PM','05:15 PM','05:30 PM','05:45 PM','06:00 PM'].map((time, index) => <button key={time} type="button" className={serviceTime === time ? 'is-selected' : ''} onClick={() => { setArrivalType('Schedule for later'); setServiceTime(time); }}>{time}{index % 4 === 3 && <small>+₹100</small>}</button>)}</div>
                <p className="online-note">Online payment only for selected date</p>
              </section>
            </div>
            <StickyFooter note={serviceTime ? `${serviceDate} · ${serviceTime}` : 'Choose a service time.'} action="Continue to payment summary" disabled={!serviceTime} onClick={() => push('payment-summary')} />
          </>
        )}

        {page === 'payment-summary' && (
          <>
            <Header title="Payment summary" onBack={back} onCart={openCart} count={cartCount} />
            <div className="content-scroll payment-content">
              <h1 className="heading-1">Payment summary</h1>
              {cart.items.map((item) => { const service = services.find((entry) => entry.id === item.serviceId); return service && <article className="payment-service-row" key={item.serviceId}><div><strong>{service.name}</strong><small>{item.quantity} item{item.quantity === 1 ? '' : 's'} · {service.duration || 'Duration pending'}</small></div><strong>{service.price || 'Price pending'}</strong></article>; })}
              <section className="payment-section"><h2 className="heading-2">Service details</h2><p>{cart.address || 'Service address not selected'}</p><p>{professional || 'Professional not selected'}</p><p>{arrivalType === 'Instant' ? 'In 30 mins' : `${serviceDate} · ${serviceTime || 'Time not selected'}`}</p></section>
              <section className="payment-section"><h2 className="heading-2">Payment summary</h2><CostRow left="Item total" right={cartItemTotalLabel} />{isScreenshotPaymentExample ? <><CostRow left="Service charge" right="₹100" /><CostRow left="Taxes and fees" right="₹139" />{serviceTime && <CostRow left="Time slot charge" right={slotSurcharge ? '₹100' : '₹0'} />}<CostRow left="Total amount" right={paymentTotal} strong /><CostRow left="Amount to pay" right={paymentTotal} strong /></> : <><CostRow left="Service charge" right="Pending" /><CostRow left="Taxes and fees" right="Pending" /><CostRow left="Amount to pay" right="Total pending" strong /></>}</section>
              <section className="payment-section"><h2 className="heading-2">Pay via</h2><div className="upi-choice"><span>◉</span><strong>PhonePe UPI</strong><span className="radio-mark">●</span></div><p className="field-hint">Payment is not connected in this preview.</p></section>
              <Accordion title="Cancellation policy">Cancellation policy details are shown in the reference screenshots.</Accordion>
            </div>
            <StickyFooter note="This preview does not take payments." action={isScreenshotPaymentExample ? `Pay ${paymentTotal} · Preview only` : 'Payment unavailable'} disabled />
          </>
        )}

        {page === 'address' && (
          <>
            <Header title="Service address" onBack={back} onCart={openCart} count={cartCount} />
            <div className="content-scroll address-content">
              <h1 className="heading-1">Confirm service address</h1>
              <p className="body-copy">Choose an address to check availability. Your selection does not reserve a booking.</p>
              <label className="field-label" htmlFor="address-edit">Service address</label>
              <input id="address-edit" className="text-input" value={cart.address} onChange={(event) => setAddress(event.target.value)} placeholder="Enter service address" />
              <p className="field-hint">Delhi NCR service availability is pending confirmation.</p>
            </div>
            <StickyFooter note={cart.address ? 'Address saved on this device.' : 'Enter an address to continue.'} action="Back to services" onClick={back} />
          </>
        )}

        {page === 'appliance-preview' && (
          <>
            <Header title={applianceUnavailable} onBack={back} onCart={openCart} count={cartCount} />
            <EmptyState title="No matching services" copy="This preview contains the AC service flow. Other appliance service details are not included." button="Back to appliances" onClick={back} />
          </>
        )}

        {page === 'account-preview' && (
          <>
            <Header title="Account" onBack={back} onCart={openCart} count={cartCount} />
            <EmptyState title="Account preview" copy="Account services are outside this AC service flow." button="Return home" onClick={home} />
          </>
        )}
      </main>
    </div>
  );
}

function CostRow({ left, right, strong = false }) {
  return <div className={`cost-row ${strong ? 'cost-total' : ''}`}><span>{left}</span><span>{right}</span></div>;
}




