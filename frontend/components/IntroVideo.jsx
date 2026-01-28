"use client";
import { useEffect, useRef, useState } from 'react';

export default function IntroVideo(){
  // Decide visibility immediately on first client render to avoid brief flash
  const [show, setShow] = useState(()=>{
    const always = String(process.env.NEXT_PUBLIC_INTRO_ALWAYS||'').trim() === '1';
    if (always) return true;
    try { return !localStorage.getItem('introSeen'); } catch { return true; }
  });
  const [fading, setFading] = useState(false);
  const [err, setErr] = useState(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const videoRef = useRef(null);
  const endTimerRef = useRef(null);
  const hardTimerRef = useRef(null);
  const finishedRef = useRef(false);
  const startTsRef = useRef(0);
  const rafRef = useRef(0);
  // Use absolute public URL so it resolves correctly across routes
  const src = (process.env.NEXT_PUBLIC_INTRO_VIDEO && String(process.env.NEXT_PUBLIC_INTRO_VIDEO)) || '/intro.mp4';
  const allowSkip = String(process.env.NEXT_PUBLIC_INTRO_ALLOW_SKIP||'0').trim() === '1';
  const hardTimeoutSec = Number(String(process.env.NEXT_PUBLIC_INTRO_HARD_TIMEOUT_SEC||'12'));

  // No post-mount toggle of `show` to prevent premature hiding

  useEffect(()=>{
    if (!show) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
      clearTimeout(endTimerRef.current);
      clearTimeout(hardTimerRef.current);
  cancelAnimationFrame(rafRef.current);
    };
  },[show]);

  const finish = ()=>{
    if (finishedRef.current) return;
    finishedRef.current = true;
    const always = String(process.env.NEXT_PUBLIC_INTRO_ALWAYS||'').trim() === '1';
    if (!always) { try { localStorage.setItem('introSeen','1'); } catch {} }
    // Reveal the site immediately while overlay fades
    try { document.documentElement.classList.remove('intro-hold'); } catch {}
  clearTimeout(endTimerRef.current);
  clearTimeout(hardTimerRef.current);
  cancelAnimationFrame(rafRef.current);
  setFading(true);
    setTimeout(()=> {
      setShow(false);
    }, 300);
  };
  const skip = ()=>{
    // Do not mark as seen when skipping so it shows again next time unless ALWAYS=0 and user later watches fully
  clearTimeout(endTimerRef.current);
  clearTimeout(hardTimerRef.current);
  cancelAnimationFrame(rafRef.current);
    setFading(true);
    setTimeout(()=> {
      try { document.documentElement.classList.remove('intro-hold'); } catch {}
      setShow(false);
    }, 300);
  };

  if (!show) return null;
  return (
    // Mark as intro-allow so global CSS doesn't hide it while intro-hold is active
    <div className={`intro-allow fixed inset-0 z-[80] ${fading? 'opacity-0':'opacity-100'} transition-opacity duration-300 bg-black`}> 
      <div className="absolute inset-0 grid place-items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          src={src}
          muted
          autoPlay
          playsInline
          preload="auto"
          disablePictureInPicture
          controls={false}
          onLoadedMetadata={()=>{
            const v = videoRef.current;
            if (!v) return;
            if (isFinite(v.duration)) setDuration(v.duration);
            // Try to autoplay; if blocked, ask for tap
            const p = v.play();
            if (p && typeof p.then === 'function') {
              p.then(()=>{
                if (!startTsRef.current) startTsRef.current = Date.now();
                // start RAF-based progress loop
                cancelAnimationFrame(rafRef.current);
                const tick = ()=>{
                  if (finishedRef.current) return;
                  const denom = (isFinite(v.duration) && v.duration>0) ? v.duration : hardTimeoutSec;
                  const elapsed = (Date.now() - startTsRef.current) / 1000;
                  setCurrent(isFinite(v.currentTime) && v.currentTime>0 ? v.currentTime : elapsed);
                  if (denom && elapsed >= denom - 0.05) { finish(); return; }
                  rafRef.current = requestAnimationFrame(tick);
                };
                rafRef.current = requestAnimationFrame(tick);
                // Schedule a safety timer using real duration
                clearTimeout(endTimerRef.current);
                if (isFinite(v.duration) && v.duration > 0) {
                  endTimerRef.current = setTimeout(()=>{
                    if (v.currentTime + 0.2 >= v.duration) finish();
                  }, Math.ceil(v.duration * 1000) + 200);
                }
                // Hard fallback (e.g., if ended never fires)
                clearTimeout(hardTimerRef.current);
                const hardMs = (isFinite(v.duration) && v.duration > 0)
                  ? Math.max(500, Math.round((v.duration - 1) * 1000))
                  : Math.max(500, Math.round(hardTimeoutSec * 1000));
                hardTimerRef.current = setTimeout(()=> finish(), hardMs);
              }).catch(()=>{ setNeedsTap(true); });
            }
          }}
          onPlay={()=>{
            const v = videoRef.current; if (!v) return;
            if (!startTsRef.current) startTsRef.current = Date.now();
            cancelAnimationFrame(rafRef.current);
            const denom = (isFinite(v.duration) && v.duration>0) ? v.duration : hardTimeoutSec;
            const tick = ()=>{
              if (finishedRef.current) return;
              const elapsed = (Date.now() - startTsRef.current) / 1000;
              setCurrent(isFinite(v.currentTime) && v.currentTime>0 ? v.currentTime : elapsed);
              if (denom && elapsed >= denom - 0.05) { finish(); return; }
              rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
          }}
          onEnded={()=>{ clearTimeout(endTimerRef.current); finish(); }}
          onError={(e)=>{ setErr('Video failed to load.'); }}
          onTimeUpdate={()=>{
            const v = videoRef.current; if (!v || finishedRef.current) return;
            if (isFinite(v.currentTime)) setCurrent(v.currentTime);
            if (isFinite(v.duration) && v.duration > 0 && v.currentTime >= v.duration - 0.05) {
              clearTimeout(endTimerRef.current);
              finish();
            }
          }}
        />
      </div>
      {needsTap && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={()=>{ const v = videoRef.current; if (v) { v.play().then(()=> setNeedsTap(false)).catch(()=>{}); } }}
            className="px-5 py-3 rounded bg-white/10 border border-white/20 text-white text-sm backdrop-blur"
          >Play Intro</button>
        </div>
      )}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={()=>{ const v = videoRef.current; if (v) { v.muted = !v.muted; try{ v.play(); }catch{} } }}
          className="px-3 py-1.5 rounded bg-gray-900/70 text-gray-200 border border-white/10 text-xs"
        >Toggle Sound</button>
        {allowSkip && (
          <button
            onClick={skip}
            className="px-3 py-1.5 rounded bg-gray-900/70 text-gray-200 border border-white/10 text-xs"
          >Skip</button>
        )}
      </div>
      <div className="absolute bottom-6 left-0 right-0 text-center text-gray-300 text-xs tracking-wide">
        {err ? (
          <div className="inline-flex items-center gap-3">
            <span>{err}</span>
            <button onClick={()=>window.location.reload()} className="px-2 py-1 rounded bg-gray-800 border border-white/10">Reload</button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto w-3/5 max-w-xl h-1.5 bg-white/10 rounded overflow-hidden">
              <div
                className="h-full bg-white/70 transition-[width] duration-200"
                style={{
                  width: (()=>{
                    const denom = duration && isFinite(duration) ? duration : hardTimeoutSec;
                    const value = denom ? (current/denom) : 0;
                    return `${Math.min(100, Math.max(0, value*100))}%`;
                  })()
                }}
              />
            </div>
            <span>
              {(()=>{
                const denom = duration && isFinite(duration) ? duration : hardTimeoutSec;
                const remain = Math.max(0, Math.ceil(denom - current));
                return `Enjoy a quick intro. ${remain}s remaining…`;
              })()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
