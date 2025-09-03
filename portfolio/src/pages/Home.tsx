import React from 'react';
import { useTranslation } from 'react-i18next';
import { PixelText } from 'hds';

const Home: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>
      <div style={{ marginTop: 16 }}>
        <PixelText 
          text={t('brand.harry')}
          textEnabled
          pixelSize={4}
          width={360}
          height={60}
          animated
          totalAnimationDuration={900}
          textBoxEnabled
          textBox={t('brand.tagline')}
          textBoxWidth={8}
          textBoxPadding={2}
        />
      </div>
    </div>
  );
};

export default Home;


