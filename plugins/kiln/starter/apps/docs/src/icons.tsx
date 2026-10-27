// Inline icon set for the docs and the anchor card. Stroke icons inherit currentColor.
import type { SVGProps } from 'react';

const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
type P = SVGProps<SVGSVGElement>;

export const IconPencil = (p: P) => <svg {...base} {...p}><path d="M4 20l4.5-1 10-10a2.1 2.1 0 00-3-3l-10 10L4 20z" /></svg>;
export const IconPin = (p: P) => <svg {...base} {...p}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>;
export const IconLink = (p: P) => <svg {...base} {...p}><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" /></svg>;
export const IconCalendar = (p: P) => <svg {...base} {...p}><rect x="4" y="5.5" width="16" height="14" rx="2.5" /><path d="M4 10h16M9 3.5v4M15 3.5v4" /></svg>;
export const IconReply = (p: P) => <svg {...base} {...p}><path d="M4.5 11.5a7 7 0 017-7h1a7 7 0 010 14H9l-4 3v-4.5a7 7 0 01-.5-2.5z" /></svg>;
export const IconRepost = (p: P) => <svg {...base} {...p}><path d="M7 4L4 7l3 3M4 7h11a4 4 0 014 4v1M17 20l3-3-3-3M20 17H9a4 4 0 01-4-4v-1" /></svg>;
export const IconHeart = (p: P) => <svg {...base} {...p}><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.4 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z" /></svg>;
export const IconViews = (p: P) => <svg {...base} strokeWidth={1.9} {...p}><path d="M5 19V12M10 19V6M15 19v-9M20 19v-4" /></svg>;
export const IconShare = (p: P) => <svg {...base} {...p}><path d="M12 15V4M8 8l4-4 4 4M6 12v6a2 2 0 002 2h8a2 2 0 002-2v-6" /></svg>;
export const IconMore = (p: P) => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><circle cx="5.5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="18.5" cy="12" r="1.8" /></svg>;
export const IconArrow = (p: P) => <svg {...base} strokeWidth={1.6} {...p}><path d="M3 12h17M15 7l5 5-5 5" /></svg>;
export const IconVerified = ({ label = 'Verified', ...p }: P & { label?: string }) => (
  <svg viewBox="0 0 24 24" role="img" aria-label={label} {...p}>
    <path fill="currentColor" d="M12 1.5l2.6 2 3.3-.3 1 3.1 2.8 1.8-1.1 3.1 1.1 3.1-2.8 1.8-1 3.1-3.3-.3-2.6 2-2.6-2-3.3.3-1-3.1-2.8-1.8 1.1-3.1-1.1-3.1 2.8-1.8 1-3.1 3.3.3z" />
    <path fill="none" stroke="var(--ds-action-accent)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" d="M8 12.2l2.7 2.6L16.2 9" />
  </svg>
);
export const IconChevronDown = (p: P) => <svg {...base} strokeWidth={2} {...p}><path d="M7 10l5 5 5-5" /></svg>;
