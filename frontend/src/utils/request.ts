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
}

// 响应数据接口
interface ResponseData<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 获取存储的 token
 */
const getToken = (): string => {
  return uni.getStorageSync('token') || ''
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
  const { url, method = 'GET', data, params, header = {}, showLoading: showLoadingFlag = true } = options

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
            showError(result.message || '请求失败')
            if (showLoadingFlag) {
              hideLoading()
            }
            reject(result)
            return
          }
          
          // 如果后端返回了 data 字段，使用 data；否则直接使用返回的数据
          if (showLoadingFlag) {
            hideLoading()
          }
          resolve((result.data !== undefined ? result.data : result) as T)
        } else if (statusCode === 401) {
          // Token 过期或无效
          if (!url.includes('/auth/login')) {
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            showError('登录已过期，请重新登录')
            
            // 跳转到登录页
            setTimeout(() => {
              uni.navigateTo({
                url: '/pages/login/login'
              })
            }, 1500)
          } else {
            showError('账号或密码错误')
          }
          
          if (showLoadingFlag) {
            hideLoading()
          }
          reject(new Error('Unauthorized'))
        } else if (statusCode === 403) {
          // Token 无效或过期
          if (!url.includes('/auth/login')) {
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            showError('登录已过期，请重新登录')
            
            // 跳转到登录页
            setTimeout(() => {
              uni.navigateTo({
                url: '/pages/login/login'
              })
            }, 1500)
          } else {
            showError('账号已被禁用')
          }
          
          if (showLoadingFlag) {
            hideLoading()
          }
          reject(new Error('Forbidden'))
        } else if (statusCode === 404) {
          showError('请求的资源不存在')
          if (showLoadingFlag) {
            hideLoading()
          }
          reject(new Error('Not Found'))
        } else if (statusCode >= 500) {
          showError('服务器错误，请稍后重试')
          if (showLoadingFlag) {
            hideLoading()
          }
          reject(new Error('Server Error'))
        } else {
          showError('网络请求失败')
          if (showLoadingFlag) {
            hideLoading()
          }
          reject(new Error('Request Failed'))
        }
      },
      fail: (err) => {
        console.error('Request failed:', err)
        showError('网络连接失败，请检查网络')
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
export const upload = <T = any>(url: string, filePath: string, formData?: any): Promise<T> => {
  const token = getToken()
  
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${BASE_URL}${url}`,
      filePath,
      name: 'file',
      formData,
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            resolve(data.data || data)
          } catch (e) {
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
