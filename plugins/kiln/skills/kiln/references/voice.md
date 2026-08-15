# Voice — words as design material

Contract part 9. Loaded at Phase 6 and whenever interface copy is being written. Every lineage file
carries a one-line voice note; this file is what that note expands into.

Type and colour get a system. Words usually get whoever is typing that day. The result is a
component library that looks like one thing and reads like six people wrote it, because six people
did.

## Register

Decide, once, where the system sits between formal and plain, and between warm and neutral. State it
as a position, not a mood: "plain language, warm in confirmation, neutral in error" is a position.
"Friendly but professional" is not, because it tells the next writer nothing they can check their
sentence against.

The lineage constrains this. A pharmaceutical label's voice is precise and withholds nothing that
matters even in short space; a title card's voice can be terse to the point of gnomic. Pull the
register from the same tradition the visual system came from, not from a separate brand-voice
exercise that answers to nothing.

## Verbs

One verb per action, everywhere. If the button that submits a form says "Save" in one place, it
says "Save" everywhere a form is submitted the same way — never "Submit" on one screen and "Save"
on another for the same action.

Build the verb list once, at the same time as the component API vocabulary in
`references/api-conventions.md`, since a button's label and a button's prop name are the same
naming decision made twice. Primary actions get concrete verbs: "Save," "Delete," "Send." Avoid
"OK," "Yes," and "Submit" as button text — none of them tell the reader what will happen.

## Error structure

Every error message states what went wrong and what to do about it, in that order, in one or two
sentences. "Something went wrong" states neither. "Error 4022" states neither in a form a person
can act on.

Associate the message with the field or action it concerns programmatically, not only by proximity
on screen — see `references/foundations/a11y.md`'s content section. Never blame the user in the
wording ("You entered an invalid email") when the system can say what it needs instead ("Enter an
email address with an @ and a domain").

## Empty states

Every empty state says why it's empty and, where there's an action that would fill it, names that
action. "No results" is a report. "No results for 'kiln 2.0'. Try a shorter search." is an empty
state.

Distinguish three cases that get conflated: genuinely no data yet (a new account with nothing in it
— this is a welcome, not an error), a filtered view with nothing matching (this is a scoped-down
report, offer to clear the filter), and a load failure (this is an error, not an empty state, and
must say so).

## Reading level

Interface copy targets a reading level around ages 12 to 14, per `references/foundations/a11y.md`.
This is a floor for clarity, not a ceiling on precision — a pharmaceutical-label voice can be exact
and still plain. Prefer short sentences and named subjects over passive constructions: "The upload
failed" over "An error occurred during upload."

## Capitalisation and punctuation as a system decision

Pick sentence case or title case for headings and labels, once, and apply it everywhere including
button text, tab labels, and menu items. Pick whether the system uses an Oxford comma, whether
labels take a trailing colon, and whether button labels take a period (they should not). These are
small and they are exactly the kind of small that a reader's eye catches as inconsistent even when
they cannot say why.

## What does not travel

Sentence case does not exist in every script. Active voice is not equally natural in every
language. Verb-first labelling assumes a word order some languages don't have. Where the system
serves more than one language, `references/foundations/i18n.md`'s voice section states which of
these rules is universal and which is delegated per locale, and to whom.

## Voice belongs in the contract, not in a separate style guide

Contract part 9 is this file's output for the specific system being built: the register, the verb
list, the error template, and the empty-state pattern, stated together with the visual tokens rather
than shipped as a document nobody with write access to the component code ever opens.
