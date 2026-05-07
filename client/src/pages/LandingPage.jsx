import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Shield, Play, Menu, X, ArrowRight, Lock, Star, RefreshCw, Zap, Briefcase, Users, Bell, Clock, DollarSign, CheckCircle, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

/* ——— Animated counting number ——— */
const CountUp = ({ to, duration = 1.5 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(timer); } else { setVal(Math.floor(start)); }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, to, duration]);
  return <span ref={ref}>{val}</span>;
};

/* ——— Typing line ——— */
const TypingLine = ({ text, delay = 0, color = '#E2E2E2' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [inView, text, delay]);
  return <div ref={ref} style={{ color, fontFamily: "'Space Mono', monospace", fontSize: '0.75rem' }}>{displayed}<span className="cursor-blink">_</span></div>;
};

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const features = [
    { id: 'ai', label: 'AI MATCHING', icon: <Zap size={16} /> },
    { id: 'contract', label: 'CONTRACTS', icon: <Briefcase size={16} /> },
    { id: 'payment', label: 'PAYMENT LOCK', icon: <Lock size={16} /> },
    { id: 'revision', label: 'REVISION TRACKER', icon: <RefreshCw size={16} /> },
    { id: 'portfolio', label: 'PORTFOLIO', icon: <Users size={16} /> },
    { id: 'review', label: 'REVIEW SCORE', icon: <Star size={16} /> },
  ];

  return (
    <div className="landing-page">
      {/* ——— NAVBAR ——— */}
      <nav className="nav-pill-container">
        <div className="nav-btn btn-brand"><Shield size={20} /></div>
        <div className="desktop-links">
          <Link to="/" className="nav-btn btn-grey">INFO</Link>
          <Link to="/" className="nav-btn btn-black">NEWS</Link>
          <div className="nav-btn btn-orange">ACCREDIFY</div>
          {isAuthenticated ? (
            <Link to="/dashboard" className="nav-btn btn-grey">DASHBOARD</Link>
          ) : (
            <Link to="/login" className="nav-btn btn-grey">LOGIN</Link>
          )}
          <Link to={isAuthenticated ? "/dashboard" : "/register"} className="nav-btn btn-dotted">
            DISCOVER TRUST METRICS
          </Link>
          <div className="nav-btn btn-black">START <ArrowRight size={16} style={{ marginLeft: '6px' }} /></div>
        </div>
        <button className="nav-btn btn-square mobile-menu-btn" onClick={toggleMobileMenu}><Menu size={16} /></button>
      </nav>

      {/* ——— MOBILE MENU ——— */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-full-menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="mobile-menu-noise"></div>
            <div className="mobile-menu-header">
              <div className="mobile-menu-sys-label">SYS_NAV // ACCREDIFY_v7.2</div>
              <button className="mobile-close-btn" onClick={toggleMobileMenu}><X size={28} strokeWidth={3} /></button>
            </div>
            <div className="mobile-menu-links">
              <div className="mobile-menu-index">01</div>
              <Link to="/" onClick={toggleMobileMenu}>INFO</Link>
              <div className="mobile-menu-index">02</div>
              <Link to="/" onClick={toggleMobileMenu}>NEWS</Link>
              <div className="mobile-menu-index">03</div>
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={toggleMobileMenu}>DASHBOARD</Link>
              ) : (
                <Link to="/login" onClick={toggleMobileMenu}>LOGIN</Link>
              )}
              <div className="mobile-menu-index">04</div>
              <Link to="/register" onClick={toggleMobileMenu} className="mobile-link-highlight">JOIN ACCREDIFY</Link>
            </div>
            <div className="mobile-menu-footer">
              <span>BEHAVIORAL TRUST PROTOCOL</span>
              <span className="mobile-menu-status">STATUS: <span style={{ color: '#00FF66' }}>ONLINE</span></span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— BG TYPOGRAPHY ——— */}
      <div className="bg-type-container">
        <span className="giant-letter">A</span>
        <span className="giant-letter">R</span>
        <span className="giant-letter" style={{ opacity: 0.3, background: 'linear-gradient(135deg, #FF7A00, #FACC15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>F</span>
      </div>

      {/* ——— HERO ——— */}
      <main className="landing-main">
        <motion.div className="tech-spec-block spec-top-right" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
          <span className="spec-highlight">MULTIPLE TRUST OPTIONS</span> INCLUDE SCOPE TRACKING AND REVISION METRICS. INSTANT BEHAVIORAL CREDIBILITY AVAILABLE VIA THE DASHBOARD. INCLUDED IN THE SYSTEM: REVISION DISCIPLINE, PAYMENT RELIABILITY.
        </motion.div>

        <motion.div className="folder-container" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <div className="folder-wrapper">
            <div className="folder-tab"></div>
            <div className="folder-back"></div>

            {/* Contract Papers - Refined with Metadata */}
            <div className="contract-paper contract-paper-1">
              <div className="paper-header">
                <span className="paper-title">PRJ_ID: 8829</span>
                <span className="paper-tag">ARCHIVED // v2.4</span>
              </div>
              <div className="paper-content">
                <div className="paper-metric">
                  <span className="pm-label-paper">TRUST SCORE:</span>
                  <span className="pm-val-paper">9.8 / 10.0</span>
                </div>
                <div className="paper-metric">
                  <span className="pm-label-paper">REVISIONS:</span>
                  <span className="pm-val-paper">02 / 05 DISCIPLINE</span>
                </div>
                <div className="paper-metric">
                  <span className="pm-label-paper">REQUIREMENTS:</span>
                  <span className="pm-val-paper">100% ADHERENCE</span>
                </div>
              </div>
              <div className="paper-stamp">VERIFIED</div>
            </div>

            <div className="contract-paper contract-paper-2">
              <div className="paper-header">
                <span className="paper-title">PRJ_ID: 7741</span>
                <span className="paper-tag">ARCHIVED // v1.8</span>
              </div>
              <div className="paper-content">
                <div className="paper-metric">
                  <span className="pm-label-paper">TRUST SCORE:</span>
                  <span className="pm-val-paper">9.5 / 10.0</span>
                </div>
                <div className="paper-metric">
                  <span className="pm-label-paper">REVISIONS:</span>
                  <span className="pm-val-paper">04 / 04 COMPLETED</span>
                </div>
                <div className="paper-metric">
                  <span className="pm-label-paper">ESCROW:</span>
                  <span className="pm-val-paper">100% RELEASED</span>
                </div>
              </div>
              <div className="paper-stamp">VERIFIED</div>
            </div>

            <div className="contract-paper contract-paper-3">
              <div className="paper-header">
                <span className="paper-title">PRJ_ID: 9942</span>
                <span className="paper-tag">LOCKED // LIVE</span>
              </div>
              <div className="paper-content">
                <div className="paper-metric">
                  <span className="pm-label-paper">BUDGET:</span>
                  <span className="pm-val-paper">$4,200.00 USD</span>
                </div>
                <div className="paper-metric">
                  <span className="pm-label-paper">REVISIONS:</span>
                  <span className="pm-val-paper">01 / 10 ACTIVE</span>
                </div>
                <div className="paper-metric">
                  <span className="pm-label-paper">SCOPE:</span>
                  <span className="pm-val-paper">96% DEFINED</span>
                </div>
              </div>
              <div className="paper-stamp" style={{ borderColor: '#FF7A00', color: '#FF7A00' }}>PENDING</div>
            </div>

            <div className="folder-front">
              <div className="folder-label">ACCREDIFY // TRUST_VAULT_v7.2</div>
            </div>
          </div>
        </motion.div>

        <div className="play-btn-circle"><Play size={18} fill="currentColor" /></div>

        <div className="floating-label label-reliability">RELIABILITY_LOGS</div>
        <div className="floating-label label-protocol">TRUST_PROTOCOL</div>
        <div className="floating-label label-engine">SCOPE_ENGINE</div>
        <div className="floating-label label-behavioral">BEHAVIORAL</div>
        <div className="floating-label label-metrics">METRICS_v7.2</div>
        <div className="floating-label label-init">INITIALIZE</div>

        <motion.div className="tech-spec-block spec-bottom-left" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
          THE BEHAVIORAL TRUST INFRASTRUCTURE FOR THE FREELANCE ECONOMY. <span className="spec-highlight">CONVERT PROJECT AGREEMENTS INTO REAL-TIME CREDIBILITY.</span> ALIGN DELIVERABLES, SHOWCASE EFFICIENCY, AND ATTRACT TOP TALENT.
        </motion.div>

        <motion.div className="tech-spec-block spec-bottom-right" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}>
          <ul className="spec-list">
            <li>SCOPE ADHERENCE TRACKING</li>
            <li>REVISION DISCIPLINE METRICS</li>
            <li>PAYMENT RELIABILITY LOGS</li>
            <li>IMMUTABLE PROJECT HISTORY</li>
            <li>GLOBAL CREDIBILITY PROFILE</li>
            <li>INSTANT DASHBOARD ACCESS</li>
          </ul>
        </motion.div>
      </main>

      {/* ——— DUAL BRANCH SECTION ——— */}
      <section className="dual-branch-section" id="dual-branch">
        <div className="dual-branch-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="dual-branch-sys-label">TWO BRANCHES // ONE NETWORK</div>
            <h2 className="dual-branch-title">
              CHOOSE YOUR <span className="text-orange">ENGAGEMENT MODEL</span>
            </h2>
            <p className="dual-branch-desc">
              Accredify operates dual branches to match your preferred working style. Build long-term professional credibility or jump into instant, real-time gig opportunities.
            </p>
          </motion.div>
        </div>

        <div className="branch-cards-container">
          {/* Freelancer Branch */}
          <motion.div
            className="branch-card freelancer-card"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Briefcase size={200} className="branch-card-bg-icon" />
            <div className="branch-tag">BRANCH 01: CORE</div>
            <h3 className="branch-title">PROPOSAL-BASED<br />FREELANCING</h3>
            <ul className="branch-features">
              <li><CheckCircle size={16} /> Strict scope locking and milestones</li>
              <li><CheckCircle size={16} /> Revision tracking and discipline logs</li>
              <li><CheckCircle size={16} /> Payment security via Escrow Vault</li>
              <li><CheckCircle size={16} /> Long-term behavioral credibility score</li>
            </ul>
            <div style={{ marginTop: 'auto' }}>
              <Link to="/register" className="ind-btn ind-btn-outline" style={{ border: '1px solid #555', color: '#E2E2E2', width: '100%', textAlign: 'center', display: 'block' }}>
                BUILD CREDIBILITY
              </Link>
            </div>
          </motion.div>

          {/* Gig Worker Branch */}
          <motion.div
            className="branch-card gig-worker-card"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Flame size={200} className="branch-card-bg-icon" />
            <div className="branch-tag">BRANCH 02: ACTIVE</div>
            <h3 className="branch-title">REAL-TIME<br />GIG NETWORK</h3>
            <ul className="branch-features">
              <li><Zap size={16} /> Toggle "Daily Gig Mode" to go live</li>
              <li><Zap size={16} /> No proposals. Get matched instantly</li>
              <li><Zap size={16} /> Instant popup notifications for new gigs</li>
              <li><Zap size={16} /> Immediate chat and commencement</li>
            </ul>
            
            {/* Live Popup Mockup */}
            <div className="daily-gig-mockup">
              <div className="mockup-header">
                <div className="mockup-title">
                  <div className="mockup-status-dot"></div>
                  DAILY GIG MODE: ONLINE
                </div>
                <div className="mockup-toggle"></div>
              </div>
              
              <div className="mockup-popup">
                <div className="mockup-popup-label"><Bell size={12} /> NEW GIG MATCH</div>
                <div className="mockup-gig-title">React Dashboard Fix</div>
                <div className="mockup-gig-details">
                  <div className="mockup-gig-detail"><DollarSign size={12} style={{verticalAlign:'middle', marginRight:'2px'}}/><span>$150</span></div>
                  <div className="mockup-gig-detail"><Clock size={12} style={{verticalAlign:'middle', marginRight:'2px'}}/><span>~2 Hours</span></div>
                </div>
                <div className="mockup-buttons">
                  <div className="mockup-btn mockup-btn-reject">REJECT</div>
                  <div className="mockup-btn mockup-btn-accept">ACCEPT</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ——— PLATFORM INTRO BAND ——— */}
      <section className="platform-band">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="platform-band-label">THE FULL STACK</div>
          <h2 className="platform-band-title">
            END-TO-END PLATFORM FOR<br />
            <span className="text-orange">CLIENTS &amp; FREELANCERS</span>
          </h2>
          <p className="platform-band-desc">
            From finding the right talent with AI, locking scope in a contract, tracking revisions,
            locking payment, delivering the project — Accredify handles every step.
          </p>
        </motion.div>

        {/* Scrolling feature tabs */}
        <div className="feature-tabs">
          {features.map((f, i) => (
            <button
              key={f.id}
              className={`feature-tab ${activeFeature === i ? 'active' : ''}`}
              onClick={() => setActiveFeature(i)}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* ——— STATS BAND ——— */}
      <motion.section
        className="stats-band"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {[
          { value: 98, suffix: '%', label: 'SCOPE ADHERENCE' },
          { value: 124, suffix: '+', label: 'PROJECTS TRACKED' },
          { value: 100, suffix: '%', label: 'PAYMENT RELIABILITY' },
          { value: 1, suffix: '.2x', label: 'AVG REVISION CYCLES' },
        ].map((s, i) => (
          <motion.div
            key={i}
            className="stat-item"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="stat-value">
              <CountUp to={s.value} />{s.suffix}
            </div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </motion.section>

      {/* ——— FEATURE SECTION 1: AI MATCHING ——— */}
      <section className="feature-section feature-dark">
        <div className="feature-inner">
          <motion.div
            className="feature-text-col"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
          >
            <div className="feature-sys-label">01 // AI_ROUTING</div>
            <h2 className="feature-title-dark">NEURAL<br />TALENT<br />ROUTING</h2>
            <p className="feature-desc-dark">
              Stop filtering. Our AI engine analyzes project requirements and cross-references them
              with immutable behavioral data to connect clients with the perfectly suited freelancer — instantly.
              No more wading through hundreds of profiles.
            </p>
            <div className="feature-tags">
              <span className="feature-tag">AUTO-MATCH</span>
              <span className="feature-tag">SKILL ANALYSIS</span>
              <span className="feature-tag">TRUST-WEIGHTED</span>
            </div>
          </motion.div>

          <motion.div
            className="feature-visual-col"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {/* AI gradient orb card */}
            <div className="ai-card">
              <div className="ai-orb"></div>
              <div className="ai-card-header">
                <span className="ai-card-tag">● AI MATCH ENGINE</span>
                <span className="ai-card-id">ARF-7844</span>
              </div>
              <div className="ai-terminal">
                <TypingLine text="> PARSING PROJECT REQUIREMENTS..." delay={0.2} color="#aaa" />
                <TypingLine text="> SCANNING OPERATOR NETWORK [100%]" delay={1.0} color="#aaa" />
                <TypingLine text="> TRUST SCORE EVALUATION..." delay={1.8} color="#aaa" />
                <div style={{ height: '0.5rem' }} />
                <TypingLine text="[✓] MATCH FOUND: OP_ID 9942" delay={2.5} color="#FF7A00" />
                <TypingLine text="    SCORE: 98.5 | PAY_REL: 100%" delay={3.2} color="#E2E2E2" />
                <TypingLine text="    REV_DISC: 94% | PROJECTS: 124" delay={3.8} color="#E2E2E2" />
                <TypingLine text="> ROUTING CONNECTION..._" delay={4.3} color="#666" />
              </div>
              <div className="ai-card-footer">
                <span>MATCH CONFIDENCE</span>
                <div className="ai-progress-bar">
                  <motion.div
                    className="ai-progress-fill"
                    initial={{ width: 0 }}
                    whileInView={{ width: '94%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />
                </div>
                <span className="ai-progress-val">94%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ——— FEATURE SECTION 2: SMART CONTRACTS ——— */}
      <section className="feature-section feature-light">
        <div className="feature-inner feature-inner-reverse">
          <motion.div
            className="feature-visual-col"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Contract card stack — inspired by reference images */}
            <div className="contract-stack">
              {/* Back card */}
              <div className="contract-card contract-card-back">
                <div className="contract-card-header-stripe" />
                <div className="contract-lines">
                  <div className="cl cl-full"></div>
                  <div className="cl cl-med"></div>
                  <div className="cl cl-full"></div>
                </div>
              </div>
              {/* Main card */}
              <div className="contract-card contract-card-main">
                <div className="contract-card-top">
                  <div>
                    <div className="contract-card-type">SCOPE_AGREEMENT</div>
                    <div className="contract-card-title">UI/UX REDESIGN</div>
                  </div>
                  <div className="contract-stamp">ACTIVE</div>
                </div>
                <div className="contract-scope-list">
                  <div className="contract-scope-item">
                    <div className="csi-dot orange" /> <span>Homepage redesign</span>
                    <div className="csi-check">✓</div>
                  </div>
                  <div className="contract-scope-item">
                    <div className="csi-dot orange" /> <span>Component library</span>
                    <div className="csi-check">✓</div>
                  </div>
                  <div className="contract-scope-item">
                    <div className="csi-dot grey" /> <span>Mobile responsiveness</span>
                    <div className="csi-badge">PENDING</div>
                  </div>
                </div>
                <div className="contract-footer-row">
                  <span className="cf-label">BUDGET LOCKED</span>
                  <span className="cf-value">$4,200</span>
                </div>
                <div className="contract-footer-row" style={{ marginTop: '0.35rem' }}>
                  <span className="cf-label">03 DELIVERABLES</span>
                  <span className="cf-label">REVISIONS: 1/3</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="feature-text-col"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="feature-sys-label feature-sys-label-dark">02 // CONTRACT_GEN</div>
            <h2 className="feature-title-light">PARAMETRIC<br />SCOPE<br />AGREEMENTS</h2>
            <p className="feature-desc-light">
              Define the scope, lock the deliverables, set the milestones. Accredify translates
              plain-text agreements into strict digital parameters — ensuring absolute clarity
              before a single line of code is written.
            </p>
            <div className="feature-tags feature-tags-dark">
              <span className="feature-tag-dark">SCOPE-LOCKED</span>
              <span className="feature-tag-dark">DELIVERABLES</span>
              <span className="feature-tag-dark">MILESTONES</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ——— FEATURE SECTION 3: PAYMENT LOCK ——— */}
      <section className="feature-section feature-dark">
        <div className="feature-inner">
          <motion.div
            className="feature-text-col"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
          >
            <div className="feature-sys-label">03 // ESCROW_SEC</div>
            <h2 className="feature-title-dark">IMMUTABLE<br />PAYMENT<br />LOCK</h2>
            <p className="feature-desc-dark">
              No more chasing invoices. No unpaid overtime. Funds are locked securely upon
              contract creation and released automatically when scope milestones are confirmed —
              giving both client and freelancer total financial security.
            </p>
            <div className="feature-tags">
              <span className="feature-tag">ESCROW</span>
              <span className="feature-tag">AUTO-RELEASE</span>
              <span className="feature-tag">ZERO DISPUTES</span>
            </div>
          </motion.div>

          <motion.div
            className="feature-visual-col"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="payment-card">
              {/* Dark gradient orb */}
              <div className="payment-orb"></div>
              <div className="payment-card-header">
                <div className="payment-lock-icon">
                  <Lock size={28} color="#FF7A00" />
                </div>
                <div>
                  <div className="payment-card-title-top">PAYMENT SECURED</div>
                  <div className="payment-card-sub">ESCROW_PROTOCOL v2</div>
                </div>
              </div>
              <div className="payment-amount">$4,200</div>
              <div className="payment-milestones">
                {[
                  { label: 'MILESTONE 01 — WIREFRAMES', status: 'released', pct: 33 },
                  { label: 'MILESTONE 02 — PROTOTYPE', status: 'locked', pct: 33 },
                  { label: 'MILESTONE 03 — FINAL BUILD', status: 'locked', pct: 34 },
                ].map((m, i) => (
                  <div key={i} className="pm-row">
                    <div className={`pm-dot ${m.status}`}></div>
                    <div className="pm-label">{m.label}</div>
                    <div className={`pm-badge ${m.status}`}>{m.status === 'released' ? '✓ RELEASED' : 'LOCKED'}</div>
                  </div>
                ))}
              </div>
              <div className="payment-card-footer">
                <Lock size={12} color="#666" /> ALL FUNDS SECURED BY BEHAVIORAL CONTRACT
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ——— FEATURE SECTION 4: REVISION TRACKER ——— */}
      <section className="feature-section feature-light">
        <div className="feature-inner feature-inner-reverse">
          <motion.div
            className="feature-visual-col"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="revision-visual-card">
              <div className="rv-header">
                <RefreshCw size={20} color="#FF7A00" />
                <span className="rv-title">REVISION_TRACKER</span>
                <span className="rv-project">UI/UX PROJECT</span>
              </div>
              <div className="rv-big-num">
                <CountUp to={2} duration={1} />
                <span className="rv-slash">/ 3</span>
                <span className="rv-used">USED</span>
              </div>
              <div className="rv-bar-bg">
                <motion.div
                  className="rv-bar-fill"
                  initial={{ width: 0 }}
                  whileInView={{ width: '66%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                />
              </div>
              <div className="rv-tags-row">
                <span className="rv-tag rv-tag-complete">REV 1: ACCEPTED</span>
                <span className="rv-tag rv-tag-complete">REV 2: ACCEPTED</span>
                <span className="rv-tag rv-tag-pending">REV 3: AVAILABLE</span>
              </div>
              <div className="rv-footer">
                <div className="rv-stat">
                  <div className="rv-stat-val">1.2<span className="rv-stat-unit">x</span></div>
                  <div className="rv-stat-label">AVG CYCLES</div>
                </div>
                <div className="rv-stat">
                  <div className="rv-stat-val rv-stat-orange">94<span className="rv-stat-unit">%</span></div>
                  <div className="rv-stat-label">DISCIPLINE</div>
                </div>
                <div className="rv-stat">
                  <div className="rv-stat-val">7<span className="rv-stat-unit">d</span></div>
                  <div className="rv-stat-label">AVG TURNAROUND</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="feature-text-col"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="feature-sys-label feature-sys-label-dark">04 // REV_TRACKER</div>
            <h2 className="feature-title-light">REVISION<br />DISCIPLINE<br />TRACKER</h2>
            <p className="feature-desc-light">
              Every revision is logged and included in the freelancer's behavioral score. Scope creep
              is detected automatically. Clients know exactly what's in scope — and freelancers
              build credibility by staying within it.
            </p>
            <div className="feature-tags feature-tags-dark">
              <span className="feature-tag-dark">SCOPE CREEP DETECTION</span>
              <span className="feature-tag-dark">BEHAVIORAL LOG</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ——— FEATURE SECTION 5: BEHAVIORAL PORTFOLIO ——— */}
      <section className="feature-section feature-dark">
        <div className="feature-inner">
          <motion.div
            className="feature-text-col"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
          >
            <div className="feature-sys-label">05 // PUB_METRICS</div>
            <h2 className="feature-title-dark">BEHAVIORAL<br />PORTFOLIO</h2>
            <p className="feature-desc-dark">
              Your resume is obsolete. Accredify builds a public, immutable portfolio based on how you
              actually work — past project experiences, completion history, and behavioral metrics
              that any client can verify in seconds.
            </p>
            <div className="feature-tags">
              <span className="feature-tag">VERIFIED HISTORY</span>
              <span className="feature-tag">PUBLIC PROFILE</span>
              <span className="feature-tag">CREDIBILITY</span>
            </div>
          </motion.div>

          <motion.div
            className="feature-visual-col"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="portfolio-card">
              <div className="portfolio-card-banner">
                <div className="portfolio-banner-bg"></div>
                <div className="portfolio-banner-overlay">
                  <div className="portfolio-user-id">OP_ID: 9942</div>
                  <div className="portfolio-name">OPERATOR PROFILE</div>
                </div>
              </div>
              <div className="portfolio-card-body">
                <div className="portfolio-metrics-grid">
                  {[
                    { l: 'TRUST SCORE', v: '98.5', c: '#FF7A00' },
                    { l: 'PROJECTS', v: '124', c: '#E2E2E2' },
                    { l: 'SCOPE ADH.', v: '98%', c: '#00FF66' },
                    { l: 'PAY_RELIAB.', v: '100%', c: '#00FF66' },
                  ].map((m, i) => (
                    <div key={i} className="pf-metric">
                      <div className="pf-metric-val" style={{ color: m.c }}>{m.v}</div>
                      <div className="pf-metric-label">{m.l}</div>
                    </div>
                  ))}
                </div>
                <div className="portfolio-history-label">// RECENT CONTRACTS</div>
                {[
                  { title: 'E-COMM REDESIGN', status: 'COMPLETE', score: '+2.1' },
                  { title: 'MOBILE APP v3', status: 'COMPLETE', score: '+1.8' },
                  { title: 'BRAND IDENTITY', status: 'ACTIVE', score: '—' },
                ].map((p, i) => (
                  <div key={i} className="pf-project-row">
                    <span className="pf-project-title">{p.title}</span>
                    <span className={`pf-project-status ${p.status === 'COMPLETE' ? 'complete' : 'active'}`}>{p.status}</span>
                    <span className="pf-project-score" style={{ color: p.score.startsWith('+') ? '#00FF66' : '#888' }}>{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ——— FEATURE SECTION 6: REVIEW SCORE ——— */}
      <section className="feature-section feature-light">
        <div className="feature-inner feature-inner-reverse">
          <motion.div
            className="feature-visual-col"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Three card layout — Catalist style */}
            <div className="review-card-trio">
              <div className="rct-card rct-dark rct-card-left">
                <div className="rct-orb rct-orb-orange"></div>
                <div className="rct-label">TRUST VELOCITY</div>
                <div className="rct-big">+4.2</div>
                <div className="rct-sub">THIS QUARTER</div>
              </div>
              <div className="rct-card rct-light rct-card-center">
                <div className="rct-orb rct-orb-warm"></div>
                <div className="rct-label-dark">BEHAVIORAL SCORE</div>
                <div className="rct-stars">
                  {[1, 2, 3, 4, 5].map(i => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Star key={i} size={18} fill="#FF7A00" color="#FF7A00" />
                    </motion.div>
                  ))}
                </div>
                <div className="rct-score">4.9 / 5.0</div>
              </div>
              <div className="rct-card rct-dark rct-card-right">
                <div className="rct-logo">ARF</div>
                <div className="rct-label">TRUST INDEX</div>
                <div className="rct-big">98.5</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="feature-text-col"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="feature-sys-label feature-sys-label-dark">06 // REVIEW_SCORE</div>
            <h2 className="feature-title-light">BEHAVIORAL<br />REVIEW<br />SYSTEM</h2>
            <p className="feature-desc-light">
              Reviews that can't be faked. Every score is computed from real behavioral data — not
              subjective stars. Scope adherence, revision discipline, payment reliability, and delivery
              speed all contribute to an immutable trust index.
            </p>
            <div className="feature-tags feature-tags-dark">
              <span className="feature-tag-dark">VERIFIED REVIEWS</span>
              <span className="feature-tag-dark">BEHAVIOR-BASED</span>
              <span className="feature-tag-dark">IMMUTABLE</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ——— TECHNICAL FOOTER ——— */}
      <footer className="tech-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">ARF_SYSTEM // v7.2</div>
            <p className="footer-mission">
              IMMUTABLE BEHAVIORAL TRUST INFRASTRUCTURE. DATA-BACKED CREDIBILITY FOR THE PROFESSIONAL ECONOMY.
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-h">PROTOCOL</h4>
            <Link to="/">SCOPE_ENGINE</Link>
            <Link to="/">REVISION_TRACKER</Link>
            <Link to="/">ESCROW_VAULT</Link>
            <Link to="/">BEHAVIOR_SCORE</Link>
          </div>

          <div className="footer-col">
            <h4 className="footer-h">SYSTEM</h4>
            <Link to="/">API_DOCS</Link>
            <Link to="/">NETWORK_STATUS</Link>
            <Link to="/">GOVERNANCE</Link>
            <Link to="/">SECURITY</Link>
          </div>

          <div className="footer-col">
            <h4 className="footer-h">LEGAL</h4>
            <Link to="/">SERVICE_LEVEL_AGREEMENT</Link>
            <Link to="/">PRIVACY_POLICY</Link>
            <Link to="/">TERMINAL_TERMS</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-meta">
            <span>© 2026 ACCREDIFY_NETWORK_INC</span>
            <span>ID: 0x82...BF92</span>
          </div>
          <div className="footer-status-pills">
            <span className="status-pill pulse">SYSTEM_ONLINE</span>
            <span className="status-pill">BLOCK_HEIGHT://882,901</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
