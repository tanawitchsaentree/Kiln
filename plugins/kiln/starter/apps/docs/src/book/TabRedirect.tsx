// /components/<slug> opens its Usage tab (component-depth.md). Replace, so Back does not bounce.
import { useLayoutEffect } from 'react';

export function TabRedirect({ to }: { to: string }) {
  useLayoutEffect(() => {
    history.replaceState(null, '', `${to}${location.search}${location.hash}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [to]);
  return null;
}
