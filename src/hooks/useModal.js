import { useEffect, useRef } from 'react';

// Open modals, topmost last. Escape only closes the topmost one.
const stack = [];

export function isModalOpen() {
  return stack.length > 0;
}

// Locks page scroll and closes on Escape while the calling modal is mounted.
export function useModal(onClose) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const entry = () => closeRef.current?.();
    stack.push(entry);
    document.documentElement.style.overflow = 'hidden';

    function handleKey(e) {
      if (e.key === 'Escape' && stack[stack.length - 1] === entry) entry();
    }
    window.addEventListener('keydown', handleKey);

    return () => {
      stack.splice(stack.indexOf(entry), 1);
      if (stack.length === 0) document.documentElement.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, []);
}

// True when a keypress should be left to the focused control instead of a page-level shortcut.
export function isTypingTarget(target) {
  return Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]'));
}
