# 🎤 check-1-2

Run your validation scripts (test, lint, type-checking, etc.) in parallel.

- Real-time output streaming per script
- CI-friendly
- Supports npm, pnpm, yarn, and bun

## Installation

```bash
npm install -g check-1-2
```

## Usage

Add a `checks` array to your `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "test": "jest",
    "build": "tsc"
  },
  "checks": ["lint", "test", "build"]
}
```

Or use the object format with a custom runner:

```json
{
  "checks": {
    "runner": "bun",
    "scripts": ["lint", "test", "build"]
  }
}
```

Then run:

```bash
checks
```
