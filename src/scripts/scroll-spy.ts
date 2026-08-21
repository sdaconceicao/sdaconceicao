/**
 * Which nav item should read as current, given the set of sections currently
 * intersecting the activation band.
 *
 * Extracted from the DOM so the tie-break rule is testable: DOCUMENT ORDER
 * wins, not observer-callback order. Without that, a fast scroll can land on
 * the wrong item because IntersectionObserver batches entries arbitrarily.
 */
export const pickActiveSection = (
  sectionIdsInDocumentOrder: string[],
  visibleIds: Iterable<string>,
): string | undefined => {
  const visible = new Set(visibleIds);
  return sectionIdsInDocumentOrder.find((id) => visible.has(id));
};

/** The fragment a nav link points at, without the "#". */
export const hrefToId = (href: string | null): string | undefined => {
  if (!href?.startsWith("#") || href.length < 2) return undefined;
  return href.slice(1);
};
