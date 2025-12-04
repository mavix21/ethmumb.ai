/**
 * Default slot for the @sheet parallel route.
 *
 * This file is required for parallel routes. It renders when:
 * - The user navigates to a route that doesn't have a matching interceptor
 * - On initial page load when no sheet should be shown
 *
 * Returning null means nothing is rendered in the sheet slot.
 */
export default function Default() {
  return null;
}
