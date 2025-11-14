# check-1-2

A TypeScript utility that runs multiple package.json scripts in parallel with a beautiful progress UI powered by Ink (React-based CLI).

## Features

- 🚀 Runs multiple checks in parallel for faster execution
- 📊 Beautiful real-time progress UI using Ink
- 🔍 Captures stdout and stderr separately
- ✅ Shows summary with pass/fail status
- 🏗️ CI-friendly behavior
- 📝 Output only shown when tasks complete (not in real-time)

## Installation

```bash
npm install
npm run build
```

Or install globally:
```bash
npm install -g .
```

## Usage

Add a `checks` array to your `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "build": "tsc"
  },
  "checks": ["lint", "type-check", "test"]
}
```

Then run:

```bash
checks
```

Or if installed locally:

```bash
npm run checks
```

Or if installed globally, just:

```bash
checks
```

## How It Works

1. Reads the `checks` array from `package.json`
2. Validates that all checks exist as scripts
3. Runs all checks in parallel
4. Shows progress with status indicators (⏳ running, ✅ success, ❌ failed)
5. Displays output (stdout/stderr) only when a check fails
6. Shows a summary at the bottom with pass/fail counts
7. Exits with code 0 if all pass, 1 if any fail

## CI Environments

The tool works well in CI environments. Ink handles non-TTY environments gracefully, and the tool will exit with appropriate exit codes for CI pipelines.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev
```

## License

MIT
