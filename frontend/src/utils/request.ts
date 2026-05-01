/**
 * API 请求封装
 * 统一处理请求拦截、响应拦截、错误处理
 */

// API 基础地址
const BASE_URL = 'http://localhost:3000/api'

// 请求配置接口
interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  params?: any
  header?: any
  showLoading?: boolean
  silentError?: boolean
}

/**
 * 获取存储的 token
 */
const getToken = (): string => {
  return uni.getStorageSync('token') || ''
}

const clearStoredAuth = () => {
  uni.removeStorageSync('token')
  uni.removeStorageSync('userInfo')
}

/**
 * 显示加载提示
 */
const showLoading = (title: string = '加载中...') => {
  uni.showLoading({
    title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
const hideLoading = () => {
  uni.hideLoading()
}

/**
 * 显示错误提示
 */
const showError = (message: string) => {
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })
}

/**
 * 统一请求方法
 */
export const request = <T = any>(options: RequestOptions): Promise<T> => {
  const { url, method = 'GET', data, params, header = {}, showLoading: showLoadingFlag = true, silentError = false } = options

  // 构建完整 URL
  let fullUrl = `${BASE_URL}${url}`
  
  // 处理 GET 请求参数
  if (method === 'GET' && params) {
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    if (queryString) {
      fullUrl += `?${queryString}`
    }
  }

  // 构建请求头
  const requestHeader = {
    'Content-Type': 'application/json',
    ...header
  }

  // 获取 token（登录请求不添加 token）
  const token = getToken()
  if (token && !url.includes('/auth/login')) {
    requestHeader['Authorization'] = `Bearer ${token}`
  }

  // 显示加载提示
  if (showLoadingFlag) {
    showLoading()
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method,
      data,
      header: requestHeader,
      success: (res) => {
        const { statusCode, data: responseData } = res

        if (statusCode === 200 || statusCode === 201) {
          const result = responseData as any
          
          // 处理业务逻辑错误（如果后端返回了 code 字段）
          if (result.code && result.code !== 200 && result.code !== 201) {
            if (!silentError) {
              showError(result.message || '请求失败')
            }
            reject(result)
            return
          }

          // 如果后端返回了 data 字段，使用 data；否则直接使用返回的数据
          resolve((result.data !== undefined ? result.data : result) as T)
        } else if (statusCode === 400 || statusCode === 409) {
          const result = (responseData || {}) as any
          const error = new Error(result.message || '请求参数无效') as Error & { code?: number; response?: any }
          error.code = statusCode
          error.response = result

          if (!silentError) {
            showError(error.message)
          }
          reject(error)
        } else if (statusCode === 401) {
          const result = (responseData || {}) as any
          const error = new Error(result.message || (url.includes('/auth/login') ? '账号或密码错误' : '未授权访问')) as Error & { code?: number; response?: any }
          error.code = statusCode
          error.response = result

          if (!url.includes('/auth/login') && !url.includes('/auth/login/resolve-deletion')) {
            clearStoredAuth()
            showError('登录已过期，请重新登录')

            setTimeout(() => {
              uni.navigateTo({
                url: '/pages/login/login'
              })
            }, 1500)
          } else {
            showError(error.message)
          }

          reject(error)
        } else if (statusCode === 403) {
          const result = (responseData || {}) as any
          const error = new Error(result.message || '请求被拒绝') as Error & { code?: number; response?: any }
          error.code = statusCode
          error.response = result

          if (result.message === 'Invalid or expired token') {
            clearStoredAuth()
            showError('登录已过期，请重新登录')

            setTimeout(() => {
              uni.navigateTo({
                url: '/pages/login/login'
              })
            }, 1500)
          } else if (!silentError) {
            showError(error.message)
          }

          reject(error)
        } else if (statusCode === 404) {
          if (!silentError) {
            showError('请求的资源不存在')
          }
          reject(new Error('Not Found'))
        } else if (statusCode >= 500) {
          if (!silentError) {
            showError('服务器错误，请稍后重试')
          }
          reject(new Error('Server Error'))
        } else {
          if (!silentError) {
            showError('网络请求失败')
          }
          reject(new Error('Request Failed'))
        }
      },
      fail: (err) => {
        console.error('Request failed:', err)
        if (!silentError) {
          showError('网络连接失败，请检查网络')
        }
        reject(err)
      },
      complete: () => {
        if (showLoadingFlag) {
          hideLoading()
        }
      }
    })
  })
}

/**
 * GET 请求
 */
export const get = <T = any>(url: string, params?: any, options: Partial<RequestOptions> = {}): Promise<T> => {
  return request<T>({
    url,
    method: 'GET',
    params,
    ...options
  })
}

/**
 * POST 请求
 */
export const post = <T = any>(url: string, data?: any, options: Partial<RequestOptions> = {}): Promise<T> => {
  return request<T>({
    url,
    method: 'POST',
    data,
    ...options
  })
}

/**
 * PUT 请求
 */
export const put = <T = any>(url: string, data?: any, options: Partial<RequestOptions> = {}): Promise<T> => {
  return request<T>({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

/**
 * DELETE 请求
 */
export const del = <T = any>(url: string, data?: any, options: Partial<RequestOptions> = {}): Promise<T> => {
  return request<T>({
    url,
    method: 'DELETE',
    data,
    ...options
  })
}

/**
 * 上传文件
 */
export const upload = <T = any>(url: string, filePath: string, formData?: any, name: string = 'file'): Promise<T> => {
  const token = getToken()
  
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${BASE_URL}${url}`,
      filePath,
      name,
      formData,
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            resolve(data.data || data)
          } catch {
            resolve(res.data as any)
          }
        } else {
          reject(new Error('Upload failed'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

export default {
  request,
  get,
  post,
  put,
  del,
  upload
}
