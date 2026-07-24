## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Previred indicator updates

The canonical source for UF, UTM, taxable caps, and AFP commissions is the monthly official PDF **Indicadores Previsionales PREVIRED**, published over HTTPS under:

```
https://www.previred.com/wp-content/uploads/YYYY/MM/
```

The exact PDF URL used for the current copy is recorded as `sourceUrl` in `src/data/parameters/previred.generated.ts`. The automatic resolver in `scripts/lib/parse-previred.mjs` tries the filename variants used by Previred for the current month and the two previous months. Do not use blogs, search-result snippets, or unofficial mirrors as parameter sources.

The generated copy contains:

- Source URL, source update date, and SHA-256 hash of the PDF.
- Remuneration period and following payment period.
- UF and UTM values.
- AFP and unemployment-insurance taxable caps in UF.
- Commission for each recognized AFP.

Do not edit `src/data/parameters/previred.generated.ts` manually. Generate it from the official PDF so its source and hash remain traceable.

### Local update

The update requires Node.js 22, pnpm, and Poppler's `pdftotext`. On macOS, install the PDF reader with `brew install poppler` if `pdftotext` is unavailable.

Run the automatic source discovery:

```sh
pnpm update:previred
```

To validate a specific official PDF, pass its full `previred.com` HTTPS URL:

```sh
PREVIRED_SOURCE_URL='https://www.previred.com/wp-content/uploads/YYYY/MM/Indicadores-Previsionales-Previred-Mes-YYYY.pdf' pnpm update:previred
```

The updater rejects non-Previred hosts, non-HTTPS or non-PDF URLs, external redirects, invalid periods, future or regressing periods, unexpected AFP sets, out-of-range values, and anomalous changes relative to the committed copy. It also limits downloads to 25 MB and 30 seconds.

After an update, review and validate:

```sh
git diff -- src/data/parameters/previred.generated.ts
pnpm check
pnpm test
pnpm test:automation
pnpm build
git diff --check
```

Confirm that the payment period immediately follows the remuneration period and review every changed UF, UTM, cap, and AFP commission against the linked PDF. The guardrails currently allow at most 10% variation for UF/UTM, 20% for taxable caps, 0.5 percentage points for an AFP commission, and a three-period forward jump. Do not loosen or bypass these limits merely to make an update pass; investigate the source and require explicit review.

### GitHub automation and production safety

`.github/workflows/update-previred.yml` runs daily at `12:15 UTC` and can also be started manually with an optional official `source_url`. When no generated change exists, it exits without publishing anything. When values change, it runs all validations, updates the dedicated `automation/update-previred` branch with `--force-with-lease`, and creates or updates one pull request toward the default branch.

The workflow must never push the generated update directly to `main` and must never enable auto-merge. Production changes only after a human reviews and merges the pull request. The PR body must preserve the official URL, PDF hash, exact generated diff, and validation results.

For PR creation, the repository requires:

```
Settings → Actions → General → Workflow permissions
Allow GitHub Actions to create and approve pull requests
```

The workflow itself requests only `contents: write` and `pull-requests: write`. If source parsing, semantic validation, tests, build, branch publication, or PR creation fails, leave the existing production parameters unchanged and report the failing stage instead of bypassing it.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
