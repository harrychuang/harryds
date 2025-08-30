import { addons } from '@storybook/manager-api';

addons.setConfig({
  // 手機/窄螢幕預設打開 Addons 區域
  initialActive: 'addons',
  // 預設選擇 Controls 面板（覆蓋瀏覽器記憶）
  selectedPanel: 'storybook/controls/panel',
});


