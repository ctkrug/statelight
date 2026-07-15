/**
 * Wires pointer-drag repositioning for a floating element. Kept generic
 * (handle element + target element, not panel-specific) so it's testable
 * in isolation from the rest of panel.js's DOM wiring.
 *
 * @param {Element} handleEl - element that starts a drag on pointerdown
 * @param {HTMLElement} targetEl - element repositioned via left/top
 * @param {object} [opts]
 * @param {string} [opts.exclude] - a selector; pointerdowns on a matching
 *   descendant of handleEl (e.g. the collapse toggle button) don't start a drag
 * @param {(pos: { left: number, top: number }) => void} [opts.onDragEnd]
 * @returns {{ setPosition: (left: number, top: number) => { left: number, top: number }, destroy: () => void }}
 */
export function makeDraggable(handleEl, targetEl, { exclude, onDragEnd } = {}) {
  let dragging = null;

  function clampedPosition(left, top) {
    const maxLeft = Math.max((window.innerWidth || 0) - targetEl.offsetWidth, 0);
    const maxTop = Math.max((window.innerHeight || 0) - targetEl.offsetHeight, 0);
    return {
      left: Math.min(Math.max(left, 0), maxLeft),
      top: Math.min(Math.max(top, 0), maxTop)
    };
  }

  function setPosition(left, top) {
    const clamped = clampedPosition(left, top);
    targetEl.style.left = `${clamped.left}px`;
    targetEl.style.top = `${clamped.top}px`;
    targetEl.style.right = 'auto';
    targetEl.style.bottom = 'auto';
    return clamped;
  }

  function onPointerDown(event) {
    if (exclude && event.target.closest(exclude)) return;
    const rect = targetEl.getBoundingClientRect();
    dragging = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startLeft: rect.left, startTop: rect.top };
    targetEl.classList.add('is-dragging');
    handleEl.setPointerCapture?.(event.pointerId);
    // Stops the drag from also starting a native text-selection drag.
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    setPosition(dragging.startLeft + (event.clientX - dragging.startX), dragging.startTop + (event.clientY - dragging.startY));
  }

  function onPointerUp(event) {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    dragging = null;
    targetEl.classList.remove('is-dragging');
    const rect = targetEl.getBoundingClientRect();
    onDragEnd?.({ left: rect.left, top: rect.top });
  }

  handleEl.addEventListener('pointerdown', onPointerDown);
  handleEl.addEventListener('pointermove', onPointerMove);
  handleEl.addEventListener('pointerup', onPointerUp);
  handleEl.addEventListener('pointercancel', onPointerUp);

  return {
    setPosition,
    destroy() {
      handleEl.removeEventListener('pointerdown', onPointerDown);
      handleEl.removeEventListener('pointermove', onPointerMove);
      handleEl.removeEventListener('pointerup', onPointerUp);
      handleEl.removeEventListener('pointercancel', onPointerUp);
    }
  };
}
