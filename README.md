<p align="center">
	<img width="180" src="https://raw.githubusercontent.com/agorischek/check-1-2/refs/heads/main/static/logo.png">
</p>
<h1 align="center">
	check 1, 2...
</h1>
<p align="center">
<em>Run your validation scripts (test, lint, typecheck, etc.) in parallel</em>
</p>
<p align="center">
<a href="https://www.npmjs.com/package/check-1-2" title="Version"><img src="https://img.shields.io/npm/v/check-1-2" alt="Version"></a>
<a href="https://github.com/agorischek/check-1-2/actions/workflows/.github/workflows/ci.yml" title="Workflow"><img src="https://img.shields.io/github/actions/workflow/status/agorischek/check-1-2/.github/workflows/ci.yml" alt="Workflow"></a>
<a href="https://github.com/agorischek/check-1-2/blob/main/LICENSE" title="License"><img src="https://img.shields.io/github/license/agorischek/check-1-2" alt="License"></a>


## Features

- Real-time output streaming per script
- CI-friendly
- Supports npm, pnpm, yarn, and bun
- Apply fixes with `--fix` flag

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
    "typecheck": "tsc --noEmit"
  },
  "checks": ["test", "lint", "typecheck"]
}
```

Then run:

```bash
checks
```

  <img src="https://vhs.charm.sh/vhs-7nhGGOU7fQUhWcR5DPHnof.gif" alt="Demo output" width="600">

## Options

Include `fix` scripts when applicable, then use `checks --fix` to run:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "checks": [{ "check": "lint", "fix": "lint:fix" }]
}
```

Set a custom runner (`bun`, `pnpm`, or `yarn`) with the `runner` option:

```json
{
  "checks": {
    "runner": "bun",
    "scripts": ["lint", "test", "typecheck"]
  }
}
```
