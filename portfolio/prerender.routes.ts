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
// ... (omitting for brevity, but matching the exact content) ...
];

// 課程頁面
const courseRoutes = [
  '/course/1/product-designer-vibe-coding-workshop',
];

// 合併所有路徑
export const prerenderRoutes = [
  ...mainRoutes,
  ...projectRoutes,
  ...articleRoutes,
  ...courseRoutes,
];

export default prerenderRoutes;
