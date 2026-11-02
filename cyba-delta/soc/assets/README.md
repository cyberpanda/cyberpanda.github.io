# Logos

CybaSoa shows `logos/cybasoa.png` in its sidebar, on the sign in screen, and as the
favicon.

| | |
|---|---|
| Format | PNG with transparency |
| Shape | anything, wide is fine, the height is what counts |
| A good size | around 960x240 wide, or 512x512 square |
| Shown at | 30 to 34 px high |

```bash
cp my-soa.png assets/logos/cybasoa.png
cp assets/logos/cybasoa.png web/assets/logos/cybasoa.png
```

Under CYBA Delta the same file lives at `assets/logos/cybasoa.png` in the roof, and
`make logos` copies it here for you.

A missing logo hides itself and the wordmark stands alone. Nothing breaks.
