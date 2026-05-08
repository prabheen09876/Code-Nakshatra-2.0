import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { gigsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Calendar, Coins, Layers, Shield, User, X as XIcon } from 'lucide-react';
import './DailyGigLiveLayer.css';

const POLL_MS_FREELANCER = 3500;
const POLL_MS_CLIENT = 5000;

/** Middle of requested 8–10s window */
const INSTANT_GIG_VISIBILITY_MS = 9500;

const SK_DISMISS_PREFIX = 'dailyGig_offer_dismiss';

const MAX_VISIBLE_PEEK_STRIPS = 4;

/** Remaining swipe window from server createdAt — floor when a buried offer surfaces */
function offerVisibilityMsRemaining(offer, capMs = INSTANT_GIG_VISIBILITY_MS) {
    try {
        const t = new Date(offer.createdAt).getTime();
        if (!Number.isFinite(t)) return capMs;
        const left = capMs - (Date.now() - t);
        return Math.min(capMs, Math.max(2200, left));
    } catch {
        return capMs;
    }
}

function dismissedOfferIds() {
    try {
        const raw = sessionStorage.getItem(SK_DISMISS_PREFIX);
        const ids = JSON.parse(raw || '[]');
        return new Set(ids.map(Number).filter(Number.isFinite));
    } catch {
        return new Set();
    }
}

function dismissOfferStorage(offerId) {
    const s = dismissedOfferIds();
    s.add(offerId);
    sessionStorage.setItem(SK_DISMISS_PREFIX, JSON.stringify([...s]));
}

function parseSkillTags(offer) {
    try {
        const sr = offer.requiredSkills;
        if (Array.isArray(sr)) return sr.map(String).filter(Boolean);
        if (typeof sr === 'string') return JSON.parse(sr || '[]');
    } catch {
        /* ignore */
    }
    return [];
}

/** Aligns with `DailyGigLiveLayer.css`: mobile swipe, wider viewports show action buttons */
const DAILY_GIG_DESKTOP_MQ = '(min-width: 640px)';

function useFreelancerGigWideLayout() {
    const [wide, setWide] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(DAILY_GIG_DESKTOP_MQ).matches : false,
    );
    useEffect(() => {
        const mq = window.matchMedia(DAILY_GIG_DESKTOP_MQ);
        const sync = () => setWide(mq.matches);
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);
    return wide;
}

function FreelancerGigPeekOverflowStrip({ extraCount }) {
    return (
        <div className="daily-gig-peel-strip daily-gig-peel-strip--overflow" aria-hidden>
            <div className="daily-gig-peel-strip__inner daily-gig-peel-strip__inner--overflow">
                <span className="daily-gig-peel-strip__overflow-text">+{extraCount} more in queue</span>
            </div>
        </div>
    );
}

/** Tab-style strip for offers waiting behind the active card */
function FreelancerGigPeekStrip({ offer, layerFromBack }) {
    const scale = Math.max(0.9, 1 - (layerFromBack + 1) * 0.028);
    return (
        <div
            className="daily-gig-peel-strip"
            style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center' }}
            aria-hidden
        >
            <div className="daily-gig-peel-strip__inner">
                <Briefcase size={16} strokeWidth={2} color="#f97316" aria-hidden />
                <span className="daily-gig-peel-strip__title">{offer.title}</span>
                <span className="daily-gig-peel-strip__budget">{offer.budget}</span>
            </div>
        </div>
    );
}

