import * as stylex from '@stylexjs/stylex'

// What ButtonBase draws inside every button, whatever the component's own
// container: the label, held in place while the button is pending, and the
// ring over it. Apart from ./index.tsx so that file exports components alone,
// which is what keeps fast refresh working for it.
const buttonBaseStyles = stylex.create({
  // While pending, the label stays in the flow so the button keeps its
  // width, and is hidden — `display: contents` leaves the layout exactly as
  // it was, and `visibility` is inherited, so the label's own parts go with
  // it.
  label: {
    display: 'contents',
  },
  labelPending: {
    visibility: 'hidden',
  },
  // The ring sits over the hidden label, centred in the button.
  pending: {
    alignItems: 'center',
    display: 'flex',
    inset: 0,
    justifyContent: 'center',
    position: 'absolute',
  },
})

export { buttonBaseStyles }
