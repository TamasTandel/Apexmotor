"use client";
import { useEffect, useRef, useState } from 'react';

export default function Reveal({ children, as:Tag='div', delay=0, className='' }){
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(()=>{
    let obs; const el = ref.current; if(!el) return;
    if('IntersectionObserver' in window){
      obs = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(e.isIntersecting){ setShown(true); obs.disconnect(); }
        });
      }, { threshold: 0.12 });
      obs.observe(el);
    } else { setShown(true); }
    return ()=> obs && obs.disconnect();
  },[]);
  return (
    <Tag ref={ref} className={`${className} transition-all duration-700 ease-out will-change-transform ${shown? 'opacity-100 translate-y-0':'opacity-0 translate-y-6'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
