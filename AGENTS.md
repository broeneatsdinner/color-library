# Color Library Working Notes

## Canonical Color Data

`colors.library` is the source of truth for the color canon. Each `entry` is an authored record, not generated runtime state.

The current fields are:

- `you-said`
- `interpretation`
- `short-name`
- `hex`
- `accuracy`
- `but`
- `funeral`
- `wedding`

Keep the format humane: no braces, brackets, quotes, commas, or semicolons. A value starts after the first `: ` and continues to the end of the line. `#` is ordinary text so hex values work naturally.

## Creating Useful Chaos

The seed/salt phrase logic in `color-library.js` is a starter engine, not the canon. Preserve it because it can create stable first-pass assessment text for new entries.

For new colors, use this repeatable workflow:

1. Start with the entry's `you-said`, `interpretation`, `short-name`, and `hex`.
2. Run or mimic the seed/salt logic to produce first-pass `accuracy`, `but`, `funeral`, and `wedding` lines.
3. Use those generated lines as scaffolding, then rewrite them into bespoke, stranger, more specific metadata.
4. Match the tone of nearby entries in `colors.library`: funny, poetic, oddly confident, and concise.
5. Save the final text in `colors.library`. Once recorded there, it is canonical and should not be regenerated on page load.

The generator may suggest chaos. The library preserves it.
