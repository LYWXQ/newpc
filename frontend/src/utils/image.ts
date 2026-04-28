/**
 * 图片处理工具
 */

/**
 * 获取图片URL
 * @param imagePath 图片路径
 * @returns 完整的图片URL
 */
export const getImageUrl = (imagePath: string): string => {
  // 如果是完整的URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // 否则返回默认的占位图
  return 'https://via.placeholder.com/100x100?text=No+Image'
}
