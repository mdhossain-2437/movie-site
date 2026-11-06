"use client";

import { useState } from "react";

export function Synopsis({ english, bangla }: { english: string; bangla: string | null }) {
  const [language, setLanguage] = useState<"en" | "bn">("en");
  return (
    <div className="synopsis-block">
      {bangla ? (
        <div className="language-toggle" aria-label="Synopsis language">
          <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>
            English
          </button>
          <button type="button" aria-pressed={language === "bn"} onClick={() => setLanguage("bn")}>
            বাংলা
          </button>
        </div>
      ) : null}
      <p className="synopsis-text" lang={language} aria-live="polite">
        {language === "bn" && bangla ? bangla : english}
      </p>
      {language === "bn" ? (
        <small className="translation-note">
          Bangla editorial draft · translation review pending
        </small>
      ) : null}
    </div>
  );
}
