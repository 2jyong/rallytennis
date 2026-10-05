const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const root = document.documentElement;
const legacySections = { coaching: 'about', team: 'proof', program: 'lessons', space: 'difference', contact: 'info', 'contact-program': 'info', 'contact-level': 'info' };
const legacyDestination = legacySections[location.hash.slice(1)];
if (legacyDestination) history.replaceState(null, '', `#${legacyDestination}`);
function visitLegacySection() {
  if (legacyDestination) document.getElementById(legacyDestination).scrollIntoView({ behavior: 'instant' });
}
window.addEventListener('hashchange', () => {
  const destination = legacySections[location.hash.slice(1)];
  if (!destination) return;
  history.replaceState(null, '', `#${destination}`);
  document.getElementById(destination).scrollIntoView({ behavior: 'instant' });
});

// Show the opening on each page visit. The logo dismisses it immediately.
const intro = document.querySelector('#site-intro');
let introStarted = false;
let introRemaining = reduceMotion.matches ? 1800 : 6200;
let introVisibleSince = 0;
let introTimer;
function finishIntro() {
  if (root.classList.contains('intro-seen')) return;
  clearTimeout(introTimer);
  root.classList.add('intro-seen');
  document.body.classList.remove('intro-active', 'intro-playing', 'intro-paused');
  intro.setAttribute('aria-hidden', 'true');
  visitLegacySection();
}
function resumeIntro() {
  if (root.classList.contains('intro-seen') || document.readyState !== 'complete' || document.visibilityState !== 'visible' || introVisibleSince) return;
  if (!introStarted && !reduceMotion.matches) {
    document.body.classList.add('intro-playing');
    introStarted = true;
  }
  document.body.classList.remove('intro-paused');
  introVisibleSince = performance.now();
  introTimer = window.setTimeout(finishIntro, introRemaining);
}
function pauseIntro() {
  if (!introVisibleSince || root.classList.contains('intro-seen')) return;
  introRemaining = Math.max(0, introRemaining - (performance.now() - introVisibleSince));
  introVisibleSince = 0;
  clearTimeout(introTimer);
  document.body.classList.add('intro-paused');
}
function scheduleIntro() {
  requestAnimationFrame(() => requestAnimationFrame(resumeIntro));
}
document.body.classList.add('intro-active');
intro.addEventListener('animationend', event => {
  if (event.animationName === 'introGone') finishIntro();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (introStarted) scheduleIntro();
    else window.setTimeout(scheduleIntro, 500);
  }
  else pauseIntro();
});
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  root.classList.remove('intro-seen');
  intro.removeAttribute('aria-hidden');
  document.body.classList.remove('intro-playing', 'intro-paused');
  document.body.classList.add('intro-active');
  introStarted = false;
  introVisibleSince = 0;
  introRemaining = reduceMotion.matches ? 1800 : 6200;
  scheduleIntro();
});
if (document.readyState === 'complete') window.setTimeout(scheduleIntro, 500);
else window.addEventListener('load', () => window.setTimeout(scheduleIntro, 500), { once: true });
document.querySelector('#intro-skip').addEventListener('click', finishIntro);

const header = document.querySelector('.site-header');
const meter = document.querySelector('.scroll-meter');
const hero = document.querySelector('.hero');
const heroVideo = document.querySelector('.hero-video');
if (reduceMotion.matches) {
  heroVideo.pause();
  heroVideo.removeAttribute('autoplay');
} else {
  heroVideo.play().catch(() => {});
}

const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', '메뉴 열기');
  mobileMenu.classList.remove('open');
  mobileMenu.inert = true;
  document.body.classList.remove('menu-open');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  mobileMenu.classList.toggle('open', open);
  mobileMenu.inert = !open;
  document.body.classList.toggle('menu-open', open);
  if (open) mobileMenu.querySelector('a').focus();
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});
window.addEventListener('resize', () => { if (innerWidth > 850) closeMenu(); });

