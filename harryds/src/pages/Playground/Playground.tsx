// =============================================================================
// PLAYGROUND 頁面
// =============================================================================

import React from 'react';
import './Playground.scss';

export const Playground: React.FC = () => {
  return (
    <div className="playground">
      <div className="playground__container">
        <h1>Playground</h1>
        <p>在這裡測試和組裝元件</p>
        
        {/* 在此處添加您的元件 */}
        <div className="playground__content">
          
        </div>
      </div>
    </div>
  );
};

export default Playground;
