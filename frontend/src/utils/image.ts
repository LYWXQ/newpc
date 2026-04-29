/**
 * 图片处理工具
 */

// 服务器基础URL
const BASE_URL = 'http://localhost:3000'

/**
 * 检查路径是否包含乱码字符（%EF%BF%BD 是Unicode替换字符）
 */
const hasInvalidChars = (path: string): boolean => {
  // 检查是否包含 URL 编码的乱码
  if (path.includes('%EF%BF%BD') || path.includes('\uFFFD')) {
    return true
  }
  // 检查是否包含空字节或其他无效字符
  const invalidPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/
  return invalidPattern.test(path)
}

/**
 * 获取图片URL - 兼容H5和微信小程序
 * @param imagePath 图片路径（可能为undefined/null/string）
 * @returns 完整的图片URL
 */
export const getImageUrl = (imagePath?: string | null): string => {
  // 如果路径为空或不是字符串，返回本地默认图片
  if (!imagePath || typeof imagePath !== 'string') {
    return '/static/logo.png'
  }
  
  // 如果是完整的URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // 如果是本地路径（以/static开头），直接返回
  if (imagePath.startsWith('/static/')) {
    return imagePath
  }
  
  // 如果是/uploads路径，添加服务器地址前缀
  if (imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/')) {
    // 标准化路径，确保以/uploads/开头
    let normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
    
    // 解码可能的URL编码问题
    let decodedPath = decodeURIComponent(normalizedPath)
    
    // 检查解码后是否包含乱码
    if (hasInvalidChars(decodedPath)) {
      // 如果有乱码，尝试从原始路径中提取看起来有效的部分
      const match = imagePath.match(/uploads\/\d{6}\/\d+-\d+\.png/i)
      if (match) {
        decodedPath = '/' + match[0]
      } else {
        // 无法修复，返回默认图片
        return '/static/logo.png'
      }
    }
    
    // 确保路径格式正确（避免双重斜杠）
    const finalPath = decodedPath.replace(/\/\/+/g, '/')
    
    return `${BASE_URL}${finalPath}`
  }
  
  // 其他相对路径，添加服务器地址前缀（确保只有一个斜杠）
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath
  return `${BASE_URL}/${cleanPath}`
}
