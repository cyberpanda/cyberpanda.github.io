# Logos

Every tool carries its own logo. The interface swaps it when you switch tools, so you
always see at a glance where you are.

## Where to drop your files

| File | Shown as |
|---|---|
| `logos/cyba-delta.png` | CYBA Delta: the roof, the sidebar, the switcher |
| `logos/cybakawa.png` | CybaKawa: the flow engine |
| `logos/cybasoa.png` | CybaSoa: security operations |

What ships now are placeholders. Overwrite them with yours.

## Any shape you like

The interface sizes a logo by **height** and lets the width follow. Wide, square, tall:
all of them fit, and nothing is stretched or cropped.

| Style | Looks like | Set it to |
|---|---|---|
| **lockup** | a wide logo that already spells the name | `"logo_style": "lockup"` |
| **mark** | a compact symbol, shown next to the wordmark | `"logo_style": "mark"` |

All three tools ship as `lockup`, because a wide logo usually carries its own name. In
that case the wordmark steps back and lets your artwork speak. If the file is missing or
fails to load, the wordmark comes back on its own, so the sidebar is never empty.

Change the style in `engine/cybakawa/cybakawa/core/spaces.py`, one line per tool.

## What the files should be

| | |
|---|---|
| Format | PNG with transparency |
| Shape | anything, wide is fine, nothing is stretched |
| A good size | around 960x240 for a lockup, around 512x512 for a mark |
| Shown at | 26 px high in the sidebar, 18 px in the switcher |
| Width cap | 168 px in the sidebar, 132 px in the switcher, so very long logos stay tidy |
| Safe area | leave a little air around the edge, the interface does not crop |

Since height is what counts, draw for a small height and check it reads at 26 pixels.

## Putting them in

```bash
cp my-delta.png  assets/logos/cyba-delta.png
cp my-kawa.png   assets/logos/cybakawa.png
cp my-soa.png    assets/logos/cybasoa.png

make logos
```

`make logos` copies whatever is in `assets/logos/` to the places that serve it. Then
`make build` to bake them into the images.

## If a logo is missing

Nothing breaks. The image hides itself, the wordmark takes over, and you can ship before
the artwork is done.

## Adding a tool

Put its PNG next to the others and add one entry to
`engine/cybakawa/cybakawa/core/spaces.py`:

```python
{
    "name": "cybamori",
    "title": "CybaMori",
    "wordmark": ["Cyba", "Mori"],
    "role": "What it is for",
    "summary": "One line, plain words.",
    "url": "/mori/",
    "logo": f"{LOGO_DIR}/cybamori.png",
    "logo_style": "lockup",
    "kind": "product",
}
```

The switcher, the sidebar and the products view pick it up from there. Tests check that
every tool has a logo of its own, that the file is really there, and that the style is one
we know.
