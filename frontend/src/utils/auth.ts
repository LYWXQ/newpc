/**
 * 权限检查工具函数
 * 提供统一的登录状态检查和权限控制功能
 */

/**
 * 检查是否已登录
 * @returns {boolean} 是否已登录
 */
export const isLoggedIn = (): boolean => {
  const token = uni.getStorageSync('token')
  return !!token
}

/**
 * 获取登录前访问的页面路径
 * @returns {string} 页面路径
 */
export const getRedirectPath = (): string => {
  return uni.getStorageSync('redirectPath') || ''
}

/**
 * 保存登录后需要跳转的页面路径
 * @param {string} path - 页面路径
 */
export const setRedirectPath = (path: string): void => {
  uni.setStorageSync('redirectPath', path)
}

/**
 * 清除登录后跳转路径
 */
export const clearRedirectPath = (): void => {
  uni.removeStorageSync('redirectPath')
}

/**
 * 需要登录的页面列表
 */
const publicPages = ['/pages/login/login', '/pages/register/register']

/**
 * 检查页面是否需要登录
 * @param {string} path - 页面路径
 * @returns {boolean} 是否需要登录
 */
export const requiresAuth = (path: string): boolean => {
  return !publicPages.includes(path)
}

/**
 * 强制登录检查
 * 如果未登录，跳转到登录页面并记录当前页面
 * @param {string} currentPath - 当前页面路径
 */
export const requireAuth = (currentPath: string): void => {
  if (!isLoggedIn()) {
    // 记录当前页面，以便登录后返回
    if (requiresAuth(currentPath)) {
      setRedirectPath(currentPath)
    }
    uni.redirectTo({
      url: '/pages/login/login'
    })
  }
}

/**
 * 登录成功后的处理
 * 跳转到之前访问的页面或首页
 */
export const handleLoginSuccess = (): void => {
  const redirectPath = getRedirectPath()
  if (redirectPath && requiresAuth(redirectPath)) {
    clearRedirectPath()
    uni.redirectTo({
      url: redirectPath
    })
  } else {
    uni.switchTab({
      url: '/pages/index/index'
    })
  }
}

/**
 * 简化版登录检查
 * 如果未登录，跳转到登录页面
 * @returns {boolean} 是否已登录
 */
export const checkLogin = (): boolean => {
  if (!isLoggedIn()) {
    uni.navigateTo({
      url: '/pages/login/login'
    })
    return false
  }
  return true
}

/**
 * 清除登录状态
 */
export const clearAuth = (): void => {
  uni.removeStorageSync('token')
  uni.removeStorageSync('userInfo')
  clearRedirectPath()
}

export default {
  isLoggedIn,
  getRedirectPath,
  setRedirectPath,
  clearRedirectPath,
  requiresAuth,
  requireAuth,
  handleLoginSuccess,
  clearAuth
}
