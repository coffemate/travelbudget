let clerkPromise;
const CLERK_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';

function loadClerkScript() {
  if (window.Clerk) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CLERK_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Clerk script')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = CLERK_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Clerk script'));
    document.head.appendChild(script);
  });
}

export function getClerk() {
  if (!clerkPromise) {
    clerkPromise = (async () => {
      const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
      if (!publishableKey) {
        throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
      }
      await loadClerkScript();
      const clerk = new window.Clerk(publishableKey);
      await clerk.load();
      return clerk;
    })();
  }
  return clerkPromise;
}