/** Mobile: swipe left = decline, right = accept. Desktop (width >= 640px): Accept / Decline buttons only */
function FreelancerGigSwipeSheet({ offer, busy, onAccept, onReject, visibilityMs = INSTANT_GIG_VISIBILITY_MS }) {
    const desktopLayout = useFreelancerGigWideLayout();
    const cardRef = useRef(null);
    const startX = useRef(0);
    const startY = useRef(0);
    const tracking = useRef(false);
    const swipeAxis = useRef(null);
    const dragXRef = useRef(0);
    const [dragX, setDragX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const onRejectRef = useRef(onReject);
    const desktopLayoutRef = useRef(desktopLayout);
    desktopLayoutRef.current = desktopLayout;

    useEffect(() => {
        onRejectRef.current = onReject;
    }, [onReject]);

    useEffect(() => {
        if (desktopLayout) {
            tracking.current = false;
            swipeAxis.current = null;
            dragXRef.current = 0;
            setDragX(0);
            setIsDragging(false);
        }
    }, [desktopLayout]);

    useEffect(() => {
        const oid = offer.offerId;
        const t = window.setTimeout(() => {
            onRejectRef.current({ timedOut: true, offerId: oid });
        }, visibilityMs);
        return () => clearTimeout(t);
    }, [offer.offerId, visibilityMs]);

    const skillList = parseSkillTags(offer);

    const threshold = () => {
        const w = cardRef.current?.offsetWidth ?? 320;
        return Math.max(72, Math.min(140, w * 0.26));
    };

    const handlePointerDown = (e) => {
        if (desktopLayoutRef.current || busy) return;
        if (e.button != null && e.button !== 0) return;
        startX.current = e.clientX;
        startY.current = e.clientY;
        tracking.current = true;
        swipeAxis.current = null;
        setIsDragging(true);
        cardRef.current?.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (desktopLayoutRef.current || !tracking.current || busy) return;
        let dx = e.clientX - startX.current;
        const dy = e.clientY - startY.current;

        if (swipeAxis.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
            swipeAxis.current = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        }
        if (swipeAxis.current === 'y') {
            dx = 0;
        }
        const maxPull = threshold() * 1.85;
        dx = Math.max(-maxPull, Math.min(maxPull, dx));
        dragXRef.current = dx;
        setDragX(dx);
    };

    const handlePointerUpOrCancel = (e) => {
        if (desktopLayoutRef.current || !tracking.current) return;
        tracking.current = false;
        swipeAxis.current = null;
        setIsDragging(false);
        try {
            cardRef.current?.releasePointerCapture(e.pointerId);
        } catch {
            /* ignore */
        }
        const dx = dragXRef.current;
        startX.current = 0;
        startY.current = 0;
        const t = threshold();
        if (dx > t) {
            onAccept();
            dragXRef.current = 0;
            setDragX(0);
            return;
        }
        if (dx < -t) {
            onReject({ timedOut: false, swipe: true, offerId: offer.offerId });
            dragXRef.current = 0;
            setDragX(0);
            return;
        }
        dragXRef.current = 0;
        setDragX(0);
    };

    const rejectActive = !desktopLayout && dragX <= -28;
    const acceptActive = !desktopLayout && dragX >= 28;

    const rotateDeg = desktopLayout ? 0 : dragX * 0.02;

    return (
        <div className="daily-gig-sheet">
            <div className="daily-gig-timer" aria-hidden>
                <div
                    key={`t-${offer.offerId}`}
                    className="daily-gig-timer__bar"
                    style={{
                        animationName: 'daily-gig-timer-shrink',
                        animationDuration: `${visibilityMs}ms`,
                    }}
                />
            </div>

            <div className="daily-gig-swipe-track">
                <div className="daily-gig-swipe-hints" aria-hidden>
                    <div className={`daily-gig-hint daily-gig-hint--reject${rejectActive ? ' is-active' : ''}`}>
                        ← DECLINE
                    </div>
                    <div className={`daily-gig-hint daily-gig-hint--accept${acceptActive ? ' is-active' : ''}`}>
                        ACCEPT →
                    </div>
                </div>

                <div className="daily-gig-swipe-card-wrap">
                    <article
                        ref={cardRef}
                        className={`daily-gig-swipe-card${desktopLayout ? ' daily-gig-swipe-card--desktop' : ''}${!desktopLayout && !isDragging ? ' daily-gig-swipe-card--spring' : ''}${!desktopLayout ? ' daily-gig-swipe-card--draggable' : ''}`}
                        style={{
                            transform: desktopLayout ? undefined : `translateX(${dragX}px) rotate(${rotateDeg}deg)`,
                            opacity: busy ? 0.88 : 1,
                        }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUpOrCancel}
                        onPointerCancel={handlePointerUpOrCancel}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                            <div style={{ fontSize: 'clamp(9px, 2.6vw, 11px)', letterSpacing: '0.14em', color: '#f97316' }}>
                                ⚡ LIVE_GIG
                            </div>
                            <Briefcase size={18} strokeWidth={2} color="#f97316" />
                        </div>
                        <h2
                            style={{
                                fontSize: 'clamp(1rem, 4.2vw, 1.15rem)',
                                fontWeight: 800,
                                margin: '0 0 8px',
                                lineHeight: 1.25,
                                color: '#f3f3f3',
                                textTransform: 'none',
                            }}
                        >
                            {offer.title}
                        </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', fontSize: 'clamp(11px, 3.2vw, 13px)', color: '#bdbdbd', marginBottom: 10, textTransform: 'none' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Coins size={14} /> <strong style={{ color: '#fff' }}>{offer.budget}</strong>
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Calendar size={14} /> <strong style={{ color: '#fff' }}>{offer.duration}</strong>
                            </span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#888', letterSpacing: '0.06em', marginBottom: 4 }}>SKILLS</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                            {skillList.length === 0 ? (
                                <span style={{ fontSize: 12, color: '#777', textTransform: 'none' }}>—</span>
                            ) : (
                                skillList.map((s, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            padding: '3px 8px',
                                            borderRadius: 999,
                                            background: 'rgba(249,115,22,0.12)',
                                            border: '1px solid rgba(249,115,22,0.35)',
                                            fontSize: '11px',
                                            textTransform: 'none',
                                            color: '#ffedd5',
                                        }}
                                    >
                                        {String(s)}
                                    </span>
                                ))
                            )}
                        </div>
                        <div
                            style={{
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '10px 12px',
                                marginBottom: offer.description ? 10 : 0,
                                background: 'rgba(0,0,0,0.25)',
                                textTransform: 'none',
                            }}
                        >
                            <div style={{ fontSize: '10px', color: '#666', letterSpacing: '0.08em', marginBottom: 6 }}>RECRUITER</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: '50%',
                                        background: '#2a2a2e',
                                        border: '1px solid #444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <User size={17} color="#888" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#eee' }}>{offer.clientName}</div>
                                    <div style={{ fontSize: '11px', color: '#888', wordBreak: 'break-all' }}>{offer.clientEmail}</div>
                                    <div style={{ fontSize: '11px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                        <Shield size={12} /> Trust {offer.clientTrust ?? '—'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {offer.description && (
                            <p style={{ fontSize: '13px', color: '#ababab', lineHeight: 1.45, marginBottom: 12, textTransform: 'none' }}>
                                {offer.description}
                            </p>
                        )}

                        <div className="daily-gig-freelancer-actions" role="group" aria-label="Respond to gig offer">
                            <button
                                type="button"
                                className="ind-btn ind-btn-outline daily-gig-btn-decline"
                                disabled={busy}
                                onClick={() => onReject({ timedOut: false, offerId: offer.offerId })}
                            >
                                Decline
                            </button>
                            <button
                                type="button"
                                className="ind-btn ind-btn-orange daily-gig-btn-accept"
                                disabled={busy}
                                onClick={() => onAccept()}
                            >
                                {busy ? '…' : 'Accept'}
                            </button>
                        </div>
                        <p className="daily-gig-pill-help daily-gig-pill-help--mobile">
                            Swipe the card left to decline, right to accept · auto-declines after {Math.round(visibilityMs / 1000)}s
                        </p>
                        <p className="daily-gig-pill-help daily-gig-pill-help--desktop">
                            Decline or Accept using the buttons above · offer closes after {Math.round(visibilityMs / 1000)}s
                        </p>
                    </article>
                </div>
            </div>
        </div>
    );
}

