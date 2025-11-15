# Rendering Strategy

This document explains the rendering architecture and spacing strategy used in the check-1-2 tool.

## Architecture

The application supports two distinct renderers:

1. **InteractiveRenderer** - For interactive terminal environments (TTY)
2. **CIRenderer** - For CI environments and non-interactive terminals

The renderer is selected automatically based on the `format` option, which can be:

- `auto` (default) - Automatically detects based on environment (CI vs TTY)
- `interactive` - Forces interactive renderer
- `ci` - Forces CI renderer

## Format Option

The format can be set in two ways:

### Via CLI Flag

```bash
checks --format ci        # Force CI renderer
checks --format interactive  # Force interactive renderer
checks --format auto      # Auto-detect (default)
```

### Via package.json

```json
{
  "checks": {
    "format": "ci",
    "runner": "bun",
    "scripts": ["lint", "test"]
  }
}
```

Priority: CLI flag > package.json > default ("auto")

## Spacing Strategy

### The Problem

Initially, we used explicit newline characters (`<Text>{'\n'}</Text>`) for spacing. This approach had issues:

- Created excessive blank lines in local terminals
- GitHub Actions collapsed consecutive blank lines, causing inconsistent rendering
- Different environments rendered spacing differently

### The Solution

We switched to using **Box component margins** for spacing control:

- `marginTop={1}` on containers - Creates blank lines above sections
- `marginBottom={1}` on containers - Creates blank lines below sections
- No explicit newline characters

### Why This Works Better

1. **Consistent Rendering**: Box margins render consistently across all environments
2. **Less Clutter**: Avoids excessive blank lines that CI systems would collapse
3. **More Maintainable**: Spacing is controlled via component props, not string literals
4. **Responsive**: Ink handles margins appropriately based on the terminal environment

## Renderer Differences

### InteractiveRenderer

- Animated spinner for running checks
- Background colors on status indicators
- Always shows bottom status section
- Optimized for TTY with real-time updates

### CIRenderer

- Static indicators (no animation)
- Round border boxes with script names
- Duration shown inside header box
- Bottom section only shown when all checks complete
- Optimized for CI log readability
