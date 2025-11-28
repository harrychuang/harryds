import React from 'react';
import { Logo, PixelText2D } from 'hds';
import './Header.scss';

export interface HeaderProps {
	// Logo controls
	onLogoClick?: () => void;
	onLogoMouseEnter?: () => void;
	onLogoMouseLeave?: () => void;
	logoType?: 'default' | 'back';
	logoAnimated?: boolean;
	logoColors?: { primaryColor?: string; secondaryColor?: string };
	logoWrapperStyle?: React.CSSProperties;

	// Navigation controls
	hideNav?: boolean;
	menuItems?: string[]; // keys like 'home' | 'works' | 'article' | 'about'
	activeMenuItem?: string; // current active menu item
	t?: (key: string) => string; // i18n translator
	getMenuItemAnimated?: (key: string) => boolean;
	onMenuItemHover?: (key: string) => void; // also for hover sound
	onMenuItemClick?: (key: string) => void; // includes navigation + click sound
	navColors?: { primaryColor?: string; secondaryColor?: string };

	// Theme toggle
	showThemeToggle?: boolean;
	theme?: 'light' | 'dark' | string;
	onToggleTheme?: () => void;
	onThemeHover?: () => void;

	// Sound toggle
	showSoundToggle?: boolean;
	isSoundEnabled?: boolean;
	onToggleSound?: () => void;
	onSoundHover?: () => void;

	// Data source toggle
	showDataSourceToggle?: boolean;
	dataSource?: 'local' | 'strapi';
	onToggleDataSource?: () => void;
	onDataSourceHover?: () => void;

	// Language dropdown
	showLanguageToggle?: boolean;
	currentLangDisplay?: string; // e.g. 'EN' | 'ZH' | 'JP'
	isLangDropdownOpen?: boolean;
	onToggleLangDropdown?: () => void;
	langDropdownRef?: React.RefObject<HTMLDivElement> | React.MutableRefObject<HTMLDivElement | null>;
	languageOptions?: Array<{ code: string; label: string }>; // available options
	onLanguageChange?: (code: string) => void;
	onLanguageHover?: () => void;
}

const calcPixelTextWidth = (text: string): number => {
	// pixelSize = 2, CHAR_WIDTH(8) * 2 = 16; letterSpacing(1) * 2 = 2
	const charCount = text.length;
	return charCount * 16 + Math.max(0, charCount - 1) * 2;
};

