import { ref } from 'vue'

// 设备信息
const systemInfo = ref<UniApp.GetSystemInfoResult | null>(null)
const statusBarHeight = ref(0)
const navigationBarHeight = ref(44) // 默认导航栏高度（px）
const safeAreaBottom = ref(0)
const isIPhoneX = ref(false)

export const initDeviceInfo = (): Promise<UniApp.GetSystemInfoResult> => {
  return new Promise((resolve, reject) => {
    uni.getSystemInfo({
      success: (res) => {
        systemInfo.value = res
        statusBarHeight.value = res.statusBarHeight || 0
        
        // 判断是否是 iPhone X 及以上机型
        isIPhoneX.value = /iphone/gi.test(res.model) && 
          (res.screenHeight === 812 || res.screenHeight === 896 || 
           res.screenHeight === 844 || res.screenHeight === 926 ||
           res.screenHeight === 1024)
        
        // 计算底部安全区域（转换为 rpx）
        if (res.safeArea && res.safeArea.bottom) {
          const scale = res.windowWidth / 375 // 以 iPhone 6/7/8 为基准
          safeAreaBottom.value = (res.safeArea.bottom - (res.windowHeight - res.safeArea.height)) * 2 * scale
        }
        
        resolve(res)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

export const useDeviceInfo = () => {
  return {
    systemInfo,
    statusBarHeight,
    navigationBarHeight,
    safeAreaBottom,
    isIPhoneX
  }
}

export const getTopBarHeight = (): number => {
  return statusBarHeight.value + navigationBarHeight.value
}