/** Oldest pending offer is actionable on top; newer offers stack above like browser tabs */
function FreelancerGigOfferStack({ offers, busy, onAccept, onReject }) {
    const front = offers[0];
    const behindFull = offers.length > 1 ? offers.slice(1).reverse() : [];
    const trimmed =
        behindFull.length > MAX_VISIBLE_PEEK_STRIPS ? behindFull.slice(-MAX_VISIBLE_PEEK_STRIPS) : behindFull;
    const overflowExtra = Math.max(0, behindFull.length - trimmed.length);
    const behindVisible = trimmed;
    const peelCount = behindVisible.length + (overflowExtra > 0 ? 1 : 0);
    const visibilityMs = offerVisibilityMsRemaining(front);

    return (
        <div className="daily-gig-stack">
            {behindFull.length > 0 && (
                <div className="daily-gig-stack__peels">
                    {overflowExtra > 0 && (
                        <div className="daily-gig-stack-peel-slot daily-gig-stack-peel-slot--overflow" style={{ zIndex: 1 }}>
                            <FreelancerGigPeekOverflowStrip extraCount={overflowExtra} />
                        </div>
                    )}
                    {behindVisible.map((o, peelIdx) => (
                        <div
                            key={o.offerId}
                            className="daily-gig-stack-peel-slot"
                            style={{ zIndex: (overflowExtra > 0 ? 1 : 0) + peelIdx + 1 }}
                        >
                            <FreelancerGigPeekStrip offer={o} layerFromBack={behindVisible.length - 1 - peelIdx} />
                        </div>
                    ))}
                </div>
            )}
            <div className="daily-gig-stack__front" style={{ zIndex: peelCount + 2 }}>
                <FreelancerGigSwipeSheet
                    key={front.offerId}
                    offer={front}
                    busy={busy}
                    onAccept={onAccept}
                    onReject={onReject}
                    visibilityMs={visibilityMs}
                />
            </div>
        </div>
    );
}

