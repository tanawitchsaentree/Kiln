# Imagery

Illustration, photography, and logo lockups. Load when the system ships any of them.

## Deciding whether the system needs it

Most systems need less than they think. Typography and layout carry more identity than illustration
does, and an illustration set is an ongoing commitment: every new feature needs one, and a
half-populated set looks worse than none.

If the system ships illustration, it needs a producer. Say who, in the system, or the set stops
growing the day the launch is over.

## Illustration

One construction rule set: line weight, corner treatment, perspective, level of detail, and whether
figures appear. Publish it, because the second illustrator will not guess it.

Palette drawn from the system tokens rather than from a separate illustration palette. An
illustration set with its own colours will clash the first time the theme changes.

Two or three sizes with different detail levels. A spot illustration is not a hero illustration
scaled down; detail must be removed deliberately.

State where illustration is allowed and where it is not. Empty states, onboarding, and marketing
usually yes. Error states usually no, since a cheerful drawing beside a failure reads as dismissive.

## Photography

Direction covering subject, crop, colour treatment, and whether people appear.

Aspect ratios as tokens, and every image slot uses one of them. Arbitrary ratios are how a grid
breaks.

Every image needs a defined behaviour when it is missing, still loading, or the wrong ratio. The
missing case is the one systems skip and the one users see.

Never ship invented stock imagery as if it were final. Use a marked placeholder that cannot be
mistaken for a decision.

## Logo and lockup

Clear space as a formula relative to the mark rather than as a fixed value, so it holds at every
size.

Minimum size, stated, per medium.

The permitted variants, and explicitly the forbidden ones: stretched, recoloured, on an unapproved
background, rotated, with effects. The forbidden list is what people actually consult.

Where the logo appears and where it does not. A system that puts the logo in every component header
has confused branding with identity.

## Accessibility

Every image needs alternative text, or an explicit marking that it is decorative. Both are
decisions, and leaving the attribute off is neither.

Illustration carrying information needs the information available in text as well. Illustration
carrying mood does not.
