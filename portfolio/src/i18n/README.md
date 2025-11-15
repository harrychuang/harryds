# i18n 資料結構說明

## 目錄結構

```
i18n/
├── index.ts                 # i18n 配置檔案
└── locales/
    ├── en/                  # 英文資源
    │   ├── common.json      # 通用資料 (nav, home, brand)
    │   ├── about.json       # About 頁面資料
    │   ├── projects.json    # Projects 資料
    │   └── articles.json    # Articles 資料
    ├── zh-Hant/            # 繁體中文資源
    │   ├── common.json
    │   ├── about.json
    │   ├── projects.json
    │   └── articles.json
    └── ja/                  # 日文資源
        ├── common.json
        ├── about.json
        ├── projects.json
        └── articles.json
```

## Namespace 說明

資料已拆分成 4 個 namespace：

1. **common** (預設) - 通用資料
   - `nav`: 導航選單
   - `home`: 首頁標題和副標題
   - `brand`: 品牌資訊

2. **about** - About 頁面所有資料
   - hero, whoAmI, awards, clients, background
   - referrer, services, contact

3. **projects** - 專案資料
   - 所有專案的詳細資訊

4. **articles** - 文章資料
   - 所有文章的詳細資訊

## 使用方式

### 1. 在組件中使用特定 namespace

```tsx
// 使用 about namespace
const { t } = useTranslation('about');
const title = t('hero.subtitle');

// 使用多個 namespace
const { t } = useTranslation(['about', 'common']);
const aboutTitle = t('hero.subtitle', { ns: 'about' });
const navHome = t('nav.home', { ns: 'common' });
```

### 2. 在 useI18nFeed hook 中使用

```tsx
// 載入 projects 資料 (預設)
const { items } = useI18nFeed();

// 載入 articles 資料
const { items } = useI18nFeed('articles');
```

### 3. 直接從 t 函數指定 namespace

```tsx
const { t } = useTranslation();
const projectTitle = t('1.heading', { ns: 'projects' });
const articleTitle = t('1.heading', { ns: 'articles' });
```

## 優點

1. **更好的組織結構** - 資料按功能分類，易於維護
2. **減少檔案大小** - 單一檔案不會過大
3. **更快的載入速度** - 可以按需載入特定 namespace
4. **清晰的職責劃分** - 每個檔案都有明確的用途

## 注意事項

- 舊的單一檔案 `en.json`, `zh-Hant.json`, `ja.json` 仍然存在，但不再使用
- 可以在確認新結構運作正常後刪除舊檔案
- 新增資料時，記得在對應的 namespace 檔案中添加

