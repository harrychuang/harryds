// =============================================================================
// MYLIFE IMAGES - mylife 資料夾的照片清單
// =============================================================================
// 使用 Vite 的 import.meta.glob 動態載入所有照片
// =============================================================================

// 使用 Vite 的 glob import 載入所有 jpeg 圖片
const imageModules = import.meta.glob(
  '../../../assets/imgs/mylife/*.jpeg',
  { 
    eager: true,
    as: 'url'
  }
);

// 將模組轉換為 URL 陣列
export const mylifeImages: string[] = Object.values(imageModules) as string[];

// 取得隨機 N 張照片
export const getRandomImages = (count: number): string[] => {
  const shuffled = [...mylifeImages].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// 照片總數
export const totalImageCount = mylifeImages.length;

export default mylifeImages;
