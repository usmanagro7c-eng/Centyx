import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ColorBlindMode = "normal" | "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";
export type TextSize = "sm" | "md" | "lg" | "xl";
export type FontChoice = "default" | "dyslexic";
export type CursorSize = "normal" | "large" | "xl";

export type A11yState = {
  colorBlind: ColorBlindMode;
  highContrast: boolean;
  textSize: TextSize;
  font: FontChoice;
  reduceMotion: boolean;
  cursorSize: CursorSize;
  keyboardNav: boolean;
  focusRing: boolean;
  screenReader: boolean;

  setColorBlind: (m: ColorBlindMode) => void;
  setHighContrast: (v: boolean) => void;
  setTextSize: (t: TextSize) => void;
  setFont: (f: FontChoice) => void;
  setReduceMotion: (v: boolean) => void;
  setCursorSize: (c: CursorSize) => void;
  setKeyboardNav: (v: boolean) => void;
  setFocusRing: (v: boolean) => void;
  setScreenReader: (v: boolean) => void;
  reset: () => void;
};

const defaults = {
  colorBlind: "normal" as ColorBlindMode,
  highContrast: false,
  textSize: "md" as TextSize,
  font: "default" as FontChoice,
  reduceMotion: false,
  cursorSize: "normal" as CursorSize,
  keyboardNav: false,
  focusRing: false,
  screenReader: false,
};

export const useA11y = create<A11yState>()(
  persist(
    (set) => ({
      ...defaults,
      setColorBlind: (colorBlind) => set({ colorBlind }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setTextSize: (textSize) => set({ textSize }),
      setFont: (font) => set({ font }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setCursorSize: (cursorSize) => set({ cursorSize }),
      setKeyboardNav: (keyboardNav) => set({ keyboardNav }),
      setFocusRing: (focusRing) => set({ focusRing }),
      setScreenReader: (screenReader) => set({ screenReader }),
      reset: () => set({ ...defaults }),
    }),
    { name: "aether-a11y" }
  )
);
