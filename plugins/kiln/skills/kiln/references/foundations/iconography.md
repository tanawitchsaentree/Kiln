# Iconography

## Grid and construction

One grid, usually 24 with a 20 or 16 variant drawn separately rather than scaled. An icon scaled
from 24 to 16 loses its stroke relationship and looks muddy.

One stroke weight across the set, and it derives from the type's stroke weight so icons sit with
text rather than beside it. This is the difference between a set that looks commissioned and one
that looks collected.

One corner treatment, one terminal treatment, one angle for diagonals. Decide these three and the
set will look coherent even when drawn by different people.

## Sizing against type

Icon size derives from cap height, not from the font size. An icon set at the font size looks too
large next to lowercase text.

Optical centring against the text baseline, not geometric centring. A geometrically centred icon
beside a line of text always sits low.

## Fill and stroke

Pick one as the default and use the other for state. Stroke default with fill for selected is the
common and correct pattern.

Do not mix within a set unless the mix is systematic and documented.

## Colour

Icons inherit text colour by default, via `currentColor`. An icon with a hardcoded colour cannot be
themed and will be wrong in dark mode.

Multi-colour icons are a separate category with their own rules, and they do not belong in the
functional set.

## Naming and meaning

Name by what it means, not by what it depicts. `delete` rather than `trash`, `edit` rather than
`pencil`. The metaphor changes and the meaning does not.

One icon per meaning across the whole system. Two icons meaning the same thing is the most common
icon set failure and it appears the moment a second designer contributes.

Publish the list of what each icon means and when to use it, next to the icon, or people will pick
by appearance.

## Accessibility

An icon that carries meaning alone needs an accessible label. An icon beside a label that says the
same thing is decorative and should be hidden from assistive technology.

An icon-only control always needs a label and usually needs a tooltip. Both, not either.

Never use an icon as the only signal for a state, since it fails for the same people colour fails
for and for more.

## Adding to the set

State who may add, what the review checks, and what the answer is when a requested icon is close to
an existing one. The usual answer is to use the existing one, and saying so in advance prevents the
set from doubling.
