// What the collections actually measure, for the layouts a virtualized one is
// given. React Aria's `ListLayout`, `GridLayout`, `TableLayout` and
// `WaterfallLayout` position rows from a size rather than from the DOM, so a
// virtualized List, ListBox, Table or Tree has to be told how tall its rows
// are — and a number guessed at the call site puts every row in the wrong
// place the moment a component's own height changes.
//
// These are that number, and `src/layout.test.ts` renders each collection and
// measures it, so a constant here cannot drift from what the component draws.
//
// They are the heights as rendered, which is what a virtualizer needs — not
// what a spec page names, where the two can differ. They agree today.

/**
 * The heights the collections draw, in pixels, for a virtualized one's
 * layout options.
 *
 * ```tsx
 * <Virtualizer
 *   layout={ListLayout}
 *   layoutOptions={{
 *     rowSize: collectionSizes.listRow,
 *     headingSize: collectionSizes.sectionHeading,
 *   }}
 * >
 *   <List aria-label="Label" items={items}>{renderItem}</List>
 * </Virtualizer>
 * ```
 *
 * A row that wraps is taller than any of these, so a collection whose content
 * varies takes `estimatedRowSize` rather than `rowSize` and lets React Aria
 * measure the rest.
 */
const collectionSizes = {
  /** The thickness of the line a drag draws between two rows. */
  dropIndicator: 2,
  /** A `List`, `ListBox` or `Tree` row with a headline alone. */
  listRow: 56,
  /** A `List`, `ListBox` or `Tree` row with a headline and a supporting line. */
  listRowTwoLine: 72,
  /** A `Menu` item, which the menus page gives a shorter floor than a list's. */
  menuRow: 48,
  /** A `List.Section` or `Tree.Section` heading. */
  sectionHeading: 38,
  /** A `Table` header row, which the data tables page draws taller than a body row. */
  tableHeaderRow: 56,
  /** A `Table` body row. */
  tableRow: 52,
} as const

export { collectionSizes }
