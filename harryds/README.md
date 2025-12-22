# Harry Design System

The Storybook development environment for Harry Design Studio, providing the component foundation for the NOEINOI 2025 project.

## Quick Start

### Install Dependencies

```bash
npm install
```

### Start Storybook

```bash
npm run storybook
```

Storybook will be running at http://localhost:6006.

## Project Structure

```
harryds/
├── .storybook/           # Storybook configuration
├── src/
│   ├── components/       # React components
│   ├── styles/           # Global styles
│   │   ├── globals.scss  # Global styles and resets
│   │   └── tokens.scss   # Design Tokens
│   ├── Welcome.stories.tsx # Welcome page
│   └── index.ts          # Main entry file
└── package.json
```

## Design Tokens Architecture

Harry Design System utilizes a two-tier Design Token architecture to ensure design consistency and maintainability.

### Architecture Overview

#### 1. REF TOKENS (Reference Tokens)
Basic design values defining raw colors, sizes, and font sizes:

```scss
// Color System
--hds-ref-color-dark-100a: #111111;     // Solid Black
--hds-ref-color-dark-80a: rgba(17 17 17 / 0.8);  // 80% Opacity
// ... other opacity variations

--hds-ref-color-light-100a: #ffffff;    // Solid White
--hds-ref-color-light-80a: rgba(255 255 255 / 0.8); // 80% Opacity
// ... other opacity variations

// Brand Colors
--hds-ref-color-brand-50: #111111;
--hds-ref-color-green-50: #1ade99;
--hds-ref-color-red-50: #f03fa6;
--hds-ref-color-yellow-50: #e1aa2b;
--hds-ref-color-blue-50: #4f72fd;

// Opacity System
--hds-ref-opacity-90a: 90%;
--hds-ref-opacity-80a: 80%;
// ... other opacity values

// Size System (provides both px and rem versions)
--hds-ref-size-5: 5px;
--hds-ref-size-5-rem: 0.3125rem;
// ... other sizes
```

#### 2. SYS TOKENS (System Tokens)
Semantic tokens that map Reference Tokens to actual functional use cases:

```scss
// Semantic Colors
--hds-sys-color-primary-default: var(--hds-ref-color-brand-50);
--hds-sys-color-secondary-default: var(--hds-ref-color-light-100a);
--hds-sys-color-success-default: var(--hds-ref-color-green-50);
--hds-sys-color-error-default: var(--hds-ref-color-red-50);
--hds-sys-color-info-default: var(--hds-ref-color-blue-50);
--hds-sys-color-warning-default: var(--hds-ref-color-yellow-50);

// Semantic Opacity
--hds-sys-opacity-90a: var(--hds-ref-opacity-90a);
--hds-sys-opacity-80a: var(--hds-ref-opacity-80a);
// ... other opacities

// Semantic Spacing
--hds-sys-spacing-xs: var(--hds-ref-size-5);
--hds-sys-spacing-sm: var(--hds-ref-size-10);
--hds-sys-spacing-default: var(--hds-ref-size-15);
--hds-sys-spacing-med: var(--hds-ref-size-20);
// ... other spacings

// Semantic Font Sizes
--hds-sys-font-size-xxs: var(--hds-ref-font-size-12);
--hds-sys-font-size-xs: var(--hds-ref-font-size-14);
--hds-sys-font-size-sm: var(--hds-ref-font-size-16);
--hds-sys-font-size-default: var(--hds-ref-font-size-18);
--hds-sys-font-size-med: var(--hds-ref-font-size-20);
--hds-sys-font-size-ex-med: var(--hds-ref-font-size-24);
--hds-sys-font-size-lg: var(--hds-ref-font-size-30);
--hds-sys-font-size-xl: var(--hds-ref-font-size-36);
--hds-sys-font-size-xxl: var(--hds-ref-font-size-46);
// ... other font sizes
```

### Usage

#### In Components
```scss
.hds-button {
  // Use System Tokens (Recommended)
  padding: var(--hds-sys-spacing-sm) var(--hds-sys-spacing-med);
  font-size: var(--hds-sys-font-size-default);
  background-color: var(--hds-sys-color-primary-default);
  
  // Use Reference Tokens only in special cases
  border-radius: var(--hds-ref-size-5);
  
  // Use Opacity System
  opacity: var(--hds-sys-opacity-80a);
}
```

#### Naming Conventions
- **REF TOKENS**: `--hds-ref-{category}-{value}`
  - `category`: color, size, font-size, opacity
  - `value`: specific value or description (e.g., dark-80a, size-20, green-50, opacity-90a)
  
- **SYS TOKENS**: `--hds-sys-{category}-{semantic}`
  - `category`: color, spacing, font-size, opacity
  - `semantic`: semantic name (e.g., primary-default, spacing-lg, font-size-xl, opacity-80a)

---

## 🤖 AI Development Guidelines (Mandatory)

To ensure design consistency and maintainability, all AI-assisted coding must follow these protocols:

### 1. Strict Design Token Adherence
AI must **NEVER** generate hardcoded style values (hex codes, pixel values, or raw rem units) directly in the code. Every styling property must utilize an existing Design Token.
*   **PROHIBITED**: `color: #1ade99;`, `padding: 10px;`, `font-size: 1.25rem;`
*   **REQUIRED**: `color: var(--hds-sys-color-success-default);`, `padding: var(--hds-sys-spacing-sm);`, `font-size: var(--hds-sys-font-size-med);`

### 2. Mandatory Context Reading
Before starting any front-end development or styling task, the AI **must** first read `src/styles/tokens.scss` to identify the correct tokens for the implementation.

### 3. Proactive Token Inquiry
If a specific design requirement (color, spacing, etc.) is missing from the existing tokens, the AI is forbidden from making up a value. Instead, the AI must proactively ask the user:
> *"I cannot find a matching Design Token for [Value] in tokens.scss. Should I create a new token, or is there an existing one I should use?"*

---

## Design Principles

1. **Consistency**: All components use the same set of tokens.
2. **Maintainability**: Modifying a REF TOKEN updates the design globally.
3. **Semantic Clarity**: SYS TOKENS provide clear intent for usage.
4. **Scalability**: New color or size variations can be easily added.
5. **Responsiveness**: Both px and rem versions are provided to support various needs.

## Development Guide

### Adding a Component

1. Create a new folder `ComponentName/` in `src/components/`.
2. Create the following files:
   - `ComponentName.tsx` - Component implementation
   - `ComponentName.scss` - Component styles
   - `ComponentName.stories.tsx` - Storybook stories
   - `index.ts` - Entry export
3. Update `src/components/index.ts` to export the new component.

### Component Example Structure

```typescript
// ComponentName.tsx
import React from 'react';
import './ComponentName.scss';

export interface ComponentNameProps {
  children: React.ReactNode;
}

export const ComponentName: React.FC<ComponentNameProps> = ({ children }) => {
  return <div className="hds-component-name">{children}</div>;
};
```

```typescript
// ComponentName.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Components/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Example Content',
  },
};
```

## Scripts

- `npm run storybook` - Start Storybook dev environment
- `npm run build-storybook` - Build static Storybook files
- `npm run build` - Build the component library
- `npm run lint` - Code quality check
- `npm run format` - Format code

---

© 2025 Harry Design Studio / NOEIN Projects
