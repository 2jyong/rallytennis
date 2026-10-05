const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('.site-header');
const meter = document.querySelector('.scroll-meter');
const hero = document.querySelector('.hero');
const heroVideo = document.querySelector('.hero-video');
heroVideo.src = 'assets/hero.mp4';
if (reduceMotion.matches) { heroVideo.pause(); heroVideo.removeAttribute('autoplay'); }
else { heroVideo.play().catch(() => {}); }

let ticking = false;
function updateScroll() {
  const scroll = window.scrollY;
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  meter.style.width = `${(scroll / max) * 100}%`;
  header.classList.toggle('is-scrolled', scroll > 32);
  if (!reduceMotion.matches) {
    const progress = Math.min(1, Math.max(0, scroll / Math.max(1, hero.offsetHeight)));
    hero.style.setProperty('--hero-scale', (1.04 + progress * .12).toFixed(3));
    hero.style.setProperty('--ball-y', `${44 + progress * 44}%`);
  }
  ticking = false;
}
window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateScroll); ticking = true; } }, { passive: true });
updateScroll();

const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', '메뉴 열기');
  mobileMenu.classList.remove('open');
  mobileMenu.inert = true;
  document.body.style.overflow = '';
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  mobileMenu.classList.toggle('open', open);
  mobileMenu.inert = !open;
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) mobileMenu.querySelector('a').focus();
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
window.addEventListener('resize', () => { if (window.innerWidth > 800) closeMenu(); });

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); } });
}, { threshold: .12, rootMargin: '0px 0px -25px 0px' });
document.querySelectorAll('.reveal,.court-diagram,.image-break').forEach(el => observer.observe(el));

const programs = [
  { image: 'assets/action.jpg', position: 'center 46%', text: '그립과 스텝부터 익히며, 공을 주고받는 즐거움을 만납니다.' },
  { image: 'assets/hero.jpg', position: 'center 48%', text: '움직임과 타점을 세밀하게 살피며, 나에게 필요한 한 가지를 집중해서 바꿉니다.' },
  { image: 'assets/coach.jpg', position: 'center 48%', text: '함께 주고받는 랠리 속에서 리듬과 코트 감각을 익힙니다.' },
  { image: 'assets/court.jpg', position: 'center 50%', text: '작은 성공을 차곡차곡 쌓으며, 스스로 공을 읽고 움직이는 습관을 만듭니다.' },
  { image: 'assets/action.jpg', position: 'center 35%', text: '타구 하나보다 다음 선택에 집중하며, 실제 경기의 흐름을 연습합니다.' }
];
const tabs = [...document.querySelectorAll('.program-tab')];
const panel = document.querySelector('.program-panel');
const programImage = panel.querySelector('.program-image');
const programText = panel.querySelector('.program-info p');
const programKicker = panel.querySelector('.program-kicker');
const inquirySelect = document.querySelector('#contact-program');
let currentProgram = 0;
function selectProgram(index, focus = false) {
  if (index === currentProgram) return;
  currentProgram = index;
  tabs.forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
  });
  panel.classList.add('changing');
  window.setTimeout(() => {
    const data = programs[index];
    programImage.style.backgroundImage = `linear-gradient(0deg,rgba(7,20,12,.85),rgba(7,20,12,.05) 58%),url('${data.image}')`;
    programImage.style.backgroundPosition = data.position;
    programText.textContent = data.text;
    programKicker.textContent = `PROGRAM ${String(index + 1).padStart(2, '0')} / 05`;
    panel.setAttribute('aria-labelledby', tabs[index].id);
    panel.classList.remove('changing');
  }, reduceMotion.matches ? 0 : 170);
  if (focus) tabs[index].focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectProgram(index));
  tab.addEventListener('keydown', e => {
    let next = index;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault(); selectProgram(next, true);
  });
});
panel.querySelector('a').addEventListener('click', () => { inquirySelect.selectedIndex = currentProgram; });

const stageSteps = [...document.querySelectorAll('.stage-step')];
const stageCourt = document.querySelector('.stage-court');
const stagePositions = [ ['16%', '68%', '10%'], ['45%', '36%', '39%'], ['76%', '18%', '72%'] ];
function activateStage(index) {
  stageSteps.forEach((step, i) => step.classList.toggle('active', i === index));
  stageCourt.style.setProperty('--stage-ball-x', stagePositions[index][0]);
  stageCourt.style.setProperty('--stage-ball-y', stagePositions[index][1]);
  stageCourt.style.setProperty('--stage-trail-width', stagePositions[index][2]);
}
const stageObserver = new IntersectionObserver(entries => {
  const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible) activateStage(Number(visible.target.dataset.stage));
}, { rootMargin: '-22% 0px -32% 0px', threshold: [0,.25,.5,.75] });
stageSteps.forEach(el => stageObserver.observe(el));

const spaceTrack = document.querySelector('.space-track');
function moveGallery(direction) {
  const card = spaceTrack.querySelector('.space-item');
  spaceTrack.scrollBy({ left: direction * (card.getBoundingClientRect().width + 18), behavior: reduceMotion.matches ? 'instant' : 'smooth' });
}
document.querySelector('.space-prev').addEventListener('click', () => moveGallery(-1));
document.querySelector('.space-next').addEventListener('click', () => moveGallery(1));

document.querySelector('#copy-inquiry').addEventListener('click', async () => {
  const message = `안녕하세요. RALLY 테니스 아카데미 레슨에 관심이 있습니다.\n관심 레슨: ${inquirySelect.value}\n현재 경험: ${document.querySelector('#contact-level').value}\n상담 가능 여부를 알려주세요.`;
  const feedback = document.querySelector('.contact-feedback');
  try { await navigator.clipboard.writeText(message); feedback.textContent = '문의 내용을 복사했습니다.'; }
  catch { feedback.textContent = '복사가 차단되었습니다. 브라우저 권한을 확인해주세요.'; }
});
