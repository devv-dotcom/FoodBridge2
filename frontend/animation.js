/* GSAP motion layer. Animation is disabled for visitors who prefer reduced motion. */
document.addEventListener('DOMContentLoaded', () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  const lenis = window.Lenis ? new Lenis({ lerp: .09, smoothWheel: true }) : null;
  if (lenis) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  const splitHeading = element => {
    if (!element || !window.SplitType) return null;
    element.setAttribute('aria-label', element.innerText.replace(/\s+/g, ' ').trim());
    const result = new SplitType(element, { types: 'chars,words' });
    result.chars.forEach(char => {
      char.setAttribute('aria-hidden', 'true');
      if (!char.textContent.trim()) char.style.width = '.28em';
    });
    return result;
  };
  const split = splitHeading(document.querySelector('.split-headline'));
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro.from('.brand', { y: -16, opacity: 0, duration: .6 }).from('.main-nav a,.nav-cta', { y: -18, opacity: 0, stagger: .05, duration: .55 }, '-=.4');
  if (split?.chars?.length) intro.from(split.chars, { yPercent: 110, opacity: 0, stagger: .022, duration: .75 }, '-=.25');
  intro.from('.reveal-up', { y: 20, opacity: 0, stagger: .13, duration: .6 }, '-=.35').from('.food-stage', { scale: .72, rotation: -4, opacity: 0, duration: 1, ease: 'expo.out' }, '-=.75').from('.floating-card,.round-badge', { y: 35, opacity: 0, stagger: .1, duration: .65 }, '-=.65');
  gsap.to('.food-stage', { y: -14, rotation: 10, duration: 4.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to('.meals-card', { y: -11, rotation: -2, duration: 3.3, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to('.pickup-card', { y: 11, rotation: 2, duration: 3.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to('.ngo-card', { y: -8, duration: 3.1, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to('.hero-blob', { rotation: 35, duration: 20, repeat: -1, ease: 'none' });
  gsap.to('.food-stage', { yPercent: 9, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 } });
  gsap.to('.hero-copy', { scale: .95, y: -35, opacity: .4, scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: 1 } });
  gsap.from('.impact-statement,.impact-stats>div', { y: 45, opacity: 0, stagger: .13, duration: .8, scrollTrigger: { trigger: '.impact-strip', start: 'top 72%' } });
  document.querySelectorAll('[data-count]:not(.trust-stats [data-count])').forEach(el => { const target = +el.dataset.count; ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to({ val: 0 }, { val: target, duration: 1.7, ease: 'power2.out', onUpdate() { el.textContent = Math.floor(this.targets()[0].val).toLocaleString(); } }) }); });
  /* The Food Rescue journey is deliberately one pinned, changing scene instead of a conventional timeline. */
  const storyTitle = document.querySelector('.story-title');
  if (storyTitle && window.SplitType) {
    const storySplit = splitHeading(storyTitle);
    gsap.from(storySplit.chars, { yPercent: 110, opacity: 0, stagger: .014, duration: .62, ease: 'power3.out', scrollTrigger: { trigger: '.story-intro', start: 'top 76%' } });
  }
  const story = document.querySelector('.story');
  const scenes = gsap.utils.toArray('.story-scene');
  const storyProgress = document.querySelector('.story-progress i');
  const storyNumbers = gsap.utils.toArray('.story-progress b');
  const animateScene = scene => {
    const tl = gsap.timeline();
    const visual = scene.querySelector('.scene-visual, .impact-bento');
    tl.from(scene.querySelector('.scene-copy, .impact-scene-copy'), { x: -38, opacity: 0, duration: .42, ease: 'power2.out' });
    if (visual) tl.from(visual, { y: 34, scale: .94, opacity: 0, duration: .48, ease: 'power3.out' }, '<.05');
    if (scene.classList.contains('scene-restaurant')) tl.from(scene.querySelectorAll('.fresh-alert,.food-item,.dash-panel'), { y: 24, opacity: 0, stagger: .1, duration: .35 }, '-=.17');
    if (scene.classList.contains('scene-verify')) tl.from('.verify-shield,.verified-card,.quality-meter', { scale: .55, opacity: 0, stagger: .12, duration: .38, ease: 'back.out(1.8)' }, '-=.12');
    if (scene.classList.contains('scene-pickup')) tl.from('.phone,.eta-card', { x: -28, opacity: 0, stagger: .12, duration: .4 }, '-=.2');
    if (scene.classList.contains('scene-delivery')) tl.from('.success-burst,.delivered-card,.confetti', { scale: .5, opacity: 0, stagger: .08, duration: .35, ease: 'back.out(1.7)' }, '-=.12');
    if (scene.classList.contains('scene-impact')) tl.from('.impact-number', { y: 27, opacity: 0, stagger: .08, duration: .36 }, '-=.18');
    return tl;
  };
  if (story && scenes.length && matchMedia('(min-width: 1001px)').matches && !story.classList.contains('story-flow')) {
    gsap.set(scenes, { autoAlpha: 0 });
    gsap.set(scenes[0], { autoAlpha: 1 });
    const storyTl = gsap.timeline({ scrollTrigger: { trigger: story, start: 'top top', end: 'bottom bottom', scrub: .8, invalidateOnRefresh: true } });
    scenes.forEach((scene, index) => {
      const position = index === 0 ? 0 : index;
      if (index) storyTl.to(scenes[index - 1], { autoAlpha: 0, duration: .34 }, position - .14).to(scene, { autoAlpha: 1, duration: .34 }, position - .1);
      storyTl.add(animateScene(scene), position);
      storyTl.to(storyProgress, { height: `${(index + 1) * 19}px`, duration: .25 }, position);
      storyTl.to(storyNumbers, { color: '#8a8a82', duration: .01 }, position).to(storyNumbers[index], { color: '#ed6a00', duration: .01 }, position);
    });
  } else if (scenes.length) {
    scenes.forEach(scene => ScrollTrigger.create({ trigger: scene, start: 'top 72%', once: true, onEnter: () => animateScene(scene) }));
  }
  gsap.to('.steam', { y: -22, opacity: 0, stagger: .22, duration: 1.8, repeat: -1, ease: 'sine.out' });
  gsap.to('.pulse-dot', { scale: 1.7, opacity: .18, duration: 1.1, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to('.scan-line', { y: -86, duration: 2.1, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to('.verify-ring', { scale: 1.12, opacity: .15, duration: 1.8, repeat: -1, yoyo: true, stagger: .22, ease: 'sine.inOut' });
  gsap.to('.map-ripple', { scale: 1.8, opacity: 0, duration: 1.5, repeat: -1, ease: 'power1.out' });
  gsap.to('.scooter', { x: 88, y: -45, duration: 2.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to('.success-burst', { scale: 1.08, duration: 1.25, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to('.confetti', { y: -19, rotation: 95, stagger: .12, duration: 1.7, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  document.querySelectorAll('.story-scene').forEach(scene => {
    const visual = scene.querySelector('.scene-visual');
    visual?.addEventListener('mouseenter', () => {
      if (scene.classList.contains('scene-restaurant')) gsap.to(scene.querySelectorAll('.food-item'), { scale: 1.08, x: 8, stagger: .08, duration: .25 });
      if (scene.classList.contains('scene-pickup')) gsap.to('.map-card', { boxShadow: '0 0 0 12px rgba(150,180,58,.16)', duration: .3 });
      if (scene.classList.contains('scene-delivery')) gsap.fromTo('.success-burst', { scale: .8 }, { scale: 1.22, duration: .45, ease: 'back.out(2)' });
    });
    visual?.addEventListener('mouseleave', () => {
      if (scene.classList.contains('scene-restaurant')) gsap.to(scene.querySelectorAll('.food-item'), { scale: 1, x: 0, duration: .25 });
      if (scene.classList.contains('scene-pickup')) gsap.to('.map-card', { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.7)', duration: .3 });
    });
  });
  /* Live Impact dashboard: map data, ambient motion and entry transitions. */
  const liveImpact = document.querySelector('.live-impact');
  const cityTooltip = document.querySelector('.city-tooltip');
  const mapCities = document.querySelectorAll('.map-city');
  const updateCity = city => {
    if (!cityTooltip) return;
    mapCities.forEach(item => item.classList.toggle('active', item === city));
    cityTooltip.querySelector('.tooltip-city').textContent = city.dataset.city;
    cityTooltip.querySelector('strong b').textContent = city.dataset.meals;
    const tooltipStats = cityTooltip.querySelectorAll('div b');
    [city.dataset.restaurants, city.dataset.ngos].forEach((value, index) => { if (tooltipStats[index]) tooltipStats[index].textContent = value; });
    gsap.fromTo(cityTooltip, { y: 8, opacity: .25 }, { y: 0, opacity: 1, duration: .28, ease: 'power2.out', overwrite: true });
  };
  mapCities.forEach(city => { ['mouseenter', 'focus'].forEach(event => city.addEventListener(event, () => updateCity(city))); });
  if (liveImpact) {
    gsap.from('.impact-dashboard-heading', { y: 45, opacity: 0, duration: .8, scrollTrigger: { trigger: liveImpact, start: 'top 74%' } });
    gsap.from('.dashboard-shell > .bento-card', { y: 35, opacity: 0, stagger: .065, duration: .55, ease: 'power2.out', scrollTrigger: { trigger: '.dashboard-shell', start: 'top 75%' } });
    gsap.to('.donut-progress', { strokeDashoffset: 52, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: '.food-saved-card', start: 'top 82%' } });
    gsap.to('.map-route', { strokeDashoffset: -85, duration: 3.4, repeat: -1, ease: 'none', stagger: .25 });
    gsap.to('.orbit-orb', { rotation: 360, duration: 12, repeat: -1, ease: 'none' });
    gsap.to('.co2-leaf', { y: -9, rotation: -14, duration: 2.3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.stopwatch', { rotate: 360, duration: 14, repeat: -1, ease: 'none' });
    gsap.to('.movement-wave', { scale: 1.08, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: .5 });
    gsap.to('.movement-leaf', { y: -18, rotation: '+=30', duration: 3.2, repeat: -1, yoyo: true, stagger: .45, ease: 'sine.inOut' });
    gsap.from('.impact-movement h2,.impact-movement>p,.movement-actions', { y: 28, opacity: 0, stagger: .12, duration: .65, scrollTrigger: { trigger: '.impact-movement', start: 'top 72%' } });
  }

  const storiesSection = document.querySelector('.success-stories');
  if (storiesSection) {
    const storiesTitle = document.querySelector('.stories-title');
    if (storiesTitle && window.SplitType) {
      const storiesSplit = splitHeading(storiesTitle);
      gsap.from(storiesSplit.chars, { yPercent: 112, opacity: 0, stagger: .014, duration: .63, ease: 'power3.out', scrollTrigger: { trigger: storiesSection, start: 'top 77%' } });
    }
    gsap.from('.featured-story,.story-river', { y: 45, opacity: 0, stagger: .16, duration: .78, ease: 'power3.out', scrollTrigger: { trigger: '.stories-stage', start: 'top 75%' } });
    gsap.from('.video-surface,.video-caption', { y: 38, opacity: 0, stagger: .15, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '.video-story', start: 'top 75%' } });
    gsap.from('.gallery-tile', { y: 34, scale: .96, opacity: 0, stagger: .09, duration: .6, ease: 'power2.out', scrollTrigger: { trigger: '.impact-gallery', start: 'top 76%' } });
    gsap.from('.stories-cta h3,.stories-cta .eyebrow,.stories-cta>div', { y: 25, opacity: 0, stagger: .1, duration: .6, scrollTrigger: { trigger: '.stories-cta', start: 'top 76%' } });
    gsap.to('.featured-impact', { y: -7, duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }
  const faqSection = document.querySelector('.faq-section');
  if (faqSection) {
    const faqTitle = document.querySelector('.faq-heading h2');
    if (faqTitle && window.SplitType) {
      const faqSplit = splitHeading(faqTitle);
      gsap.from(faqSplit.chars, { yPercent: 110, opacity: 0, stagger: .014, duration: .62, ease: 'power3.out', scrollTrigger: { trigger: faqSection, start: 'top 77%' } });
    }
    gsap.from('.faq-art,.faq-accordion', { y: 43, opacity: 0, stagger: .16, duration: .75, ease: 'power3.out', scrollTrigger: { trigger: '.faq-layout', start: 'top 75%' } });
    gsap.from('.faq-item', { x: 22, opacity: 0, stagger: .06, duration: .42, ease: 'power2.out', scrollTrigger: { trigger: '.faq-accordion', start: 'top 78%' } });
    gsap.to('.question-orbit', { rotation: 360, duration: 38, repeat: -1, ease: 'none' });
    gsap.to('.faq-help-card.help-one', { y: -10, duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.faq-help-card.help-two', { y: 9, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }
  const finalCta = document.querySelector('.final-cta');
  if (finalCta) {
    gsap.from('.final-cta h2,.final-cta>p,.final-cta .cta-actions', { y: 32, opacity: 0, stagger: .12, duration: .68, scrollTrigger: { trigger: finalCta, start: 'top 73%' } });
    gsap.to('.cta-particle', { y: -21, x: 8, stagger: .35, duration: 3.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.final-cta .cta-leaf', { y: -15, rotation: '+=25', stagger: .3, duration: 3.3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }
  const footer = document.querySelector('.site-footer');
  if (footer) {
    gsap.from('.footer-grid > *', { y: 28, opacity: 0, stagger: .1, duration: .62, ease: 'power2.out', scrollTrigger: { trigger: footer, start: 'top 82%' } });
    gsap.to('.back-to-top', { rotation: 360, scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 } });
  }
  const activityList = document.querySelector('.activity-list');
  const donationImages = [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=180&q=80&fm=webp',
    'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=180&q=80&fm=webp',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=180&q=80&fm=webp',
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=180&q=80&fm=webp'
  ];
  activityList?.querySelectorAll('.activity-item.initial').forEach((item, index) => {
    item.insertAdjacentHTML('afterbegin', `<img src="${donationImages[index]}" width="112" height="112" loading="lazy" alt="Freshly donated food" />`);
    item.querySelector('p')?.insertAdjacentHTML('afterbegin', '<span class="donation-status">Awaiting NGO partner</span>');
  });
  /* Donation categories: introductory split reveal, physical card depth and subtle micro-scenes. */
  const categorySection = document.querySelector('.donation-categories');
  const categoryTitle = document.querySelector('.categories-title');
  if (categoryTitle && window.SplitType) {
    const categorySplit = splitHeading(categoryTitle);
    gsap.from(categorySplit.chars, { yPercent: 105, opacity: 0, stagger: .013, duration: .6, ease: 'power3.out', scrollTrigger: { trigger: categorySection, start: 'top 77%' } });
  }
  if (categorySection) {
    gsap.from('.category-card', { y: 48, scale: .95, opacity: 0, stagger: .09, duration: .68, ease: 'power3.out', scrollTrigger: { trigger: '.category-grid', start: 'top 78%' } });
    gsap.to('.cat-blob-one', { rotation: 30, y: 30, duration: 16, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.flour', { y: -21, x: 7, opacity: 0, stagger: .23, duration: 1.8, repeat: -1, ease: 'sine.out' });
    gsap.from('.category-cta', { y: 35, opacity: 0, duration: .65, scrollTrigger: { trigger: '.category-cta', start: 'top 83%' } });
  }
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (!matchMedia('(pointer:fine)').matches) return;
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      gsap.to(card, { rotateY: x * 8, rotateX: y * -7, transformPerspective: 900, duration: .45, ease: 'power2.out', overwrite: 'auto' });
      const content = card.querySelector('.category-content');
      const badge = card.querySelector('.category-badge');
      if (content) gsap.to(content, { x: x * 8, y: y * 5 - 7, duration: .45, overwrite: 'auto' });
      if (badge) gsap.to(badge, { x: x * 5, rotation: x * 8, duration: .45, overwrite: 'auto' });
    });
    card.addEventListener('pointerleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: .65, ease: 'elastic.out(1,.45)' });
      const content = card.querySelector('.category-content');
      const badge = card.querySelector('.category-badge');
      if (content) gsap.to(content, { x: 0, y: 0, duration: .4 });
      if (badge) gsap.to(badge, { x: 0, rotation: 0, duration: .4 });
    });
    card.addEventListener('click', () => {
      const ripple = document.createElement('span');
      ripple.className = 'category-ripple';
      card.append(ripple);
      gsap.fromTo(ripple, { scale: 0, opacity: .45 }, { scale: 8, opacity: 0, duration: .65, ease: 'power2.out', onComplete: () => ripple.remove() });
    });
  });
  gsap.from('.network-copy,.network-scene', { y: 45, opacity: 0, stagger: .2, duration: .8, scrollTrigger: { trigger: '.network', start: 'top 72%' } });
  gsap.to('.globe', { rotation: 360, duration: 70, repeat: -1, ease: 'none' });
  gsap.from('.donate-cta h2,.donate-cta>p,.cta-actions', { y: 35, opacity: 0, stagger: .12, duration: .7, scrollTrigger: { trigger: '.donate-cta', start: 'top 70%' } });
  const art = document.querySelector('.hero-art');
  art?.addEventListener('pointermove', e => { const r = art.getBoundingClientRect(); gsap.to('.food-stage', { x: (e.clientX-r.left-r.width/2)*.025, duration: .7, overwrite: 'auto' }); });
  art?.addEventListener('pointerleave', () => gsap.to('.food-stage', { x: 0, duration: .7 }));
});
