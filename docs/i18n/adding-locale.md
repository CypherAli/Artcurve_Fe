# Adding a New Locale

ArtCurve supports 10 languages. To add a new one:

## Current Locales

| Code | Language | File |
|------|----------|------|
| `en` | English | `src/i18n/locales/en.ts` (source of truth) |
| `vi` | Vietnamese | `src/i18n/locales/vi.ts` |
| `ar` | Arabic | `src/i18n/locales/ar.ts` |
| `de` | German | `src/i18n/locales/de.ts` |
| `es` | Spanish | `src/i18n/locales/es.ts` |
| `fr` | French | `src/i18n/locales/fr.ts` |
| `ja` | Japanese | `src/i18n/locales/ja.ts` |
| `ko` | Korean | `src/i18n/locales/ko.ts` |
| `pt` | Portuguese | `src/i18n/locales/pt.ts` |
| `zh` | Chinese | `src/i18n/locales/zh.ts` |

## Steps

### 1. Copy the English file

```bash
cp src/i18n/locales/en.ts src/i18n/locales/{code}.ts
```

### 2. Update the file

```typescript
// Change the import type
import type { Translations } from './en'

// Change the variable name and translate all values
const {code}: Translations = {
  nav: {
    marketplace: 'Translated text',
    // ... translate all values, keep keys in English
  },
  // ...
}

export default {code}
```

### 3. Register in i18n index

Edit `src/i18n/index.ts` (or wherever locales are registered):

```typescript
import newLocale from './locales/{code}'

export const locales = {
  en, vi, ar, de, es, fr, ja, ko, pt, zh,
  {code}: newLocale,  // add here
}
```

### 4. Add to language selector

The language selector in the header reads from the locales registry automatically.

### 5. Type safety

The `Translations` interface in `en.ts` enforces that ALL keys must be present. TypeScript will error if any key is missing in your new locale.

```bash
# Verify
npx tsc --noEmit
```

## Adding New Keys

When adding a new feature with translatable text:

1. Add type definition in `en.ts` interface
2. Add English value in `en.ts` object
3. Add translation in ALL 10 locale files
4. Run `npx tsc --noEmit` — TypeScript will catch any missing keys
