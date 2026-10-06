A surface holding related content. `render` decides which element that
surface is, so a card that navigates can be a real `<a href>` — announced
as a link and opening in a new tab on a modifier click, which a `<button>`
with an onClick does neither of.

`interactive` and `render` are separate axes. `interactive` says the card
is pressable and gives it the ripple, the hover lift, and a focus ring;
`render` says what it is. A pressable card with no `render` is a
`<button>`, which is the right default for one that acts rather than
navigates.
