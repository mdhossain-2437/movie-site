"use client";

export function Synopsis({ english }: { english: string; bangla?: string | null }) {
  return (
    <div className="synopsis-block">
      <p className="synopsis-text">{english}</p>
    </div>
  );
}
