import { useEffect, useState } from 'react';
import './SplashScreen.css';

const NAME = 'studyzflow';
const SHOW_MS = 1900;
const FADE_MS = 500;

/** Pure CSS/SVG animated splash: no image assets. Matches the native splash colour (#0b0f19) for a seamless handoff. */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), SHOW_MS);
    const t2 = setTimeout(onDone, SHOW_MS + FADE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div className={`sf-splash${leaving ? ' sf-splash--leaving' : ''}`} role="status" aria-label="Loading studyzflow">
      <div className="sf-orb sf-orb--a" />
      <div className="sf-orb sf-orb--b" />
      <div className="sf-orb sf-orb--c" />

      <div className="sf-center">
        <div className="sf-logo-wrap">
          <span className="sf-pulse" />
          <span className="sf-pulse sf-pulse--2" />
          <img className="sf-logo" src="/logo.svg" alt="" width={96} height={96} />
        </div>

        <h1 className="sf-title" aria-label={NAME}>
          {NAME.split('').map((ch, i) => (
            <span key={i} style={{ animationDelay: `${0.45 + i * 0.05}s` }} aria-hidden="true">
              {ch}
            </span>
          ))}
        </h1>
        <p className="sf-tag">Focus &bull; Plan &bull; Achieve</p>

        <div className="sf-bar"><span /></div>
      </div>
    </div>
  );
}
