/**
 * GovIndiaNews - Core Vanilla JavaScript Engine
 * Provides Dark Mode, Navigation Drawer, Client Search, Safe AdSense Init, and Accessibility Traps.
 */

(function () {
  'use strict';

  // --- 0. CROSS-ORIGIN ERROR SAFETY WRAPPER ---
  try {
    window.addEventListener('error', function (event) {
      if (event && (event.message === 'Script error.' || !event.filename)) {
        if (event.preventDefault) {
          event.preventDefault();
        }
        return true;
      }
    }, true);
  } catch (e) {}

  // --- 1. DARK MODE ENGINE ---
  const THEME_KEY = 'govindianews_theme_pref';

  function getPreferredTheme() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === 'dark' || saved === 'light') {
          return saved;
        }
      }
    } catch (e) {}

    try {
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {}

    return 'light';
  }

  function applyTheme(theme) {
    try {
      if (document.documentElement) {
        document.documentElement.setAttribute('data-theme', theme);
      }
    } catch (e) {}

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_KEY, theme);
      }
    } catch (e) {}

    try {
      const themeToggleBtns = document.querySelectorAll('#theme-toggle-btn, .js-theme-toggle');
      themeToggleBtns.forEach((btn) => {
        btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        const icon = btn.querySelector('svg');
        if (icon) {
          if (theme === 'dark') {
            // Sun Icon for Dark Mode
            icon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
          } else {
            // Moon Icon for Light Mode
            icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
          }
        }
      });
    } catch (e) {}
  }

  // Initial Theme Application
  try {
    const initialTheme = getPreferredTheme();
    applyTheme(initialTheme);
  } catch (e) {}

  // --- 2. SAFE GOOGLE ADSENSE INITIALIZER ---
  function initAdSenseSafe() {
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      const host = (window.location && window.location.hostname) || '';
      const isProduction = host === 'www.govindianews.com' || host === 'govindianews.com';
      if (isProduction && !document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
        const adScript = document.createElement('script');
        adScript.async = true;
        adScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9246342607636743';
        adScript.crossOrigin = 'anonymous';
        document.head.appendChild(adScript);
      }
    } catch (e) {}
  }

  // --- 3. DOM LOADED INITIALIZATIONS ---
  function onDomReady() {
    // Re-sync buttons after DOM load
    applyTheme(getPreferredTheme());
    initAdSenseSafe();

    // Theme Toggle Handler
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = (document.documentElement && document.documentElement.getAttribute('data-theme')) || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    }

    // System Theme Change Listener
    try {
      if (window.matchMedia) {
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (e) => {
          let hasStoredPref = false;
          try {
            hasStoredPref = !!(typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY));
          } catch (err) {}
          if (!hasStoredPref) {
            applyTheme(e.matches ? 'dark' : 'light');
          }
        };
        if (mql.addEventListener) {
          mql.addEventListener('change', listener);
        } else if (mql.addListener) {
          mql.addListener(listener);
        }
      }
    } catch (e) {}

    // --- 4. NAVIGATION DRAWER CONTROLLER ---
    const navToggleBtn = document.getElementById('nav-toggle-btn');
    const navCloseBtn = document.getElementById('nav-close-btn');
    const navDrawer = document.getElementById('nav-drawer');
    const navBackdrop = document.getElementById('nav-backdrop');

    function openDrawer() {
      if (!navDrawer || !navBackdrop) return;
      navDrawer.classList.add('active');
      navBackdrop.classList.add('active');
      if (navToggleBtn) navToggleBtn.setAttribute('aria-expanded', 'true');
      if (document.body) document.body.style.overflow = 'hidden';
      if (navCloseBtn) navCloseBtn.focus();
    }

    function closeDrawer() {
      if (!navDrawer || !navBackdrop) return;
      navDrawer.classList.remove('active');
      navBackdrop.classList.remove('active');
      if (navToggleBtn) {
        navToggleBtn.setAttribute('aria-expanded', 'false');
        navToggleBtn.focus();
      }
      if (document.body) document.body.style.overflow = '';
    }

    if (navToggleBtn) navToggleBtn.addEventListener('click', openDrawer);
    if (navCloseBtn) navCloseBtn.addEventListener('click', closeDrawer);
    if (navBackdrop) navBackdrop.addEventListener('click', closeDrawer);

    // --- 5. SEARCH MODAL CONTROLLER ---
    const searchToggleBtn = document.getElementById('search-toggle-btn');
    const searchModalBackdrop = document.getElementById('search-backdrop');
    const searchModalCloseBtn = document.getElementById('search-close-btn');
    const searchInput = document.getElementById('search-input');
    const searchResultsArea = document.getElementById('search-results');

    function openSearch() {
      if (!searchModalBackdrop) return;
      searchModalBackdrop.classList.add('active');
      if (document.body) document.body.style.overflow = 'hidden';
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      renderSearchResults('');
    }

    function closeSearch() {
      if (!searchModalBackdrop) return;
      searchModalBackdrop.classList.remove('active');
      if (document.body) document.body.style.overflow = '';
      if (searchToggleBtn) searchToggleBtn.focus();
    }

    const siteArticles = [
  {
    "title": "NRI Property Investment & Home Loan Guide 2026: RBI FEMA Rules, PoA, TDS & Repatriation Matrix — GovIndiaNews Global Finance Desk",
    "snippet": "Complete legal and financial guide for NRIs and OCIs purchasing residential or commercial property in India under RBI FEMA Master Directions, NRE/NRO loan rules, and 1M USD repatriation matrix.",
    "url": "nri-property-investment-home-loan-guide-2026.html",
    "category": "Global Finance",
    "keywords": [
      "nri property",
      "nri home loan",
      "fema rules 2026",
      "rbi master direction",
      "poa registration",
      "section 195 tds",
      "nro nre repatriation",
      "form 15ca 15cb",
      "oci property investment"
    ]
  },
  {
    "title": "How to Invest in US Stocks from India in 2026: LRS $250k Limit, GIFT City IFSC, Tax & Broker Fee Guide — GovIndiaNews",
    "snippet": "Complete roadmap on investing in NYSE and NASDAQ stocks from India: RBI LRS $250,000 limit, GIFT City IFSC route, W-8BEN tax treaty rules, and ITR Schedule FA compliance.",
    "url": "how-to-invest-in-us-stocks-from-india-2026.html",
    "category": "Global Finance",
    "keywords": [
      "us stocks",
      "lrs limit",
      "gift city",
      "ifsc",
      "nse ix",
      "interactive brokers",
      "icici direct ifsc",
      "apple",
      "microsoft",
      "nvidia",
      "schedule fa",
      "tcs 2026",
      "w-8ben",
      "capital gains"
    ]
  },
  {
    "title": "International Estate Tax Planning & Cross-Border Asset Protection 2026 — GovIndiaNews Global Finance Desk",
    "snippet": "A technical blueprint on international estate tax mitigation, multi-jurisdictional trusts, QDOT rules under IRC §2056A, FATCA/CRS compliance, and offshore asset protection.",
    "url": "international-estate-tax-planning-2026.html",
    "category": "Global Finance",
    "keywords": [
      "international estate tax",
      "cross-border asset protection",
      "multi-jurisdictional trust",
      "qdot",
      "fatca",
      "crs",
      "dtaa",
      "dynasty trust",
      "foreign trust reporting"
    ]
  },
  {
    "title": "Startup India Seed Fund 2026: अपने नए बिजनेस के लिए पाएं ₹20 लाख Grant व ₹50 लाख Seed Loan — DPIIT Portal Guide — GovIndiaNews",
    "snippet": "DPIIT स्टार्टअप इंडिया सीड फंड योजना (SISFS 2026) की संपूर्ण गाइड: ₹20 लाख फ्री ग्रांट, ₹50 लाख सीड लोन, पात्रता नियम, 3 इंक्यूबेटर्स चयन, ऑनलाइन आवेदन व लाइव एलिजिबिलिटी कैलकुलेटर।",
    "url": "startup-india-seed-fund-2026.html",
    "category": "Government Schemes",
    "keywords": [
      "startup",
      "seed fund",
      "sisfs",
      "dpiit",
      "grant",
      "20 lakh",
      "seed loan",
      "50 lakh",
      "startup india",
      "incubator",
      "pitch deck",
      "स्टार्टअप",
      "सीड फंड",
      "लोन",
      "अनुदान"
    ]
  },
  {
    "title": "आर्मी 1600m रनिंग टाइम कैलकुलेटर (2026): अग्निवीर PFT मार्क्स एवं ग्रुप स्टेटस जांचें — GovIndiaNews",
    "snippet": "भारतीय सेना अग्निवीर भर्ती 2026 के लिए 1600 मीटर दौड़ कैलकुलेटर, ग्रुप 1 व ग्रुप 2 मार्क्स तालिका, बीम/पुल-अप्स स्कोर (40 अंक), नया CPT 2026 नियम और 400m पेसिंग स्प्लिट्स।",
    "url": "army-running-time-calculator-1600m-2026.html",
    "category": "Government Jobs",
    "keywords": [
      "army",
      "running",
      "1600m",
      "calculator",
      "agniveer",
      "pft",
      "cpt",
      "2026",
      "marks",
      "running time",
      "pullups",
      "beam",
      "अग्निवीर",
      "दौड़"
    ]
  },
  {
    "title": "MP Police SI Written Exam 2026: क्या 600 अंकों की लिखित परीक्षा में लागू होगा माइनस मार्किंग? — सम्पूर्ण परीक्षा पैटर्न, सिलेबस व रणनीति",
    "snippet": "MP Police SI व सूबेदार भर्ती 2026: 600 अंकों का नया परीक्षा पैटर्न, 1/3 (0.33) माइनस मार्किंग नियम, विषय-वार अंक विभाजन, 4-चरणीय चयन प्रक्रिया एवं लाइव मार्क्स कैलकुलेटर।",
    "url": "mp-police-si-written-exam-2026.html",
    "category": "Government Jobs",
    "keywords": [
      "mp police si",
      "written exam 2026",
      "negative marking",
      "mpesb si syllabus",
      "600 marks pattern",
      "sub inspector",
      "subedar",
      "माइनस मार्किंग",
      "एमपी पुलिस"
    ]
  },
  {
    "title": "फॉर्म भरने के बाद अटक गई है किश्त? तुरंत ऐसे करें Track : PMAY 2.0 Track Application — GovIndiaNews",
    "snippet": "PMAYMIS, Awaassoft और PFMS पोर्टल से अटकी हुई किश्त ऑनलाइन ट्रैक करें। आधार-DBT लिंक, Bhuvan App Geo-tagging और CPGRAMS शिकायत दर्ज कराने का पूरा तरीका।",
    "url": "pmay-2-0-track-application-status.html",
    "category": "Government Schemes",
    "keywords": [
      "pmay",
      "track",
      "application",
      "status",
      "किश्त",
      "आवास",
      "अटक",
      "2.0",
      "awaassoft",
      "pmaymis",
      "pfms",
      "dbt",
      "bhuvan",
      "geotag"
    ]
  },
  {
    "title": "CPGRAMS पोर्टल पर किश्त रुकने की ऑनलाइन शिकायत कैसे दर्ज करें? — GovIndiaNews",
    "snippet": "आवास योजना, पेंशन या छात्रवृत्ति की किश्त अटकने पर pgportal.gov.in पर ऑनलाइन शिकायत दर्ज कराने, ट्रैकिंग करने और 30 दिनों में समाधान प्राप्त करने की संपूर्ण गाइड।",
    "url": "cpgrams-pension-awas-installment-complaint.html",
    "category": "Government Schemes",
    "keywords": [
      "cpgrams",
      "pgportal",
      "complaint",
      "grievance",
      "किश्त",
      "शिकायत",
      "pgportal gov in",
      "pension",
      "awas",
      "pmay"
    ]
  },
  {
    "title": "PMAY Gramin & Urban Beneficiary List Status Check 2026 — GovIndiaNews",
    "snippet": "Awaassoft (pmayg.nic.in) एवं PMAYMIS (pmaymis.gov.in) पोर्टल पर प्रधानमंत्री आवास योजना 2.0 (ग्रामीण व शहरी) की वर्ष 2026 की नई स्वीकृत सूची डाउनलोड करने और अपना नाम चेक करने की पूरी गाइड।",
    "url": "pmay-gramin-urban-beneficiary-list-2026.html",
    "category": "Government Schemes",
    "keywords": [
      "pmay",
      "beneficiary",
      "list",
      "status",
      "2026",
      "gramin",
      "urban",
      "awaassoft",
      "pmaymis",
      "सूची",
      "लाभार्थी"
    ]
  },
  {
    "title": "PM Awas Yojana 2.0 (2026): किसे मिलेगा पक्का मकान और कैसे मिलेगी Subsidy? जानिए सब कुछ एक ही जगह — GovIndiaNews",
    "snippet": "3 करोड़ नए मकानों का लक्ष्य, PMAY Urban 2.0 और Gramin 2.0 पात्रता, ₹1.80L - ₹2.67L ब्याज सब्सिडी कैलकुलेशन, आवश्यक दस्तावेज और ऑनलाइन आवेदन विधि।",
    "url": "pm-awas-yojana-2-0-2026.html",
    "category": "Government Schemes",
    "keywords": [
      "pmay",
      "awas",
      "yojana",
      "subsidy",
      "मकान",
      "आवास",
      "2026",
      "pm",
      "scheme",
      "ews",
      "lig",
      "mig"
    ]
  }
];

    function renderSearchResults(query) {
      if (!searchResultsArea) return;
      const cleanQuery = (query || '').trim().toLowerCase();
      
      if (!cleanQuery) {
        searchResultsArea.innerHTML = `
          <div style="padding: 0.25rem 0;">
            <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--amber-600); margin-bottom: 0.75rem;">Recent Published Articles</div>
            ${siteArticles.map(art => `
              <div style="padding: 0.875rem; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 0.5rem; background: var(--bg-surface-alt);">
                <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--amber-600); display: block; margin-bottom: 0.25rem;">${art.category}</span>
                <a href="${art.url}" style="font-weight: 700; font-size: 0.95rem; color: var(--text-main); display: block; margin-bottom: 0.25rem; text-decoration: none;">${art.title}</a>
                <p style="font-size: 0.8125rem; color: var(--text-muted); margin: 0; line-height: 1.4;">${art.snippet}</p>
              </div>
            `).join('')}
          </div>
        `;
        return;
      }

      const matches = siteArticles.filter(art => 
        (art.title && art.title.toLowerCase().includes(cleanQuery)) ||
        (art.snippet && art.snippet.toLowerCase().includes(cleanQuery)) ||
        (art.keywords && art.keywords.some(k => k.toLowerCase().includes(cleanQuery)))
      );

      if (matches.length === 0) {
        searchResultsArea.innerHTML = `
          <div class="search-empty-state">
            <svg style="width: 32px; height: 32px; margin: 0 auto 0.5rem; display: block; opacity: 0.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <p>No matching articles found for "${cleanQuery}".</p>
          </div>
        `;
      } else {
        searchResultsArea.innerHTML = matches.map(art => `
          <div style="padding: 0.875rem; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 0.5rem; background: var(--bg-surface-alt);">
            <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--amber-600); display: block; margin-bottom: 0.25rem;">${art.category}</span>
            <a href="${art.url}" style="font-weight: 700; font-size: 1rem; color: var(--text-main); text-decoration: none; display: block; margin-bottom: 0.35rem;">${art.title}</a>
            <p style="font-size: 0.8125rem; color: var(--text-muted); margin: 0; line-height: 1.4;">${art.snippet}</p>
          </div>
        `).join('');
      }
    }

    if (searchToggleBtn) searchToggleBtn.addEventListener('click', openSearch);
    if (searchModalCloseBtn) searchModalCloseBtn.addEventListener('click', closeSearch);
    if (searchModalBackdrop) {
      searchModalBackdrop.addEventListener('click', (e) => {
        if (e.target === searchModalBackdrop) closeSearch();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderSearchResults(e.target.value);
      });
    }

    // --- 6. GLOBAL KEYBOARD ACCESSIBILITY (ESCAPE KEY) ---
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (navDrawer && navDrawer.classList.contains('active')) {
          closeDrawer();
        }
        if (searchModalBackdrop && searchModalBackdrop.classList.contains('active')) {
          closeSearch();
        }
      }
    });

    // --- 7. CONTACT FORM SUBMISSION HANDLER ---
    const contactForm = document.getElementById('contact-form');
    const contactStatus = document.getElementById('contact-status');
    if (contactForm && contactStatus) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerText : 'Send Inquiry';
        
        try {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Sending...';
          }
          contactStatus.style.display = 'none';

          const formData = new FormData(contactForm);
          const payload = {
            name: formData.get('name') || '',
            email: formData.get('email') || '',
            department: formData.get('department') || 'editorial',
            message: formData.get('message') || ''
          };

          const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await response.json().catch(() => ({}));
          if (response.ok && data.success) {
            contactStatus.style.display = 'block';
            contactStatus.style.background = 'var(--navy-lighter)';
            contactStatus.style.color = 'var(--navy-dark)';
            contactStatus.innerText = data.message || 'Thank you. Your inquiry has been received by the GovIndiaNews desk. We review inquiries within 24 business hours.';
            contactForm.reset();
          } else {
            contactStatus.style.display = 'block';
            contactStatus.style.background = '#FEE2E2';
            contactStatus.style.color = '#991B1B';
            contactStatus.innerText = data.error || 'Failed to submit inquiry. Please check your information and try again.';
          }
        } catch (err) {
          contactStatus.style.display = 'block';
          contactStatus.style.background = '#FEE2E2';
          contactStatus.style.color = '#991B1B';
          contactStatus.innerText = 'Network error. Please try again or email editorial@govindianews.com directly.';
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
          }
        }
      });
    }

    // --- 8. SCROLL TO TOP ENGINE ---
    function initScrollToTop() {
      try {
        let scrollToTopBtn = document.getElementById('scroll-to-top-btn');
        if (!scrollToTopBtn && document.body) {
          scrollToTopBtn = document.createElement('button');
          scrollToTopBtn.id = 'scroll-to-top-btn';
          scrollToTopBtn.className = 'scroll-to-top-btn';
          scrollToTopBtn.setAttribute('aria-label', 'Scroll to top');
          scrollToTopBtn.setAttribute('title', 'ऊपर जाएं (Scroll to top)');
          scrollToTopBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          `;
          document.body.appendChild(scrollToTopBtn);
        }

        if (!scrollToTopBtn) return;

        function toggleScrollBtn() {
          if (window.scrollY > 100) {
            scrollToTopBtn.classList.add('visible');
          } else {
            scrollToTopBtn.classList.remove('visible');
          }
        }

        toggleScrollBtn();

        let isTicking = false;
        window.addEventListener('scroll', () => {
          if (!isTicking) {
            window.requestAnimationFrame(() => {
              toggleScrollBtn();
              isTicking = false;
            });
            isTicking = true;
          }
        }, { passive: true });

        scrollToTopBtn.addEventListener('click', () => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
      } catch (e) {}
    }

    // --- 9. DYNAMIC ALSO READ RECOMMENDATIONS ENGINE ---
    function renderAlsoReadSection() {
      try {
        const container = document.getElementById('also-read-section');
        if (!container) return;

        const currentPath = (window.location && window.location.pathname ? window.location.pathname.split('/').pop() : '') || 'index.html';
        const currentArticle = siteArticles.find(art => art.url === currentPath);
        if (!currentArticle) return;

        const category = currentArticle.category;
        const candidates = siteArticles.filter(art => art.url !== currentPath);

        const scored = candidates.map(art => {
          let score = 0;
          if (art.category === category) {
            score += 100;
          }
          if (currentArticle.keywords && art.keywords) {
            const currentKws = currentArticle.keywords.map(k => k.toLowerCase());
            art.keywords.forEach(k => {
              if (currentKws.includes(k.toLowerCase())) {
                score += 10;
              }
            });
          }
          return { article: art, score: score };
        });

        scored.sort((a, b) => b.score - a.score);
        const recommendations = scored.slice(0, 3).map(item => item.article);

        if (recommendations.length === 0) return;

        container.innerHTML = `
          <div class="also-read-header">
            <h3 class="also-read-title">
              <span class="also-read-accent-bar"></span>
              Also Read / संबंधित महत्वपूर्ण लेख
            </h3>
            <span class="also-read-badge">Category: ${category}</span>
          </div>
          <div class="also-read-grid">
            ${recommendations.map(art => `
              <article class="also-read-card">
                <div class="also-read-card-top">
                  <div class="also-read-card-meta">
                    <span class="also-read-cat-tag">${art.category}</span>
                    <span style="font-size: 0.75rem; color: var(--text-subtle); font-weight: 500;">Guide</span>
                  </div>
                  <h4 class="also-read-card-title">
                    <a href="${art.url}">${art.title}</a>
                  </h4>
                  <p class="also-read-card-snippet">${art.snippet}</p>
                </div>
                <a href="${art.url}" class="also-read-card-link">
                  Read Full Article &rarr;
                </a>
              </article>
            `).join('')}
          </div>
        `;
      } catch (e) {}
    }

    renderAlsoReadSection();
    initScrollToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDomReady);
  } else {
    onDomReady();
  }
})();
