"use client";
import Script from 'next/script';

export default function IntroGuard(){
  const always = String(process.env.NEXT_PUBLIC_INTRO_ALWAYS||'').trim() === '1';
  return (
    <Script id="intro-guard" strategy="beforeInteractive">
      {`
      (function(){
        try{
          var always=${always ? 'true':'false'};
          var seen=localStorage.getItem('introSeen');
          if(always || !seen){ document.documentElement.classList.add('intro-hold'); }
        }catch(e){ document.documentElement.classList.add('intro-hold'); }
      })();
      `}
    </Script>
  );
}
