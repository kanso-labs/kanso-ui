import type { ReactElement } from 'react'

import { act, render, waitFor } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'

import ChipGroup from './chip-group'
import ColorPicker from './color-picker'
import DatePicker from './date-picker'
import DateRangePicker from './date-range-picker'
import List from './list'
import NumberField from './number-field'
import SearchField from './search-field'
import Snackbar from './snackbar'
import Table from './table'
import Tree from './tree'

// The controls React Aria names itself, in the reader's locale: a field's
// clear button and steppers, a snackbar's close, a chip's remove, a row's
// selection box, a column's resize handle, a picker's trigger and a colour
// strip. Each component leaves that name to React Aria unless its call site
// passes one, since React Aria takes a prop over its own context and an
// English default here would replace the French, German or Japanese name
// with English — where React Aria also composes the name with the field's
// label, in two languages at once.
//
// French, because every one of these names differs from the English, so a
// case passing proves the name came from React Aria rather than from here.
function inFrench(element: ReactElement) {
  return render(<I18nProvider locale="fr-FR">{element}</I18nProvider>)
}

describe("the names React Aria gives in the reader's locale", () => {
  it('names the clear button of a SearchField', () => {
    const view = inFrench(<SearchField defaultValue="Value" label="Label" />)

    expect(
      view.getByRole('button', { name: 'Effacer la recherche' }),
    ).not.toBeNull()
  })

  it('names the steppers of a NumberField after its label', () => {
    for (const steppers of ['horizontal', 'vertical'] as const) {
      const view = inFrench(<NumberField label="Label" steppers={steppers} />)

      expect(
        view.getByRole('button', { name: 'Augmenter Label' }),
      ).not.toBeNull()
      expect(
        view.getByRole('button', { name: 'Diminuer Label' }),
      ).not.toBeNull()
      view.unmount()
    }
  })

  it('names the close button of a Snackbar', async () => {
    const queue = new Snackbar.Queue()
    const view = inFrench(<Snackbar queue={queue} />)
    act(() => {
      queue.add('First item', { showCloseButton: true })
    })

    await waitFor(() => {
      expect(view.getByRole('button', { name: 'Fermer' })).not.toBeNull()
    })
  })

  it('names the remove target of a chip in a ChipGroup after the chip', () => {
    const view = inFrench(
      <ChipGroup label="Label" onRemove={vi.fn<(keys: Set<unknown>) => void>()}>
        <ChipGroup.Chip id="first">First item</ChipGroup.Chip>
      </ChipGroup>,
    )

    expect(
      view.getByRole('button', { name: 'Supprimer First item' }),
    ).not.toBeNull()
  })

  it('names the selection boxes and the resize handle of a Table', () => {
    const view = inFrench(
      <Table aria-label="Label" resizable selectionMode="multiple">
        <Table.Header>
          <Table.Column id="colSelect" selection />
          <Table.Column id="colLabel" isRowHeader resizable>
            Label
          </Table.Column>
        </Table.Header>
        <Table.Body>
          <Table.Row id="first">
            <Table.Cell selection />
            <Table.Cell>First item</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>,
    )

    expect(
      view.getByRole('checkbox', { name: 'Sélectionner tout' }),
    ).not.toBeNull()
    expect(
      view.getByRole('checkbox', { name: 'Sélectionner First item' }),
    ).not.toBeNull()
    expect(
      view.getByRole('slider', { name: 'Redimensionneur Label' }),
    ).not.toBeNull()
  })

  it('names the selection box of a row in a List', () => {
    const view = inFrench(
      <List aria-label="Label" selectionMode="multiple">
        <List.Item id="first">First item</List.Item>
      </List>,
    )

    expect(
      view.getByRole('checkbox', { name: 'Sélectionner First item' }),
    ).not.toBeNull()
  })

  it('names the selection box of a row in a Tree', () => {
    const view = inFrench(
      <Tree aria-label="Label" selectionMode="multiple">
        <Tree.Item headline="First item" id="first" />
      </Tree>,
    )

    expect(
      view.getByRole('checkbox', { name: 'Sélectionner First item' }),
    ).not.toBeNull()
  })

  it('labels the strips of a ColorPicker with the channels they carry', () => {
    const view = inFrench(
      <ColorPicker
        alpha
        defaultOpen
        defaultValue="hsl(200, 100%, 50%)"
        label="Label"
      />,
    )

    expect(view.getByRole('slider', { name: 'Teinte' })).not.toBeNull()
    expect(view.getByText('Teinte')).not.toBeNull()
    expect(view.getByRole('slider', { name: 'Alpha' })).not.toBeNull()
  })

  it('names the trigger of a DatePicker after its label', () => {
    const view = inFrench(<DatePicker label="Label" />)

    expect(
      view.getByRole('button', { name: 'Calendrier Label' }),
    ).not.toBeNull()
  })

  it('names the trigger of a DateRangePicker after its label', () => {
    const view = inFrench(<DateRangePicker label="Label" />)

    expect(
      view.getByRole('button', { name: 'Calendrier Label' }),
    ).not.toBeNull()
  })
})
