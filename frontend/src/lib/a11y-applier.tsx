import { useEffect } from "react";
import { useA11y } from "@/lib/a11y-store";

/**
 * Applies accessibility preferences to <html> via data-* attributes.
 * All visual behavior is driven from CSS attribute selectors in styles.css.
 */
export function A11yApplier() {
  const s = useA11y();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const h = document.documentElement;

    // Color blind mode (only set when not normal, so default palette applies)
    if (s.colorBlind === "normal") h.removeAttribute("data-cb");
    else h.setAttribute("data-cb", s.colorBlind);

    h.toggleAttribute("data-hc", s.highContrast);
    h.setAttribute("data-text", s.textSize);
    h.setAttribute("data-font", s.font);
    h.toggleAttribute("data-reduce-motion", s.reduceMotion);
    h.setAttribute("data-cursor", s.cursorSize);
    h.toggleAttribute("data-kbd", s.keyboardNav);
    h.toggleAttribute("data-focus-ring", s.focusRing);
    h.toggleAttribute("data-sr", s.screenReader);
  }, [s.colorBlind, s.highContrast, s.textSize, s.font, s.reduceMotion, s.cursorSize, s.keyboardNav, s.focusRing, s.screenReader]);

  return null;
}

/** Pre-hydration script that applies stored a11y prefs before React mounts. */
export const a11yInitScript = `(function(){try{var raw=localStorage.getItem('aether-a11y');if(!raw)return;var s=(JSON.parse(raw)||{}).state||{};var h=document.documentElement;if(s.colorBlind&&s.colorBlind!=='normal')h.setAttribute('data-cb',s.colorBlind);if(s.highContrast)h.setAttribute('data-hc','');h.setAttribute('data-text',s.textSize||'md');h.setAttribute('data-font',s.font||'default');if(s.reduceMotion)h.setAttribute('data-reduce-motion','');h.setAttribute('data-cursor',s.cursorSize||'normal');if(s.keyboardNav)h.setAttribute('data-kbd','');if(s.focusRing)h.setAttribute('data-focus-ring','');if(s.screenReader)h.setAttribute('data-sr','');}catch(e){}})();`;
