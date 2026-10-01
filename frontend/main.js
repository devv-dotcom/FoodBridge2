/* Food Rescue UI interactions: navigation, cursor, magnetic controls and live counters. */
document.addEventListener('DOMContentLoaded', () => {
  // Lucide does not ship brand-logo glyphs. Replace former brand-only names
  // with equivalent supported icons before creating the icon set.
  const fallbackIcons = { instagram: 'camera', linkedin: 'briefcase-business', facebook: 'thumbs-up', github: 'code-2', twitter: 'message-circle' };
  document.querySelectorAll('[data-lucide]').forEach(icon => {
    const fallback = fallbackIcons[icon.dataset.lucide];
    if (fallback) icon.dataset.lucide = fallback;
  });
  lucide.createIcons({ strokeWidth: 1.7 });
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
    progress.style.width = `${(window.scrollY / (document.documentElement.scrollHeight - innerHeight)) * 100}%`;
  }, { passive: true });
  const setMenuState = open => {
    nav?.classList.toggle('is-open', open);
    menu?.setAttribute('aria-expanded', String(open));
    menu?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  };
  menu?.addEventListener('click', () => setMenuState(!nav.classList.contains('is-open')));
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenuState(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('is-open')) {
      setMenuState(false);
      menu?.focus();
    }
  });

  // Trusted Partners: CountUp keeps the headline numbers crisp while Swiper handles touch and keyboard-friendly testimonials.
  const trustStats = document.querySelector('.trust-stats');
  if (trustStats && window.countUp?.CountUp) {
    const animateTrustStats = () => trustStats.querySelectorAll('[data-count]').forEach(number => {
      if (number.dataset.counted) return;
      const counter = new window.countUp.CountUp(number, Number(number.dataset.count), { duration: 2.1, separator: ',' });
      if (!counter.error) { counter.start(); number.dataset.counted = 'true'; }
    });
    new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { animateTrustStats(); entry.target.dataset.observed = 'true'; }
    }), { threshold: .45 }).observe(trustStats);
  }

  if (window.Swiper && document.querySelector('.voice-slider')) {
    new Swiper('.voice-slider', {
      loop: true,
      speed: 650,
      grabCursor: true,
      autoplay: { delay: 6200, disableOnInteraction: false },
      navigation: { nextEl: '.voice-next', prevEl: '.voice-prev' },
      pagination: { el: '.voice-pagination', clickable: true },
      a11y: { enabled: true }
    });
  }

  const partnerTooltip = document.querySelector('.partner-map-tooltip');
  document.querySelectorAll('.partner-pin').forEach(pin => {
    const setPartnerLocation = () => {
      document.querySelectorAll('.partner-pin').forEach(item => item.classList.toggle('active', item === pin));
      if (!partnerTooltip) return;
      partnerTooltip.querySelector('span').textContent = pin.dataset.place;
      partnerTooltip.querySelector('strong').textContent = pin.dataset.impact;
    };
    pin.addEventListener('mouseenter', setPartnerLocation);
    pin.addEventListener('focus', setPartnerLocation);
  });

  document.querySelectorAll('.feature-partner').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (!matchMedia('(pointer:fine)').matches) return;
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      card.style.transform = `perspective(1000px) rotateX(${y * -4}deg) rotateY(${x * 5}deg) translateY(-6px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  const liveMapSvg = document.querySelector('.india-map svg');
  if (liveMapSvg) {
    [
      ['route-pune', 'M220 340 C200 350 174 344 156 325'],
      ['route-vizag', 'M220 340 C263 326 294 316 327 302']
    ].forEach(([className, pathData]) => {
      const route = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      route.setAttribute('class', `map-route ${className}`);
      route.setAttribute('d', pathData);
      liveMapSvg.append(route);
    });
  }

  const missionSteps = [...document.querySelectorAll('.mission-step')];
  const missionMoment = document.querySelector('.timeline-moment');
  const missionRail = document.querySelector('.timeline-rail i');
  const missionStates = [
    { icon: 'bell-ring', label: 'Step 01 · Live pickup', title: 'Make the first<br /><em>yes</em> count.', body: 'A nearby restaurant has food ready. One tap turns surplus into a shared meal.', count: '42', unit: 'meals' },
    { icon: 'shield-check', label: 'Step 02 · Freshness confirmed', title: 'Collect food<br /><em>with care.</em>', body: 'A quick verification keeps every meal safe, traceable, and ready to share.', count: '98', unit: 'quality score' },
    { icon: 'navigation', label: 'Step 03 · Your route is ready', title: 'Let a good route<br /><em>find you.</em>', body: 'Live directions keep the handoff simple, timely, and close to home.', count: '2.4', unit: 'km away' },
    { icon: 'heart-handshake', label: 'Step 04 · A shared table', title: 'Arrive with<br /><em>something good.</em>', body: 'A warm handoff brings rescued meals directly to an NGO partner.', count: '42', unit: 'plates shared' },
    { icon: 'award', label: 'Step 05 · Your impact grows', title: 'Good work earns<br /><em>its glow.</em>', body: 'Each rescue becomes a lasting part of your Food Rescue story.', count: '180', unit: 'points earned' }
  ];
  const activateMissionStep = index => {
    const state = missionStates[index];
    missionSteps.forEach((step, stepIndex) => step.classList.toggle('active', stepIndex === index));
    if (!missionMoment || !state) return;
    missionMoment.querySelector('.moment-icon').innerHTML = `<i data-lucide="${state.icon}"></i>`;
    missionMoment.querySelector('p').textContent = state.label;
    missionMoment.querySelector('h3').innerHTML = state.title;
    missionMoment.querySelector('div > span').textContent = state.body;
    missionMoment.querySelector('.moment-count').innerHTML = `${state.count}<small>${state.unit}</small>`;
    if (missionRail) missionRail.style.height = `${22 + index * 19.5}%`;
    if (window.lucide) lucide.createIcons({ strokeWidth: 1.7 });
  };
  missionSteps.forEach((step, index) => step.addEventListener('click', () => activateMissionStep(index)));

  const ngoNumbers = [...document.querySelectorAll('[data-partner-count]')];
  if (ngoNumbers.length && window.countUp?.CountUp) {
    const ngoObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.counted) return;
      entry.target.dataset.counted = 'true';
      ngoNumbers.forEach(number => new window.countUp.CountUp(number, Number(number.dataset.partnerCount), { duration: 1.8, separator: ',' }).start());
    }), { threshold: .45 });
    ngoObserver.observe(document.querySelector('.ngo-highlight'));
  }

  document.querySelectorAll('.benefit-grid article,.achievement-grid article').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (!matchMedia('(pointer:fine)').matches) return;
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      card.style.transform = `perspective(800px) translateY(-6px) rotateX(${y * -5}deg) rotateY(${x * 5}deg)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  const featuredStory = document.querySelector('.featured-story');
  const storyStates = {
    ngo: { quote: 'We feed over <em>500 families</em> every week.', copy: 'Food Rescue makes it possible for Hope Circle to plan each table with confidence and care.', name: 'Nisha Kapoor', role: 'NGO manager · Hope Circle', place: 'Delhi, India', impact: '2,840', unit: 'meals shared', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1100&q=82&fm=webp' },
    wedding: { quote: 'Leftover wedding food now feeds <em>hundreds.</em>', copy: 'A grand celebration can leave behind another generous moment for a neighbourhood.', name: 'Kavya Reddy', role: 'Marriage hall partner · Saanvi Gardens', place: 'Vizag, India', impact: '760', unit: 'plates shared', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1100&q=82&fm=webp' }
  };
  document.querySelectorAll('.river-track article[data-story]').forEach(card => card.addEventListener('click', () => {
    const story = storyStates[card.dataset.story];
    if (!featuredStory || !story) return;
    const content = featuredStory.querySelector('.featured-copy');
    content.style.opacity = '.2';
    content.style.transform = 'translateY(9px)';
    window.setTimeout(() => {
      featuredStory.querySelector('.featured-image img').src = story.image;
      featuredStory.querySelector('.featured-copy blockquote').innerHTML = story.quote;
      featuredStory.querySelector('.featured-copy > p').textContent = story.copy;
      featuredStory.querySelector('.story-place').innerHTML = `<i data-lucide="map-pin"></i> ${story.place}`;
      featuredStory.querySelector('.story-person strong').textContent = story.name;
      featuredStory.querySelector('.story-person span').textContent = story.role;
      featuredStory.querySelector('.featured-impact strong').innerHTML = `${story.impact}<small> ${story.unit}</small>`;
      content.style.opacity = '';
      content.style.transform = '';
      if (window.lucide) lucide.createIcons({ strokeWidth: 1.7 });
    }, 180);
  }));
  document.querySelector('.story-play')?.addEventListener('click', event => {
    const surface = event.currentTarget.closest('.video-surface');
    surface.classList.toggle('is-playing');
    event.currentTarget.setAttribute('aria-label', surface.classList.contains('is-playing') ? 'Pause Food Rescue success story preview' : 'Play Food Rescue success story');
  });

  const faqItems = [...document.querySelectorAll('.faq-item')];
  faqItems.forEach((item, index) => {
    const button = item.querySelector('button');
    const number = button?.querySelector('span');
    if (number) number.textContent = String(index + 1).padStart(2, '0');
    button?.addEventListener('click', () => {
    const shouldOpen = !item.classList.contains('open');
    faqItems.forEach(entry => {
      entry.classList.remove('open');
      entry.querySelector('button')?.setAttribute('aria-expanded', 'false');
    });
    if (shouldOpen) {
      item.classList.add('open');
      item.querySelector('button')?.setAttribute('aria-expanded', 'true');
    }
    });
  });

  document.querySelector('.newsletter-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    form.nextElementSibling?.classList.add('show');
    form.reset();
  });
  if (matchMedia('(pointer:fine)').matches) {
    const dot = document.querySelector('.cursor-dot'), ring = document.querySelector('.cursor-ring');
    window.addEventListener('pointermove', e => { dot.style.left = ring.style.left = `${e.clientX}px`; dot.style.top = ring.style.top = `${e.clientY}px`; });
    document.querySelectorAll('a,button').forEach(el => { el.addEventListener('mouseenter', () => ring.classList.add('is-hover')); el.addEventListener('mouseleave', () => ring.classList.remove('is-hover')); });
    document.querySelectorAll('.magnetic').forEach(el => { el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX-r.left-r.width/2)*.15}px, ${(e.clientY-r.top-r.height/2)*.18}px)`; }); el.addEventListener('mouseleave', () => el.style.transform = 'translate(0,0)'); });
  }
});
