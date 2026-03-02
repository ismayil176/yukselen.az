"use client";

/**
 * Floating WhatsApp shortcut.
 * Opens the chat with the configured number.
 */
export function FloatingWhatsapp() {
  const number = "994508066470"; // +994 50 806 64 70
  const href = `https://wa.me/${number}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg shadow-black/15 ring-1 ring-black/10 hover:shadow-black/20"
      aria-label="WhatsApp"
      title="WhatsApp"
    >
      <WhatsappIcon className="h-7 w-7" />
    </a>
  );
}

function WhatsappIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        fill="rgba(34,197,94,0.9)"
        d="M16 2.5C8.6 2.5 2.6 8.5 2.6 15.9c0 2.6.7 5 2.1 7.1L3 29.5l6.7-1.7c2 .9 4.1 1.4 6.3 1.4 7.4 0 13.4-6 13.4-13.4S23.4 2.5 16 2.5z"
      />
      <path
        fill="white"
        d="M23.1 19.5c-.3-.2-1.7-.8-1.9-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-.9 1-.2.2-.4.2-.7.1-.3-.2-1.2-.4-2.3-1.4-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.6-1-2.2-.3-.6-.6-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.2 1.4 3.4c.2.2 2.3 3.5 5.6 4.9.8.3 1.4.5 1.9.6.8.2 1.5.2 2 .1.6-.1 1.7-.7 2-1.3.2-.6.2-1.1.2-1.3 0-.2-.2-.2-.4-.3z"
      />
    </svg>
  );
}
