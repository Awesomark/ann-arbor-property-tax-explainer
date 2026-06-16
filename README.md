# Ann Arbor Property Tax Explainer

Static GitHub Pages site for modeling why an Ann Arbor homeowner's property taxes changed after purchase.

## Files

- `index.html` - page structure and explainer copy
- `styles.css` - responsive layout and table styling
- `app.js` - Ann Arbor millage data, Michigan inflation multipliers, and calculator logic

## Publish With GitHub Pages

1. Put these files in a GitHub repository.
2. In GitHub, open `Settings` -> `Pages`.
3. Choose the branch that contains these files.
4. Choose `/root` if the files are at the repository root, or `/docs` if you move them into a `docs/` folder.

The site has no build step and no external dependencies.

## Data Notes

The model uses Ann Arbor principal-residence millage rates through 2025 and Michigan State Tax Commission inflation multipliers. The 2026 inflation multiplier is included in the source data object, but 2026 is not modeled until Ann Arbor publishes a matching 2026 millage rate.
