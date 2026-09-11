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
// They are the heights as rendered, which is not always the height the spec
// page names. `listRowTwoLine` is the one that differs today: the lists page
// gives a two-line item 72dp and the row comes to 70, since its floor is a
// minimum and the two lines plus the row's own padding are what decide the
// rest. A virtualizer needs what is drawn rather than what is specified, so
// the measured number is the one here.

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
  /**
   * A row with a headline and a supporting line. The lists page names 72dp
   * for its two-line item; what the row comes to is 70, since its floor is a
   * minimum and the two lines plus the row's own padding decide the rest.
   */
  listRowTwoLine: 70,
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