// Scroll work is tied only to section positions, never to pointer position.
const aboutJourney = document.querySelector('#about-journey');
const aboutPath = document.querySelector('#about-path');
const aboutBall = document.querySelector('#about-ball');
const aboutSteps = [...document.querySelectorAll('.about-step')];
const aboutWords = ['READ', 'MOVE', 'PLAY'];
const aboutLength = aboutPath.getTotalLength();
aboutPath.style.strokeDasharray = String(aboutLength);
aboutPath.style.strokeDashoffset = String(aboutLength);
const differenceJourney = document.querySelector('#difference-journey');
const differenceSteps = [...document.querySelectorAll('.difference-step')];
const differenceVisual = document.querySelector('.difference-visual');
const differencePhoto = document.querySelector('.difference-visual-photo');
const differenceScenes = [
  { image: 'assets/coach.jpg', number: '01', verb: 'WATCH', x: '62%', y: '42%' },
  { image: 'assets/action.jpg', number: '02', verb: 'ADJUST', x: '43%', y: '49%' },
  { image: 'assets/court.jpg', number: '03', verb: 'REPEAT', x: '68%', y: '38%' }
];
let activeDifference = -1;
function updateDifference(index) {
  if (index === activeDifference) return;
  activeDifference = index;
  const scene = differenceScenes[index];
  differenceSteps.forEach((step, position) => step.classList.toggle('active', position === index));
  differenceVisual.style.setProperty('--cross-x', scene.x);
  differenceVisual.style.setProperty('--cross-y', scene.y);
  differencePhoto.style.backgroundImage = `url('${scene.image}')`;
  document.querySelector('#difference-number').textContent = scene.number;
  document.querySelector('#difference-verb').textContent = scene.verb;
}
function closestStep(steps, targetY) {
  let selected = 0;
  let closest = Infinity;
  steps.forEach((step, index) => {
    const rect = step.getBoundingClientRect();
    const distance = Math.abs(rect.top + rect.height / 2 - targetY);
    if (distance < closest) { closest = distance; selected = index; }
  });
  return selected;
}
function updateScroll() {
  const scroll = scrollY;
  const viewport = innerHeight;
  const max = Math.max(1, root.scrollHeight - viewport);
  meter.style.width = `${scroll / max * 100}%`;
  header.classList.toggle('scrolled', scroll > 32);

  if (!reduceMotion.matches) {
    const heroProgress = clamp(scroll / Math.max(1, hero.offsetHeight));
    hero.style.setProperty('--hero-scale', (1.03 + heroProgress * .13).toFixed(3));
    hero.style.setProperty('--hero-ball', `${43 + heroProgress * 44}%`);
    const exit = document.querySelector('.about-exit').getBoundingClientRect();
    const exitProgress = clamp((viewport - exit.top) / (viewport + exit.height));
    document.querySelector('.about-exit').style.setProperty('--exit-scale', (1.12 - exitProgress * .12).toFixed(3));
  }

  const aboutRect = aboutJourney.getBoundingClientRect();
  const aboutProgress = clamp((viewport * .62 - aboutRect.top) / Math.max(1, aboutRect.height - viewport * .2));
  aboutPath.style.strokeDashoffset = String(aboutLength * (1 - aboutProgress));
  const point = aboutPath.getPointAtLength(aboutLength * aboutProgress);
  aboutBall.setAttribute('cx', point.x.toFixed(1));
  aboutBall.setAttribute('cy', point.y.toFixed(1));
  document.querySelector('.about-stage').style.setProperty('--about-progress', `${(aboutProgress * 100).toFixed(1)}%`);
  const aboutIndex = closestStep(aboutSteps, viewport * .58);
  aboutSteps.forEach((step, index) => step.classList.toggle('active', index === aboutIndex));
  document.querySelector('#about-index').textContent = String(aboutIndex + 1).padStart(2, '0');
  document.querySelector('#about-stage-word').textContent = aboutWords[aboutIndex];

  const differenceRect = differenceJourney.getBoundingClientRect();
  if (differenceRect.bottom > 0 && differenceRect.top < viewport) {
    updateDifference(closestStep(differenceSteps, viewport * .55));
    if (!reduceMotion.matches) {
      const progress = clamp((viewport - differenceRect.top) / (viewport + differenceRect.height));
      differenceVisual.style.setProperty('--difference-scale', (1.13 - progress * .12).toFixed(3));
    }
  }
  ticking = false;
}
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
window.addEventListener('resize', updateScroll);
updateScroll();
updateDifference(0);

const chapterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('entered');
      chapterObserver.unobserve(entry.target);
    }
  });
}, { threshold: .08, rootMargin: '0px 0px -12% 0px' });
document.querySelectorAll('.chapter:not(.hero)').forEach(chapter => chapterObserver.observe(chapter));

const countObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    countObserver.unobserve(entry.target);
    if (reduceMotion.matches) return;
    const value = Number(entry.target.dataset.count);
    const start = Number(entry.target.dataset.start || 0);
    const suffix = entry.target.dataset.suffix || '';
    const begin = performance.now();
    function frame(now) {
      const progress = clamp((now - begin) / 1050);
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.round(start + (value - start) * eased);
      entry.target.textContent = (entry.target.dataset.start ? String(current) : current.toLocaleString('ko-KR')) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}, { threshold: .6 });
document.querySelectorAll('[data-count]').forEach(metric => countObserver.observe(metric));

// Every name, portrait and biography below is fictional; the credential types exist in Korea.
const coaches = [
  { name: '김서진', role: 'HEAD COACH', focus: '타점과 풋워크', years: '12년', license: '1급 생활스포츠지도사 (테니스)', image: 'assets/coach-01.webp' },
  { name: '박도윤', role: 'PERFORMANCE COACH', focus: '서브와 경기 운영', years: '10년', license: '2급 전문스포츠지도사 (테니스)', image: 'assets/coach-02.webp' },
  { name: '이하린', role: 'JUNIOR COACH', focus: '주니어 기본기', years: '8년', license: '유소년스포츠지도사 (테니스)', image: 'assets/coach-03.webp' },
  { name: '정민재', role: 'RALLY COACH', focus: '랠리 리듬', years: '9년', license: '2급 생활스포츠지도사 (테니스)', image: 'assets/coach-04.webp' },
  { name: '최유나', role: 'TECHNIQUE COACH', focus: '스트로크와 스텝', years: '7년', license: '2급 생활스포츠지도사 (테니스)', image: 'assets/coach-05.webp' },
  { name: '한태오', role: 'MATCH COACH', focus: '경기 상황 훈련', years: '11년', license: '2급 전문스포츠지도사 (테니스)', image: 'assets/coach-06.webp' },
  { name: '오지후', role: 'BEGINNER COACH', focus: '입문자 랠리', years: '6년', license: '2급 생활스포츠지도사 (테니스)', image: 'assets/coach-07.webp' },
  { name: '윤가은', role: 'MOVEMENT COACH', focus: '움직임과 밸런스', years: '8년', license: '유소년스포츠지도사 (테니스)', image: 'assets/coach-08.webp' }
];
const coachRail = document.querySelector('#coach-rail');
coachRail.innerHTML = coaches.map((coach, index) => `<button type="button" class="coach-card" data-coach="${index}" aria-label="${coach.name} 코치 프로필 보기"><img src="${coach.image}" alt="${coach.name} 코치 프로필 사진" loading="lazy" decoding="async"><div class="coach-card-copy"><span>${coach.role}</span><h4>${coach.name}</h4><p>${coach.focus}</p></div></button>`).join('');
const coachDialog = document.querySelector('#coach-dialog');
coachRail.addEventListener('click', event => {
  const card = event.target.closest('.coach-card');
  if (!card) return;
  const coach = coaches[Number(card.dataset.coach)];
  document.querySelector('#coach-dialog-image').src = coach.image;
  document.querySelector('#coach-dialog-image').alt = `${coach.name} 코치 프로필 사진`;
  document.querySelector('#coach-dialog-role').textContent = coach.role;
  document.querySelector('#coach-dialog-name').textContent = coach.name;
  document.querySelector('#coach-dialog-specialty').textContent = coach.focus;
  document.querySelector('#coach-dialog-years').textContent = coach.years;
  document.querySelector('#coach-dialog-license').innerHTML = `${coach.license.replace(' (테니스)', '')}<span class="license-sport"> (테니스)</span>`;
  coachDialog.showModal();
});
document.querySelector('#coach-dialog-close').addEventListener('click', () => coachDialog.close());
coachDialog.addEventListener('click', event => { if (event.target === coachDialog) coachDialog.close(); });
for (const [selector, direction] of [['#coach-prev', -1], ['#coach-next', 1]]) {
  document.querySelector(selector).addEventListener('click', () => {
    const card = coachRail.querySelector('.coach-card');
    coachRail.scrollBy({ left: direction * (card.getBoundingClientRect().width + 16), behavior: reduceMotion.matches ? 'instant' : 'smooth' });
  });
}