const Header: React.FC<HeaderProps> = ({
	onLogoClick,
	onLogoMouseEnter,
	onLogoMouseLeave,
	logoType = 'default',
	logoAnimated = true,
	logoColors,
	logoWrapperStyle,

	hideNav = false,
	menuItems = ['work', 'articles', 'about'],
	activeMenuItem,
	t = (k: string) => k,
	getMenuItemAnimated,
	onMenuItemHover,
	onMenuItemClick,
	navColors,

	showThemeToggle = true,
	theme,
	onToggleTheme,
	onThemeHover,

	showSoundToggle = true,
	isSoundEnabled = true,
	onToggleSound,
	onSoundHover,

	showDataSourceToggle = false,
	dataSource,
	onToggleDataSource,
	onDataSourceHover,

	showLanguageToggle = true,
	currentLangDisplay,
	isLangDropdownOpen,
	onToggleLangDropdown,
	langDropdownRef,
	languageOptions = [],
	onLanguageChange,
	onLanguageHover,
}) => {
	const primaryColor = navColors?.primaryColor;
	const onPrimaryColor = navColors?.secondaryColor;

	return (
		<header className="home__header">
			<div className="header-content">
				<div
					onClick={onLogoClick}
					onMouseEnter={onLogoMouseEnter}
					onMouseLeave={onLogoMouseLeave}
					className="logo-wrapper"
					style={logoWrapperStyle}
				>
					<Logo
						type={logoType}
						animated={!!logoAnimated}
						{...(logoColors || {})}
					/>
				</div>
				<nav className="home__nav">
					{!hideNav && (
						<>
							{menuItems.map((itemKey) => {
								const label = t(`nav.${itemKey}`);
								const width = calcPixelTextWidth(label);
								const animated = getMenuItemAnimated ? !!getMenuItemAnimated(itemKey) : false;
								const isActive = activeMenuItem === itemKey;
								return (
									<div
										key={itemKey}
										className="home__nav-item"
										onMouseEnter={() => { onMenuItemHover && onMenuItemHover(itemKey); }}
										onClick={() => { onMenuItemClick && onMenuItemClick(itemKey); }}
										style={{ position: 'relative' }}
									>
										<PixelText2D
											text={label}
											textEnabled
											pixelSize={2}
											width={width}
											height={24}
											animated={animated}
											totalAnimationDuration={400}
											primaryColor={primaryColor}
											onPrimaryColor={onPrimaryColor}
										/>
										{isActive && (
											<div className="marquee-container">
												<div className="marquee-pixels" style={{ color: primaryColor || 'var(--hds-sys-color-theme-surface)' }}>
													<div className="marquee-pixel marquee-pixel--1" style={{ opacity: 0.2 }} />
													<div className="marquee-pixel marquee-pixel--2" style={{ opacity: 0.4 }} />
													<div className="marquee-pixel marquee-pixel--3" style={{ opacity: 0.6 }} />
													<div className="marquee-pixel marquee-pixel--4" style={{ opacity: 0.8 }} />
													<div className="marquee-pixel marquee-pixel--5" style={{ opacity: 1 }} />
												</div>
											</div>
										)}
									</div>
								);
							})}
							{showThemeToggle && (
								<div className="home__nav-item">
									<div
										role="button"
										tabIndex={0}
										onClick={onToggleTheme}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												onToggleTheme && onToggleTheme();
											}
										}}
										onMouseEnter={onThemeHover}
										aria-label="切換主題"
										title={theme === 'dark' ? '切換為亮色' : '切換為暗色'}
										className="theme-toggle"
										style={{ borderColor: primaryColor || 'var(--hds-sys-color-theme-surface)' }}
									>
										<PixelText2D
											text={theme === 'dark' ? '☽' : '☀'}
											textEnabled
											pixelSize={2}
											letterSpacing={0}
											width={36}
											height={36}
											animated={false}
											primaryColor={primaryColor}
											onPrimaryColor={onPrimaryColor}
										/>
									</div>
								</div>
							)}
							{showSoundToggle && (
								<div className="home__nav-item">
									<div
										role="button"
										tabIndex={0}
										onClick={onToggleSound}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												onToggleSound && onToggleSound();
											}
										}}
										onMouseEnter={onSoundHover}
										aria-label="切換音效"
										title={isSoundEnabled ? '關閉音效' : '開啟音效'}
										className="sound-toggle"
										style={{ borderColor: primaryColor || 'var(--hds-sys-color-theme-surface)' }}
									>
										<PixelText2D
											text={isSoundEnabled ? '🔊' : '🔇'}
											textEnabled
											pixelSize={2}
											letterSpacing={0}
											width={36}
											height={36}
											animated={false}
											primaryColor={primaryColor}
											onPrimaryColor={onPrimaryColor}
										/>
									</div>
								</div>
							)}
							{showDataSourceToggle && (
								<div className="home__nav-item">
									<div
										role="button"
										tabIndex={0}
										onClick={onToggleDataSource}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												onToggleDataSource && onToggleDataSource();
											}
										}}
										onMouseEnter={onDataSourceHover}
										aria-label="切換資料來源"
										title={dataSource === 'local' ? '使用本地資料' : '使用 Strapi 資料'}
										className="data-source-toggle"
										style={{ borderColor: primaryColor || 'var(--hds-sys-color-theme-surface)' }}
									>
										<PixelText2D
											text={dataSource === 'local' ? 'LOC' : 'API'}
											textEnabled
											pixelSize={2}
											letterSpacing={0}
											width={48}
											height={24}
											animated={false}
											primaryColor={primaryColor}
											onPrimaryColor={onPrimaryColor}
										/>
									</div>
								</div>
							)}
						</>
					)}

					{showLanguageToggle && (
						<div className="home__nav-item" ref={langDropdownRef}>
							<div
								role="button"
								tabIndex={0}
								onClick={onToggleLangDropdown}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onToggleLangDropdown && onToggleLangDropdown();
									}
								}}
								onMouseEnter={onLanguageHover}
								aria-label="切換語言"
								title="切換語言"
								className="lang-toggle"
								style={{ borderColor: primaryColor || 'var(--hds-sys-color-theme-surface)' }}
							>
								<PixelText2D
									text={currentLangDisplay || ''}
									textEnabled
									pixelSize={2}
									letterSpacing={0}
									width={32}
									height={24}
									animated={false}
									primaryColor={primaryColor}
									onPrimaryColor={onPrimaryColor}
								/>
							</div>

							{isLangDropdownOpen && (
								<div className="lang-dropdown">
									{languageOptions.map((lang) => (
										<div
											key={lang.code}
											className="lang-dropdown__item"
											onClick={() => onLanguageChange && onLanguageChange(lang.code)}
											onMouseEnter={onLanguageHover}
											style={{
												borderColor: primaryColor || 'var(--hds-sys-color-theme-surface)',
												backgroundColor: 'transparent',
											}}
										>
											<PixelText2D
												text={lang.label}
												textEnabled
												pixelSize={1}
												letterSpacing={0}
												width={40}
												height={24}
												animated={false}
												primaryColor={primaryColor || 'var(--hds-sys-color-theme-surface)'}
												onPrimaryColor={onPrimaryColor}
											/>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</nav>
			</div>
		</header>
	);
};

export default Header;