function ClientGigAcceptedSheet({ alert: a, onClose, onOpenChat, visibilityMs }) {
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        const t = window.setTimeout(() => {
            onCloseRef.current();
        }, visibilityMs);
        return () => clearTimeout(t);
    }, [a?.id, visibilityMs]);

    return (
        <div className="daily-gig-sheet">
            <div className="daily-gig-timer" aria-hidden>
                <div
                    key={`ct-${a.id}`}
                    className="daily-gig-timer__bar"
                    style={{
                        animationName: 'daily-gig-timer-shrink',
                        animationDuration: `${visibilityMs}ms`,
                    }}
                />
            </div>
            <div
                className="daily-gig-swipe-card"
                style={{
                    borderRadius: '16px 16px 0 0',
                    borderTop: '2px solid #f97316',
                    borderBottom: 'none',
                    alignSelf: 'stretch',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Layers size={20} color="#f97316" />
                    <button
                        type="button"
                        aria-label="Dismiss"
                        onClick={() => {
                            onClose();
                        }}
                        style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', touchAction: 'manipulation', minWidth: 44, minHeight: 44 }}
                    >
                        <XIcon size={20} />
                    </button>
                </div>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#888' }}>ACCEPT_NOTICE</div>
                <h3 style={{ fontSize: 'clamp(15px, 4vw, 18px)', fontWeight: 800, margin: '6px 0', color: '#f3f3f3', textTransform: 'none' }}>
                    {a.gigTitle}
                </h3>
                <p style={{ fontSize: 'clamp(12px, 3.4vw, 14px)', color: '#c4c4c4', marginBottom: 14, lineHeight: 1.45, textTransform: 'none' }}>
                    <strong style={{ color: '#fff' }}>{a.freelancerName}</strong> accepted your instant gig. Chat to align next steps.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="ind-btn ind-btn-outline" style={{ flex: 1, minHeight: 44 }} onClick={() => onClose()}>
                        Later
                    </button>
                    <button type="button" className="ind-btn ind-btn-orange" style={{ flex: 1, minHeight: 44 }} onClick={() => onOpenChat()}>
                        Open chat
                    </button>
                </div>
            </div>
        </div>
    );
}

const DailyGigLiveLayer = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [freelancerOffers, setFreelancerOffers] = useState([]);
    const [clientAlert, setClientAlert] = useState(null);
    const [busy, setBusy] = useState(false);
    const seenRecruiterAlertIds = useRef(new Set());
    const offerRef = useRef(null);
    const gigMutex = useRef(false);
    const freelancerProfileSynced = useRef(false);

    useEffect(() => {
        offerRef.current = freelancerOffers[0] ?? null;
    }, [freelancerOffers]);

    useEffect(() => {
        if (!user) {
            freelancerProfileSynced.current = false;
            return;
        }
        if (user.role !== 'freelancer' || freelancerProfileSynced.current) return;
        freelancerProfileSynced.current = true;
        refreshUser();
    }, [user?.id, user?.role, refreshUser]);

    const buildFreelancerOfferStack = useCallback((rows) => {
        const dismissed = dismissedOfferIds();
        const pending = rows.filter((r) => !dismissed.has(Number(r.offerId)));
        pending.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return pending;
    }, []);

    useEffect(() => {
        if (user?.role !== 'freelancer' || !user?.dailyGigMode) {
            setFreelancerOffers([]);
            return;
        }
        let cancel = false;
        const poll = async () => {
            try {
                const res = await gigsAPI.getFreelancerOffers();
                if (cancel || !res.success || !Array.isArray(res.data)) return;
                setFreelancerOffers(buildFreelancerOfferStack(res.data));
            } catch {
                /* ignore */
            }
        };
        poll();
        const iv = setInterval(poll, POLL_MS_FREELANCER);
        return () => {
            cancel = true;
            clearInterval(iv);
        };
    }, [user?.role, user?.dailyGigMode, buildFreelancerOfferStack]);

    useEffect(() => {
        if (user?.role !== 'client') {
            setClientAlert(null);
            return;
        }
        let cancel = false;
        const poll = async () => {
            try {
                const res = await gigsAPI.getRecruiterAlerts(true);
                if (cancel || !res.success || !Array.isArray(res.data) || !res.data.length) return;
                const first = res.data[0];
                if (seenRecruiterAlertIds.current.has(first.id)) return;
                seenRecruiterAlertIds.current.add(first.id);
                setClientAlert(first);
            } catch {
                /* ignore */
            }
        };
        poll();
        const iv = setInterval(poll, POLL_MS_CLIENT);
        return () => {
            cancel = true;
            clearInterval(iv);
        };
    }, [user?.role]);

    const finalizeReject = useCallback(async (offerId, opts = {}) => {
        const cur = offerRef.current;
        if (!cur || cur.offerId !== offerId) return;
        if (gigMutex.current) return;
        gigMutex.current = true;
        setBusy(true);
        try {
            await gigsAPI.respondToOffer(offerId, 'reject');
            dismissOfferStorage(offerId);
            setFreelancerOffers((prev) => prev.filter((o) => o.offerId !== offerId));
            if (opts.timedOut) toast('Time up — gig auto-declined', { icon: '⏱', duration: 3500 });
            else toast.success('Declined');
        } catch (err) {
            if (!opts.timedOut) toast.error(err.response?.data?.message || 'Could not decline');
        } finally {
            gigMutex.current = false;
            setBusy(false);
        }
    }, []);

    const handleRejectFromSwipe = useCallback(
        (payload = {}) => {
            const oid = payload.offerId ?? offerRef.current?.offerId;
            if (!oid) return;
            finalizeReject(oid, { timedOut: !!payload.timedOut });
        },
        [finalizeReject],
    );

    const handleAcceptOffer = useCallback(async () => {
        const cur = offerRef.current;
        if (!cur || gigMutex.current) return;
        gigMutex.current = true;
        setBusy(true);
        try {
            const res = await gigsAPI.respondToOffer(cur.offerId, 'accept');
            if (!res.success) throw new Error(res.message || 'failed');
            const clientId = res.data?.clientId;
            dismissOfferStorage(cur.offerId);
            setFreelancerOffers((prev) => prev.filter((o) => o.offerId !== cur.offerId));
            toast.success('Gig accepted — opening messages');
            navigate(`/messages?with=${encodeURIComponent(clientId)}`);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Accept failed');
        } finally {
            gigMutex.current = false;
            setBusy(false);
        }
    }, [navigate]);

    const closeClientPopup = async (markRead) => {
        if (!clientAlert) return;
        if (markRead) {
            try {
                await gigsAPI.markRecruiterAlertRead(clientAlert.id);
            } catch {
                /* ignore */
            }
        }
        setClientAlert(null);
    };

    if (freelancerOffers.length > 0) {
        return createPortal(
            <div
                className={`daily-gig-overlay${freelancerOffers.length > 1 ? ' daily-gig-overlay--stacked' : ''}`}
            >
                {freelancerOffers.length > 1 && (
                    <div className="daily-gig-stack-count-pill" role="status" aria-live="polite">
                        {freelancerOffers.length} gigs
                    </div>
                )}
                <FreelancerGigOfferStack
                    offers={freelancerOffers}
                    busy={busy}
                    onAccept={handleAcceptOffer}
                    onReject={handleRejectFromSwipe}
                />
            </div>,
            document.body,
        );
    }

    if (clientAlert && user?.role === 'client') {
        return createPortal(
            <div className="daily-gig-overlay">
                <ClientGigAcceptedSheet
                    alert={clientAlert}
                    visibilityMs={INSTANT_GIG_VISIBILITY_MS}
                    onClose={() => closeClientPopup(true)}
                    onOpenChat={() => {
                        navigate(`/messages?with=${encodeURIComponent(clientAlert.freelancerId)}`);
                        closeClientPopup(true);
                    }}
                />
            </div>,
            document.body,
        );
    }

    return null;
};

export default DailyGigLiveLayer;
