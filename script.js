/* ════════════════════════════════════════════════════
   AI PORTFOLIO — INTERACTIVE ENGINE
   ════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ──────────────────────────────────────────────
  // 1. 3D STAR FIELD CANVAS
  // ──────────────────────────────────────────────
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  let animFrame;

  // Vanishing point (smoothly lerps toward mouse)
  let vpX = window.innerWidth / 2;
  let vpY = window.innerHeight / 2;
  let targetVpX = vpX;
  let targetVpY = vpY;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    vpX = targetVpX = canvas.width / 2;
    vpY = targetVpY = canvas.height / 2;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ── Star settings ──
  const NUM_STARS = 280;
  const DEPTH = 1000;
  const STAR_SPEED = 2.8;

  const STAR_COLORS = [
    '99,102,241',   // indigo
    '139,92,246',   // violet
    '6,182,212',    // cyan
    '168,85,247',   // purple
    '120,160,255',  // blue
  ];

  function resetStar(s, spread) {
    s.x = (Math.random() - 0.5) * DEPTH * 2;
    s.y = (Math.random() - 0.5) * DEPTH * 2;
    s.z = spread ? Math.random() * DEPTH : DEPTH;
    s.pz = s.z;
    s.color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
    return s;
  }

  const stars = Array.from({ length: NUM_STARS }, () => resetStar({}, true));

  function animateCanvas() {
    const W = canvas.width;
    const H = canvas.height;

    // Smooth vanishing point
    vpX += (targetVpX - vpX) * 0.055;
    vpY += (targetVpY - vpY) * 0.055;

    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
      s.pz = s.z;
      s.z -= STAR_SPEED;

      if (s.z <= 1) { resetStar(s, false); continue; }

      // Perspective project current position
      const sc = DEPTH / s.z;
      const sx = s.x * sc + vpX;
      const sy = s.y * sc + vpY;

      // Perspective project previous position (for trail)
      const psc = DEPTH / s.pz;
      const px = s.x * psc + vpX;
      const py = s.y * psc + vpY;

      // Cull off-screen
      if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) {
        resetStar(s, false); continue;
      }

      const opacity = Math.min(0.9, (1 - s.z / DEPTH) * 0.9 + 0.1);
      const radius = Math.max(0.3, sc * 1.4);

      // Trail line
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = `rgba(${s.color},${(opacity * 0.5).toFixed(2)})`;
      ctx.lineWidth = radius * 0.55;
      ctx.stroke();

      // Star dot
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.color},${opacity.toFixed(2)})`;
      ctx.fill();
    }

    animFrame = requestAnimationFrame(animateCanvas);
  }
  animateCanvas();

  // Cursor → shift vanishing point so stars steer toward mouse
  document.addEventListener('mousemove', (e) => {
    // Blend: 70% cursor, 30% center — so field tilts but stays readable
    targetVpX = e.clientX * 0.7 + canvas.width * 0.15;
    targetVpY = e.clientY * 0.7 + canvas.height * 0.15;

    // Subtle hero parallax
    const hero = document.querySelector('.hero-content');
    if (hero) {
      const cx = (e.clientX / window.innerWidth - 0.5) * 2;
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      hero.style.transform = `translate(${cx * 6}px, ${cy * 4}px)`;
    }
  });

  document.addEventListener('mouseleave', () => {
    targetVpX = canvas.width / 2;
    targetVpY = canvas.height / 2;
  });




  // ──────────────────────────────────────────────
  // 2. SCROLL REVEAL (IntersectionObserver)
  // ──────────────────────────────────────────────
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          // Stagger children with delay
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, idx * 80);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealElements.forEach(el => revealObserver.observe(el));

  // ──────────────────────────────────────────────
  // 2b. REPEATABLE PRODUCT SECTION ANIMATIONS
  // ──────────────────────────────────────────────
  const productSections = document.querySelectorAll('.product-section');

  // Remove .reveal from product-section children (we use .in-view instead)
  productSections.forEach(section => {
    section.querySelectorAll('.reveal').forEach(el => {
      el.classList.remove('reveal');
      el.classList.add('visible'); // ensure they aren't hidden by the old system
    });
  });

  const productObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        } else {
          // Remove class so animation replays next scroll
          entry.target.classList.remove('in-view');
          // Reset glow-pulse animation by briefly removing/re-adding animation name
          const demoCard = entry.target.querySelector('.demo-card');
          if (demoCard) {
            demoCard.style.animation = 'none';
            // Force reflow then remove override so CSS takes over again on next entry
            void demoCard.offsetHeight;
            demoCard.style.animation = '';
          }
        }
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -60px 0px' }
  );
  productSections.forEach(section => productObserver.observe(section));


  // ──────────────────────────────────────────────
  // 3. NAVBAR SCROLL BEHAVIOR
  // ──────────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');

  function onScroll() {
    // Navbar background
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active section highlight
    let currentSection = '';
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight / 3) {
        currentSection = section.id;
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === currentSection);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ──────────────────────────────────────────────
  // 4. MOBILE MENU
  // ──────────────────────────────────────────────
  const navToggle = document.getElementById('navToggle');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    mobileOverlay.classList.toggle('open');
    document.body.style.overflow = mobileOverlay.classList.contains('open') ? 'hidden' : '';
  });
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      mobileOverlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ──────────────────────────────────────────────
  // 5. SMOOTH SCROLL
  // ──────────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ──────────────────────────────────────────────
  // 6. TYPING TEXT ANIMATION
  // ──────────────────────────────────────────────
  function typeText(element, text, speed = 25) {
    let i = 0;
    element.textContent = '';
    const cursor = element.nextElementSibling;
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else if (cursor) {
        cursor.style.display = 'none';
      }
    }
    type();
  }

  // Observe chat section to trigger typing
  const chatSection = document.getElementById('demo-chatbot');
  let chatTyped = false;
  const chatObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !chatTyped) {
        chatTyped = true;
        const typingEls = chatSection.querySelectorAll('.typing-text');
        typingEls.forEach((el, idx) => {
          setTimeout(() => {
            typeText(el, el.dataset.text, 20);
          }, idx * 2500);
        });
      }
    });
  }, { threshold: 0.3 });
  chatObserver.observe(chatSection);

  // ──────────────────────────────────────────────
  // 7. VOICE MIC BUTTON TOGGLE
  // ──────────────────────────────────────────────
  const micBtn = document.getElementById('micBtn');
  const voiceLabel = document.getElementById('voiceLabel');
  let micActive = false;

  micBtn.addEventListener('click', () => {
    micActive = !micActive;
    micBtn.classList.toggle('active', micActive);
    voiceLabel.textContent = micActive ? '● Analyzing Video...' : 'Tap to activate camera';
  });

  // ──────────────────────────────────────────────
  // 8. ANIMATED METRIC COUNTERS
  // ──────────────────────────────────────────────
  const metricNumbers = document.querySelectorAll('.metric-number');
  let metricsCounted = false;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const aboutSection = document.getElementById('about');
  const metricsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !metricsCounted) {
        metricsCounted = true;
        metricNumbers.forEach((el, i) => {
          setTimeout(() => animateCounter(el), i * 200);
        });
      }
    });
  }, { threshold: 0.3 });
  metricsObserver.observe(aboutSection);

  // ──────────────────────────────────────────────
  // 9. API TABS
  // ──────────────────────────────────────────────
  const apiTabs = document.querySelectorAll('.api-tab');
  const apiCode = document.getElementById('apiCode');

  const apiContents = {
    request: `<span class="code-bracket">{</span>
  <span class="code-key">"model"</span>: <span class="code-str">"gpt-4-turbo"</span>,
  <span class="code-key">"messages"</span>: <span class="code-bracket">[</span>
    <span class="code-bracket">{</span>
      <span class="code-key">"role"</span>: <span class="code-str">"user"</span>,
      <span class="code-key">"content"</span>: <span class="code-str">"Explain quantum computing"</span>
    <span class="code-bracket">}</span>
  <span class="code-bracket">]</span>,
  <span class="code-key">"stream"</span>: <span class="code-bool">true</span>,
  <span class="code-key">"temperature"</span>: <span class="code-num">0.7</span>
<span class="code-bracket">}</span>`,
    response: `<span class="code-bracket">{</span>
  <span class="code-key">"id"</span>: <span class="code-str">"chatcmpl-9x2k..."</span>,
  <span class="code-key">"object"</span>: <span class="code-str">"chat.completion"</span>,
  <span class="code-key">"choices"</span>: <span class="code-bracket">[</span>
    <span class="code-bracket">{</span>
      <span class="code-key">"message"</span>: <span class="code-bracket">{</span>
        <span class="code-key">"role"</span>: <span class="code-str">"assistant"</span>,
        <span class="code-key">"content"</span>: <span class="code-str">"Quantum computing uses..."</span>
      <span class="code-bracket">}</span>,
      <span class="code-key">"finish_reason"</span>: <span class="code-str">"stop"</span>
    <span class="code-bracket">}</span>
  <span class="code-bracket">]</span>,
  <span class="code-key">"usage"</span>: <span class="code-bracket">{</span> <span class="code-key">"tokens"</span>: <span class="code-num">347</span> <span class="code-bracket">}</span>
<span class="code-bracket">}</span>`,
    headers: `<span class="code-key">Authorization</span>: Bearer sk-...abc123
<span class="code-key">Content-Type</span>: application/json
<span class="code-key">X-Request-ID</span>: <span class="code-str">req_8f2a9c...</span>
<span class="code-key">X-RateLimit-Remaining</span>: <span class="code-num">4982</span>
<span class="code-key">X-Response-Time</span>: <span class="code-num">142ms</span>
<span class="code-key">Cache-Control</span>: no-store`
  };

  apiTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      apiTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      apiCode.innerHTML = apiContents[tab.dataset.tab] || '';
    });
  });

  // ──────────────────────────────────────────────
  // 10. PARALLAX SCROLL DEPTH
  // ──────────────────────────────────────────────
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  function parallaxScroll() {
    const scrollY = window.scrollY;
    parallaxEls.forEach(el => {
      const rate = parseFloat(el.dataset.parallax);
      el.style.transform = `translateY(${scrollY * rate}px)`;
    });
  }
  window.addEventListener('scroll', parallaxScroll, { passive: true });

  // ──────────────────────────────────────────────
  // 11. PREDICTION BAR ANIMATION ON SCROLL
  // ──────────────────────────────────────────────
  const visionSection = document.getElementById('demo-vision');
  let predsAnimated = false;
  const predObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !predsAnimated) {
        predsAnimated = true;
        const bars = visionSection.querySelectorAll('.pred-fill');
        bars.forEach((bar, i) => {
          bar.style.animationDelay = `${i * 0.2}s`;
        });
      }
    });
  }, { threshold: 0.4 });
  predObserver.observe(visionSection);

  // ──────────────────────────────────────────────
  // 12. IMAGE UPLOAD ZONE INTERACTION
  // ──────────────────────────────────────────────
  const uploadZone = document.getElementById('uploadZone');
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--accent-1)';
    uploadZone.style.background = 'rgba(99, 102, 241, 0.06)';
  });
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = '';
    uploadZone.style.background = '';
  });
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '';
    uploadZone.style.background = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        uploadZone.innerHTML = `<img src="${ev.target.result}" alt="Uploaded" style="max-height:120px;border-radius:8px;" />
          <p class="upload-text" style="margin-top:8px;font-size:0.8rem;color:var(--text-muted);">Image uploaded — running classification...</p>`;
      };
      reader.readAsDataURL(file);
    }
  });

  // ──────────────────────────────────────────────
  // 13. RENDER PROGRESS ANIMATION
  // ──────────────────────────────────────────────
  const renderPct = document.getElementById('renderPct');
  const renderFill = document.getElementById('renderFill');
  let renderVal = 60;
  let renderDir = 1;
  setInterval(() => {
    renderVal += renderDir * (Math.random() * 2 + 0.5);
    if (renderVal >= 92) renderDir = -1;
    if (renderVal <= 55) renderDir = 1;
    renderVal = Math.max(55, Math.min(92, renderVal));
    renderPct.textContent = Math.round(renderVal) + '%';
    renderFill.style.width = renderVal + '%';
  }, 800);

  // ──────────────────────────────────────────────
  // 14. AVATAR SUBTITLE CYCLING
  // ──────────────────────────────────────────────
  const subtitles = [
    '"Welcome to our AI systems lab. I can assist you with product demos and technical questions."',
    '"Our real-time inference pipeline processes requests in under 50 milliseconds."',
    '"I can demonstrate any of our six AI products — just let me know which one interests you."',
    '"All systems are running at full capacity with 99.9% uptime across all services."'
  ];
  const avatarSubtitles = document.getElementById('avatarSubtitles');
  let subIdx = 0;
  setInterval(() => {
    subIdx = (subIdx + 1) % subtitles.length;
    avatarSubtitles.style.opacity = '0';
    setTimeout(() => {
      avatarSubtitles.querySelector('p').textContent = subtitles[subIdx];
      avatarSubtitles.style.opacity = '1';
    }, 400);
  }, 5000);
  avatarSubtitles.style.transition = 'opacity 0.4s';

  // ──────────────────────────────────────────────
  // 15. PERFORMANCE: Cancel animation when not visible
  // ──────────────────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animFrame);
    } else {
      animateCanvas();
    }
  });
  // ──────────────────────────────────────────────
  // 16. 3D DEMO LAUNCHER
  // ──────────────────────────────────────────────
  const demoLoader = document.getElementById('demoLoader');
  const loaderProgress = document.getElementById('loaderProgress');
  const loaderSub = demoLoader.querySelector('.loader-sub');
  const loaderStatuses = [
    'Initializing AI systems…',
    'Loading model weights…',
    'Connecting to inference server…',
    'Preparing demo environment…',
    'Almost ready…'
  ];

  document.querySelectorAll('.demo-launch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = btn.dataset.demoUrl;
      if (!url) return;

      // Show loader
      demoLoader.classList.add('active');
      document.body.style.overflow = 'hidden';
      loaderProgress.style.width = '0%';

      // Animate progress bar
      let progress = 0;
      let statusIdx = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 12 + 3;
        if (progress > 95) progress = 95;
        loaderProgress.style.width = progress + '%';

        // Update status text
        const newIdx = Math.min(Math.floor(progress / 20), loaderStatuses.length - 1);
        if (newIdx !== statusIdx) {
          statusIdx = newIdx;
          loaderSub.style.opacity = '0';
          setTimeout(() => {
            loaderSub.textContent = loaderStatuses[statusIdx];
            loaderSub.style.opacity = '1';
          }, 200);
        }
      }, 200);

      // Complete and open URL
      setTimeout(() => {
        clearInterval(progressInterval);
        loaderProgress.style.width = '100%';
        loaderSub.style.opacity = '0';
        setTimeout(() => {
          loaderSub.textContent = 'Launching…';
          loaderSub.style.opacity = '1';
        }, 200);

        setTimeout(() => {
          window.open(url, '_blank');
          // Fade out loader
          setTimeout(() => {
            demoLoader.classList.remove('active');
            document.body.style.overflow = '';
            loaderProgress.style.width = '0%';
            loaderSub.textContent = loaderStatuses[0];
          }, 600);
        }, 500);
      }, 2500);
    });
  });

  // Add smooth transition to loader sub text
  if (loaderSub) loaderSub.style.transition = 'opacity 0.2s';


})();
