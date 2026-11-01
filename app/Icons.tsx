import type { CSSProperties, ReactNode } from "react";
export type IconName = "shield" | "file" | "arrow" | "external" | "phone" | "mic" | "check" | "wallet" | "lock" | "user" | "bag" | "message" | "help" | "book" | "globe";
const paths: Record<IconName, ReactNode> = {
  shield: <><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/></>,
  file: <><path d="M14 3H5v18h14V8l-5-5Z"/><path d="M14 3v5h5M8 12h8M8 16h6"/></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  external: <><path d="M14 4h6v6m0-6L10 14"/><path d="M10 4H4v16h16v-6"/></>,
  phone: <path d="m7 3 3 5-3 3c1.5 3 3 4.5 6 6l3-3 5 3-2 4C10 22 2 14 3 5l4-2Z"/>,
  mic: <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  wallet: <><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 8V5l14-3v4m4 5h-6v5h6m-3-2.5h.01"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></>,
  user: <><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
  bag: <><path d="M5 7h14l2 14H3L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></>,
  message: <><path d="M21 3H3v14h4v4l5-4h9V3Z"/><path d="M7 8h10M7 12h6"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 1c0 2-3 2-3 5m0 3h.01"/></>,
  book: <><path d="M12 5C8 3 5 3 2 4v15c3-1 6-1 10 1 4-2 7-2 10-1V4c-3-1-6-1-10 1Zm0 0v15"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>,
};
export function Icon({ name, className = "", style }: { name: IconName; className?: string; style?: CSSProperties }) {
  return <svg className={`icon ${className}`} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
