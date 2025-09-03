import React from 'react';
import { useTranslation } from 'react-i18next';
import { PixelText } from 'hds';

const About: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('about.title')}</h1>
      <p>{t('about.intro')}</p>
      <div style={{ marginTop: 16 }}>
        <PixelText 
          text={t('about.pixelTitle')}
          textEnabled
          pixelSize={3}
          width={300}
          height={50}
          animated
          totalAnimationDuration={800}
        />
      </div>
    </div>
  );
};

export default About;