const lessons = [
  { name: '첫 랠리', copy: '그립과 스텝을 익히고, 코트에서 첫 랠리를 이어갑니다.', price: '₩160,000', image: 'assets/action.jpg', position: 'center 46%' },
  { name: '나만의 페이스', copy: '움직임과 타점을 세밀하게 살피며 지금 필요한 한 가지를 바꿉니다.', price: '₩320,000', image: 'assets/hero.jpg', position: 'center 48%' },
  { name: '함께 만드는 랠리', copy: '함께 공을 주고받으며 리듬과 코트 감각을 익힙니다.', price: '₩180,000', image: 'assets/coach.jpg', position: 'center 48%' },
  { name: '작은 시작, 큰 스윙', copy: '작은 성공을 쌓으며 스스로 공을 읽고 움직이는 습관을 만듭니다.', price: '₩190,000', image: 'assets/court.jpg', position: 'center 50%' },
  { name: '게임을 읽는 힘', copy: '타구 하나보다 다음 선택에 집중하며 실제 경기 흐름을 연습합니다.', price: '₩260,000', image: 'assets/action.jpg', position: 'center 35%' }
];
const lessonTabs = [...document.querySelectorAll('.lesson-tab')];
const lessonPanel = document.querySelector('#lesson-panel');
const lessonImage = document.querySelector('.lesson-panel-image');
const inquirySelect = document.querySelector('#inquiry-program');
let activeLesson = 0;
let changeTimer;
function selectLesson(index, focus = false) {
  if (index < 0 || index >= lessons.length) return;
  activeLesson = index;
  lessonTabs.forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
  });
  if (focus) lessonTabs[index].focus();
  lessonPanel.setAttribute('aria-labelledby', lessonTabs[index].id);
  lessonPanel.classList.add('changing');
  clearTimeout(changeTimer);
  changeTimer = setTimeout(() => {
    const lesson = lessons[index];
    lessonImage.style.backgroundImage = `linear-gradient(0deg,rgba(5,18,9,.92),rgba(5,18,9,.02) 70%),url('${lesson.image}')`;
    lessonImage.style.backgroundPosition = lesson.position;
    document.querySelector('#lesson-count').textContent = `PROGRAM ${String(index + 1).padStart(2, '0')} / 05`;
    document.querySelector('#lesson-title').textContent = lesson.name;
    document.querySelector('#lesson-copy').textContent = lesson.copy;
    document.querySelector('#lesson-price').textContent = lesson.price;
    lessonPanel.classList.remove('changing');
  }, reduceMotion.matches ? 0 : 140);
}
lessonTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectLesson(index));
  tab.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? lessons.length - 1 : (index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + lessons.length) % lessons.length;
    selectLesson(next, true);
  });
});
document.querySelector('#lesson-inquiry').addEventListener('click', () => { inquirySelect.selectedIndex = activeLesson; });

document.querySelector('#copy-inquiry').addEventListener('click', async () => {
  const program = inquirySelect.options[inquirySelect.selectedIndex].text;
  const message = `안녕하세요. RALLY 테니스 아카데미 ${program} 레슨(4주 · 주 1회)에 대해 문의합니다.`;
  const feedback = document.querySelector('#copy-feedback');
  try {
    await navigator.clipboard.writeText(message);
    feedback.textContent = '문의 문구를 복사했습니다.';
  } catch (_) {
    feedback.textContent = '복사가 제한되어 있습니다. 문의 문구를 직접 선택해 주세요.';
    feedback.textContent += ` ${message}`;
  }
});
