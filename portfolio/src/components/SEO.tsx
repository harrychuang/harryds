import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

// 請替換為你的正式網址
const SITE_URL = 'https://yourdomain.com/harryds';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image-default.jpg`;

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
  const { i18n } = useTranslation();
  
  // 預設 SEO 內容
  const defaultTitle = 'Harry Design Studio';
  const defaultDescription = '15年產品設計與前端開發經驗，專注於 UI/UX 設計、設計系統建置與培訓顧問服務。協助團隊加快交付速度並提升一致性。';
  const defaultKeywords = ['UI/UX設計', '產品設計', '前端開發', '設計系統', 'React', 'Design System', 'Harry Chuang'];
  
  // 組合最終的標題
  const finalTitle = isHomePage 
    ? `${defaultTitle} | 產品設計 · 前端開發 · 設計系統`
    : title 
      ? `${title} | ${defaultTitle}` 
      : defaultTitle;
  
  const finalDescription = description || defaultDescription;
  const finalImage = image || DEFAULT_OG_IMAGE;
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
      <meta property="og:site_name" content="Harry Design Studio" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={finalTitle} />
      <meta property="og:locale" content={getLocale()} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:image:alt" content={finalTitle} />
      
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

// 預設 SEO 配置（可用於快速設定常見頁面）
export const SEOPresets = {
  home: {
    isHomePage: true,
  },
  about: {
    title: '關於我',
    description: 'Harry Chuang - 15年產品設計與前端開發經驗，AAPD 設計系統課程講師，awwrated 創辦人。專注於 UI/UX 設計、設計系統建置與培訓顧問服務。',
    path: 'about',
    type: 'profile' as const,
  },
  articles: {
    title: '文章',
    description: '分享產品設計、UI/UX、設計系統與前端開發的經驗與見解。',
    path: 'articles',
  },
  projects: {
    title: '作品集',
    description: '精選產品設計與前端開發專案，包含 UI/UX 設計、網站開發、設計系統建置等。',
    path: '',
  },
};
