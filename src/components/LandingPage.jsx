import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import LoginView from './LoginView';

const TOTAL_FRAMES = 240;
const START_FRAME = 2;

export default function LandingPage({ onLoginSuccess }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const outerRef = useRef(null);
  const canvasRef = useRef(null);
  const targetFrameRef = useRef(START_FRAME);
  const currentFrameRef = useRef(START_FRAME);
  const imagesMapRef = useRef(new Map());

  useEffect(() => {
    // 1. Preload image objects into memory map
    const imagesMap = imagesMapRef.current;
    for (let i = START_FRAME; i <= TOTAL_FRAMES; i++) {
      if (!imagesMap.has(i)) {
        const img = new Image();
        img.src = `/frames/ezgif-frame-${String(i).padStart(3, '0')}.jpg`;
        imagesMap.set(i, img);
      }
    }

    // 2. Scroll position calculation
    const onScroll = () => {
      const outer = outerRef.current;
      if (!outer) return;

      const rect = outer.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const progress = scrollable > 0 ? Math.max(0, Math.min(1, scrolled / scrollable)) : 0;

      targetFrameRef.current = START_FRAME + progress * (TOTAL_FRAMES - START_FRAME);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 3. Canvas draw function with object-fit: cover aspect ratio math
    const renderCanvas = (frameNum) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = imagesMap.get(frameNum);
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      const scale = Math.max(cw / iw, ch / ih);
      const nw = iw * scale;
      const nh = ih * scale;
      const cx = (cw - nw) / 2;
      const cy = (ch - nh) / 2;

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, cx, cy, nw, nh);
    };

    // 4. Handle resize
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      renderCanvas(Math.round(currentFrameRef.current));
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // 5. 60fps buttery smooth LERP animation loop
    let animId;
    let lastRenderedFrame = -1;

    const updateFrame = () => {
      // Smooth linear interpolation toward target frame
      currentFrameRef.current += (targetFrameRef.current - currentFrameRef.current) * 0.18;
      const frameToDraw = Math.max(START_FRAME, Math.min(TOTAL_FRAMES, Math.round(currentFrameRef.current)));

      if (frameToDraw !== lastRenderedFrame) {
        renderCanvas(frameToDraw);
        lastRenderedFrame = frameToDraw;
      }

      animId = requestAnimationFrame(updateFrame);
    };

    animId = requestAnimationFrame(updateFrame);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  if (showAuthModal) {
    return (
      <div>
        <button type="button" onClick={() => setShowAuthModal(false)}
          style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 200, backgroundColor: '#171717', border: '1px solid #2A2A2A', color: '#A3A3A3', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Back
        </button>
        <LoginView onLoginSuccess={onLoginSuccess} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#0A0A0A', color: '#D4D4D4' }}>
      <style>{`
        .text-link { color: #737373; text-decoration: none; cursor: pointer; background: none; border: none; padding: 0; font-family: Inter, sans-serif; font-size: 13px; transition: color 0.15s; }
        .text-link:hover { color: #FFFFFF; }
        @media (max-width: 640px) {
          .footer-inner { flex-direction: column !important; gap: 24px !important; }
        }
      `}</style>

      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#FFFFFF', letterSpacing: '-0.5px' }}>HabitTracker</span>
          
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <a href="mailto:connectsonasha@gmail.com" className="text-link" style={{ fontSize: '13px' }}>Contact Us</a>
              <button type="button" className="text-link" onClick={() => setShowTermsModal(true)} style={{ fontSize: '13px' }}>Terms and Conditions</button>
              <button type="button" className="text-link" onClick={() => setShowPrivacyModal(true)} style={{ fontSize: '13px' }}>Privacy Policy</button>
            </div>
            
            <button type="button" onClick={() => setShowAuthModal(true)}
              style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Create Account / Sign In
            </button>
          </div>
        </div>
      </header>

      <div style={{ height: '60px' }} />

      <section style={{ backgroundColor: 'transparent', padding: '60px 24px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 800, color: '#F5F5F5', margin: '0 0 10px', letterSpacing: '-0.6px', lineHeight: 1.25 }}>
            Track your habit and be 1% better.
          </h2>
          <p style={{ fontSize: '14px', color: '#737373', margin: 0, lineHeight: 1.6 }}>
            Small daily improvements compound into massive long-term results.
          </p>
        </div>
      </section>

      <div ref={outerRef} style={{ height: '400vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', backgroundColor: '#0A0A0A' }}>
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 0 }}
          />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '220px', height: '220px', background: 'radial-gradient(circle at bottom right, #0A0A0A 0%, #0A0A0A 65%, transparent 100%)', zIndex: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, #0A0A0A 0%, rgba(10,10,10,0.6) 8%, transparent 25%, transparent 75%, rgba(10,10,10,0.7) 92%, #0A0A0A 100%)', pointerEvents: 'none' }} />
        </div>
      </div>

      <footer style={{ borderTop: '1px solid #141414', backgroundColor: '#0A0A0A', padding: '20px 24px 24px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#444444', letterSpacing: '-0.2px' }}>HabitTracker</span>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#444444' }}>Product by Sonasha</span>
        </div>
      </footer>

      {showTermsModal && (
        <div onClick={e => e.target === e.currentTarget && setShowTermsModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '16px', padding: '40px', maxWidth: '560px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#F5F5F5', margin: '0 0 4px' }}>Terms and Conditions</h2>
                <p style={{ fontSize: '11px', color: '#525252', margin: 0 }}>Last updated {new Date().getFullYear()}</p>
              </div>
              <button type="button" onClick={() => setShowTermsModal(false)} style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', color: '#737373', cursor: 'pointer', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ fontSize: '13px', color: '#A3A3A3', lineHeight: 1.85, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0 }}>Welcome to HabitTracker.</p>
              <p style={{ margin: 0 }}>HabitTracker is built to help you track your habits, monitor your sleep, understand your progress, and become 1% better every day.</p>
              <p style={{ margin: 0 }}>By using HabitTracker, you agree to use the product for personal productivity, habit building, self-improvement, and progress tracking.</p>
              <p style={{ margin: 0 }}>Your scores, streaks, analytics, graphs, and insights are generated from the information you provide and are intended to help you understand and improve your consistency.</p>
              <p style={{ margin: 0 }}>HabitTracker does not promise instant transformation. Your results depend on your own actions, consistency, discipline, and commitment.</p>
              <div style={{ borderLeft: '2px solid #2A2A2A', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', color: '#D4D4D4' }}>
                {['Show up every day.', 'Track your habits.', 'Build discipline.', 'Improve by 1%.', 'Keep going.'].map((t, i) => <p key={i} style={{ margin: 0 }}>{t}</p>)}
              </div>
              <p style={{ margin: 0 }}>No one can stop you from becoming the best version of yourself if you stay consistent and refuse to quit.</p>
              <p style={{ margin: 0 }}>Use HabitTracker as a tool to build the discipline required to become the best you know you can be.</p>
              <p style={{ margin: 0, fontStyle: 'italic', color: '#D4D4D4', borderLeft: '2px solid #2A2A2A', paddingLeft: '14px' }}>After using HabitTracker, no one can stop you from becoming the beast you were meant to become.</p>
              <p style={{ margin: 0 }}>Keep showing up. Keep improving. Keep building.</p>
              <p style={{ margin: 0 }}>By continuing to use HabitTracker, you acknowledge and agree to these Terms and Conditions.</p>
            </div>
            <button type="button" onClick={() => setShowTermsModal(false)} style={{ width: '100%', padding: '12px', backgroundColor: '#FFFFFF', color: '#0A0A0A', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginTop: '32px' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div onClick={e => e.target === e.currentTarget && setShowPrivacyModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '16px', padding: '40px', maxWidth: '560px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#F5F5F5', margin: '0 0 4px' }}>Privacy Policy</h2>
                <p style={{ fontSize: '11px', color: '#525252', margin: 0 }}>Last updated {new Date().getFullYear()}</p>
              </div>
              <button type="button" onClick={() => setShowPrivacyModal(false)} style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', color: '#737373', cursor: 'pointer', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ fontSize: '13px', color: '#A3A3A3', lineHeight: 1.85, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#F5F5F5' }}>Your privacy matters.</p>
              <p style={{ margin: 0 }}>HabitTracker is designed to keep your personal habit-tracking experience private.</p>
              <div style={{ borderLeft: '2px solid #2A2A2A', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['We do not sell your personal data.', 'We do not use your personal information for advertising.', 'We do not share your personal information with third parties for advertising or marketing purposes.'].map((t, i) => <p key={i} style={{ margin: 0, color: '#D4D4D4' }}>{t}</p>)}
              </div>
              <p style={{ margin: 0 }}>Your habit, sleep, progress, and tracking information is used only to provide the functionality of HabitTracker, including your dashboard, history, scores, analytics, graphs, streaks, and personalized insights.</p>
              <p style={{ margin: 0 }}>Your data belongs to you and is used to provide your HabitTracker experience.</p>
            </div>
            <button type="button" onClick={() => setShowPrivacyModal(false)} style={{ width: '100%', padding: '12px', backgroundColor: '#FFFFFF', color: '#0A0A0A', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginTop: '32px' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
