import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

// 正式網址
const SITE_URL = 'https://noeinoi.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/social-share-v2-1200x630.jpg`;

export interface SEOProps {
  /** 頁面標題（會自動加上網站名稱後綴） */
  title?: string;
  /** 頁面描述 */
  description?: string;
  /** 分享圖片 URL（建議 1200x630） */
  image?: string;
  /** 當前頁面的 canonical URL path（不含 domain） */
  path?: string;
  /** 頁面類型：website, article, profile 等 */
  type?: 'website' | 'article' | 'profile';
  /** 文章發布日期（僅 type=article 時使用） */
  publishedTime?: string;
  /** 文章修改日期（僅 type=article 時使用） */
  modifiedTime?: string;
  /** 是否為首頁（首頁不加後綴） */
  isHomePage?: boolean;
  /** 額外的關鍵字 */
  keywords?: string[];
  /** 禁止索引此頁面 */
  noIndex?: boolean;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image,
  path = '',
  type = 'website',
  publishedTime,
  modifiedTime,
  isHomePage = false,
  keywords = [],
  noIndex = false,
}) => {
  const { t, i18n } = useTranslation();
  
  // 根據當前語言取得 HTML lang 屬性值
  const getHtmlLang = () => {
    switch (i18n.language) {
      case 'en':
        return 'en';
      case 'ja':
        return 'ja';
      default:
        return 'zh-Hant';
    }
  };
  
  // 動態更新 HTML lang 屬性
  useEffect(() => {
    document.documentElement.lang = getHtmlLang();
  }, [i18n.language]);
  
  // 預設 SEO 內容（從 i18n 取得）
  const siteName = t('seo.siteName');
  const titleSuffix = t('seo.titleSuffix'); // 完整的標題後綴（包含中文名稱）
  const defaultDescription = t('seo.homeDescription');
  const defaultKeywords = t('seo.keywords').split(', ');
  const imageAlt = t('seo.imageAlt');
  
  // 組合最終的標題（使用 titleSuffix 而非 siteName）
  const finalTitle = isHomePage 
    ? t('seo.homeTitle')
    : title 
      ? `${title} | ${titleSuffix}` 
      : titleSuffix;
  
  const finalDescription = description || defaultDescription;
  
  // 處理圖片 URL：確保是絕對路徑
  const resolveImageUrl = (imageUrl?: string): string => {
    if (!imageUrl) return DEFAULT_OG_IMAGE;
    // 如果已經是絕對 URL，直接返回
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // 如果是相對路徑，加上 SITE_URL 前綴
    return `${SITE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };
  
  const finalImage = resolveImageUrl(image);
  const finalKeywords = [...defaultKeywords, ...keywords].join(', ');
  
  // 完整的 canonical URL
  const canonicalUrl = `${SITE_URL}${path ? `/${path.replace(/^\//, '')}` : ''}`;
  
  // 根據當前語言設定 locale
  const getLocale = () => {
    switch (i18n.language) {
      case 'en':
        return 'en_US';
      case 'ja':
        return 'ja_JP';
      default:
        return 'zh_TW';
    }
  };
  
  // 生成多語言 alternate links
  const getAlternateLinks = () => {
    const basePath = path ? `/${path.replace(/^\//, '')}` : '';
    return [
      { hreflang: 'zh-Hant', href: `${SITE_URL}${basePath}` },
      { hreflang: 'en', href: `${SITE_URL}${basePath}${basePath.includes('?') ? '&' : '?'}lng=en` },
      { hreflang: 'ja', href: `${SITE_URL}${basePath}${basePath.includes('?') ? '&' : '?'}lng=ja` },
      { hreflang: 'x-default', href: `${SITE_URL}${basePath}` },
    ];
  };

  return (
    <Helmet>
      {/* 基本 Meta */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:locale" content={getLocale()} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:image:alt" content={imageAlt} />
      
      {/* 文章特定 Meta (如果是文章類型) */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && (
        <meta property="article:author" content="Harry Chuang" />
      )}
      
      {/* 多語言 Alternate Links */}
      {getAlternateLinks().map((link) => (
        <link key={link.hreflang} rel="alternate" hrefLang={link.hreflang} href={link.href} />
      ))}
    </Helmet>
  );
};

export default SEO;

// 預設 SEO 配置 Hook（使用 i18n 翻譯）
export const useSEOPresets = () => {
  const { t } = useTranslation();
  
  return {
    home: {
      isHomePage: true,
    },
    about: {
      title: t('seo.aboutTitle'),
      description: t('seo.aboutDescription'),
      path: 'about',
      type: 'profile' as const,
    },
    articles: {
      title: t('seo.articlesTitle'),
      description: t('seo.articlesDescription'),
      path: 'articles',
    },
    projects: {
      title: t('seo.projectsTitle'),
      description: t('seo.projectsDescription'),
      path: '',
    },
  };
};

// 保留舊的 SEOPresets 用於向後兼容（但推薦使用 useSEOPresets）
export const SEOPresets = {
  home: {
    isHomePage: true,
  },
  about: {
    path: 'about',
    type: 'profile' as const,
  },
  articles: {
    path: 'articles',
  },
  projects: {
    path: '',
  },
};
