import React, { useState, useEffect } from 'react';
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

	// 手機版選單狀態
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// 監聽視窗寬度
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 1000);
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// 當選單打開時，鎖定 body 滾動
	useEffect(() => {
		if (isMobileMenuOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [isMobileMenuOpen]);

	const handleMobileMenuToggle = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const handleMobileMenuItemClick = (itemKey: string) => {
		setIsMobileMenuOpen(false);
		onMenuItemClick && onMenuItemClick(itemKey);
	};

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

				{/* 桌面版導航 */}
				<nav className="home__nav home__nav--desktop">
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

				{/* 手機版 MENU 按鈕 */}
				{isMobile && !hideNav && (
					<button
						className="mobile-menu-button"
						onClick={handleMobileMenuToggle}
						onMouseEnter={() => onMenuItemHover && onMenuItemHover('menu')}
						aria-label="開啟選單"
					>
						<PixelText2D
							text="[ MENU ]"
							textEnabled
							pixelSize={2}
							width={calcPixelTextWidth('[ MENU ]')}
							height={24}
							animated={false}
							primaryColor={primaryColor}
							onPrimaryColor={onPrimaryColor}
						/>
					</button>
				)}
			</div>

			{/* 手機版全螢幕選單 */}
			{isMobile && isMobileMenuOpen && (
				<div className="mobile-menu-overlay">
					<div className="mobile-menu-content">
						{/* Close 按鈕 - 右上角 */}
						<button
							className="mobile-menu-close"
							onClick={handleMobileMenuToggle}
							onMouseEnter={() => onMenuItemHover && onMenuItemHover('close')}
							aria-label="關閉選單"
						>
							<PixelText2D
								text="×"
								textEnabled
								pixelSize={3}
								letterSpacing={0}
								width={24}
								height={24}
								animated={false}
								primaryColor="var(--hds-sys-color-theme-surface)"
							/>
						</button>

						{/* 第一行：Theme, Sound, Language */}
						<div className="mobile-menu-controls">
							{showThemeToggle && (
								<button
									className="mobile-menu-control-item mobile-menu-theme-toggle"
									onClick={() => {
										onToggleTheme && onToggleTheme();
									}}
									onMouseEnter={onThemeHover}
									aria-label="切換主題"
								>
									<PixelText2D
										text={theme === 'dark' ? '☽' : '☀'}
										textEnabled
										pixelSize={2}
										letterSpacing={0}
										width={36}
										height={36}
										animated={false}
										primaryColor="var(--hds-sys-color-theme-surface)"
									/>
								</button>
							)}
							{showSoundToggle && (
								<button
									className="mobile-menu-control-item mobile-menu-sound-toggle"
									onClick={() => {
										onToggleSound && onToggleSound();
									}}
									onMouseEnter={onSoundHover}
									aria-label="切換音效"
								>
									<PixelText2D
										text={isSoundEnabled ? '🔊' : '🔇'}
										textEnabled
										pixelSize={2}
										letterSpacing={0}
										width={36}
										height={36}
										animated={false}
										primaryColor="var(--hds-sys-color-theme-surface)"
									/>
								</button>
							)}
							{showLanguageToggle && (
								<div className="mobile-menu-lang-group">
									{[{ code: 'en', label: 'EN' }, { code: 'zh-Hant', label: 'ZH' }, { code: 'ja', label: 'JP' }].map((lang) => {
										const isCurrentLang = currentLangDisplay === lang.label;
										return (
											<button
												key={lang.code}
												className={`mobile-menu-control-item mobile-menu-lang-item ${isCurrentLang ? 'mobile-menu-lang-item--active' : ''}`}
												onClick={() => {
													onLanguageChange && onLanguageChange(lang.code);
												}}
												onMouseEnter={onLanguageHover}
												aria-label={`切換到 ${lang.label}`}
											>
												<PixelText2D
													text={lang.label}
													textEnabled
													pixelSize={2}
													letterSpacing={0}
													width={32}
													height={24}
													animated={false}
													primaryColor="var(--hds-sys-color-theme-surface)"
												/>
											</button>
										);
									})}
								</div>
							)}
						</div>

						{/* 主要導航項目 */}
						<nav className="mobile-menu-nav">
							{menuItems.map((itemKey) => {
								const label = t(`nav.${itemKey}`);
								const isActive = activeMenuItem === itemKey;
								// 計算較大的寬度（pixelSize=3）
								const charCount = label.length;
								const width = charCount * 24 + Math.max(0, charCount - 1) * 3; // pixelSize=3
								return (
									<button
										key={itemKey}
										className={`mobile-menu-nav-item ${isActive ? 'mobile-menu-nav-item--active' : ''}`}
										onClick={() => handleMobileMenuItemClick(itemKey)}
										onMouseEnter={() => onMenuItemHover && onMenuItemHover(itemKey)}
										style={{ position: 'relative' }}
									>
										<PixelText2D
											text={label}
											textEnabled
											pixelSize={3}
											width={width}
											height={36}
											animated={false}
											primaryColor="var(--hds-sys-color-theme-surface)"
										/>
										{isActive && (
											<div className="marquee-container marquee-container--mobile">
												<div className="marquee-pixels" style={{ color: 'var(--hds-sys-color-theme-surface)' }}>
													<div className="marquee-pixel marquee-pixel--1" style={{ opacity: 0.2 }} />
													<div className="marquee-pixel marquee-pixel--2" style={{ opacity: 0.4 }} />
													<div className="marquee-pixel marquee-pixel--3" style={{ opacity: 0.6 }} />
													<div className="marquee-pixel marquee-pixel--4" style={{ opacity: 0.8 }} />
													<div className="marquee-pixel marquee-pixel--5" style={{ opacity: 1 }} />
												</div>
											</div>
										)}
									</button>
								);
							})}
						</nav>
					</div>
				</div>
			)}
		</header>
	);
};

export default Header;
