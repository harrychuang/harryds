/**
 * 預渲染路徑配置
 * 包含所有需要預渲染的頁面路徑（共 68 個）
 */

// 主要頁面
const mainRoutes = [
  '/',
  '/about',
  '/articles',
];

// 專案頁面（排除 private 專案）
const projectRoutes = [
  '/project/2/streaming-guide',
  '/project/3/design-system-architecture',
  '/project/4/brand-e-commerce-app',
  '/project/5/payment-flow-optimization',
  '/project/6/travel-monster-brand-incubation',
  '/project/7/global-chinese-learning-ecosystem',
  '/project/8/interactive-web-experience',
];

// 文章頁面（58 篇）
const articleRoutes = [
  '/article/1/design-systems-the-solution-to-product-collaboration',
  '/article/2/bridging-the-gap-between-design-and-development',
  '/article/3/the-art-of-design-decluttering',
  '/article/4/implementing-design-systems-a-mountain-worth-climbing',
  '/article/5/work-hard--smart',
  '/article/6/design-token-the-shared-language-of-design-and-development',
  '/article/7/design-token-naming-the-art-of-three-layer-structure',
  '/article/8/token-inheritance-the-chefs-special-wisdom',
  '/article/9/token-semantics-unified-naming-system',
  '/article/10/cross-team-design-systems-the-value-of-storybook',
  '/article/11/color-planning-less-is-more',
  '/article/12/theme-inversion-colors-neutral-semantic-naming',
  '/article/13/tool-share-color-contrast-checker',
  '/article/14/icon-design-unified-size-and-alignment',
  '/article/15/component-deconstruction-extracting-design-elements',
  '/article/16/component-composition-flexible-building-block-thinking',
  '/article/17/clay-vs-blocks-two-design-mindsets',
  '/article/18/ai-and-design-systems-future-collaboration',
  '/article/19/variables-and-styles-an-inseparable-relationship',
  '/article/20/mcp-tool-share-cursor-talk-to-figma',
  '/article/21/design-principles-guiding-design-decisions',
  '/article/22/the-role-of-secondary-colors-resolving-color-conflicts',
  '/article/23/starting-with-new-features-design-system-adoption-strategy',
  '/article/24/design-token-the-meaning-of-multi-layer-inheritance',
  '/article/25/design-token-the-cross-platform-bridge',
  '/article/26/design-token-the-clothing-size-analogy',
  '/article/27/design-system-scale-contextual-planning',
  '/article/28/ai-accelerated-design-foundation-first',
  '/article/29/vibe-coding-ai-as-engineer',
  '/article/30/color-hierarchy-the-meaning-of-numbers',
  '/article/31/simplification--convergence-lessons-from-raptor-3',
  '/article/32/neutral-vs-lightdark-colors-functional-differences',
  '/article/33/design-token-its-just-variables',
  '/article/34/token-naming-structure-team-collaboration-planning',
  '/article/35/figma-variables-ai-accelerated-workflow',
  '/article/36/color-overlay-strategy-simplifying-token-management',
  '/article/37/number-management-design-system-convergence',
  '/article/38/experiment-sandbox-flexible-design-system-process',
  '/article/39/token-roles-the-meaning-of-three-layer-definition',
  '/article/40/document-sync-notion-and-storybook',
  '/article/41/goal-setting-choosing-okr-vs-kpi',
  '/article/42/building-blocks-design-system-collaboration-flow',
  '/article/43/ai-assisted-building-design-system-component-libraries',
  '/article/44/figma-tools-color-guide-generator',
  '/article/45/token-layers-two-layer-vs-three-layer-models',
  '/article/46/multi-brand-management-shared-token-strategy',
  '/article/47/elevation-interface-z-axis-design',
  '/article/48/composability-component-assembly-thinking',
  '/article/49/design-systems-surf-design-system-database',
  '/article/50/on-naming-color-token-pairing-strategy',
  '/article/51/token-naming-tool-building-consistent-structure',
  '/article/52/token-structure-understanding-each-levels-purpose',
  '/article/53/semantic-tokens-focusing-on-essential-settings',
  '/article/54/slot-composition-component-extension-method',
  '/article/55/token-inheritance-practice-fill-in-the-blank-table-method',
  '/article/56/typography-styles-planning-and-convergence',
  '/article/57/starting-early-design-system-foundation',
  '/article/58/design-tokens--ai-taming-vibe-coding',
];

// 合併所有路徑
export const prerenderRoutes = [
  ...mainRoutes,
  ...projectRoutes,
  ...articleRoutes,
];

export default prerenderRoutes;
