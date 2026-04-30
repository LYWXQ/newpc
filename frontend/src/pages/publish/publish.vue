<template>
  <view class="container">
    <form class="publish-form">
      <view class="form-item">
        <text class="label required">交易方式</text>
        <view class="tag-group">
          <view
            class="tag-item"
            :class="{ active: form.transactionType === 'free' }"
            @click="form.transactionType = 'free'"
          >
            <text>免费</text>
          </view>
          <view
            class="tag-item"
            :class="{ active: form.transactionType === 'rent' }"
            @click="form.transactionType = 'rent'"
          >
            <text>租用</text>
          </view>
          <view
            class="tag-item"
            :class="{ active: form.transactionType === 'sell' }"
            @click="form.transactionType = 'sell'"
          >
            <text>转卖</text>
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="label required">物品标题</text>
        <input
          class="input"
          type="text"
          placeholder="请输入物品标题"
          v-model="form.title"
        >
      </view>

      <view class="form-item">
        <text class="label required">物品分类</text>
        <picker
          class="picker"
          :range="categories"
          :value="form.categoryIndex"
          @change="handleCategoryChange"
        >
          <view class="picker-text">{{
            categories[form.categoryIndex] || "请选择分类"
          }}</view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">物品描述</text>
        <textarea
          class="textarea"
          placeholder="请详细描述物品的成色、使用方法等信息"
          v-model="form.description"
        />
      </view>

      <view class="form-item" v-if="form.transactionType === 'rent'">
        <text class="label required">租金 (元/天)</text>
        <input
          class="input"
          type="number"
          placeholder="请输入租金"
          v-model="form.price"
        >
      </view>

      <view class="form-item" v-if="form.transactionType === 'sell'">
        <text class="label required">售价 (元)</text>
        <input
          class="input"
          type="number"
          placeholder="请输入售价"
          v-model="form.salePrice"
        >
      </view>

      <view class="form-item" v-if="form.transactionType === 'rent'">
        <text class="label required">押金 (元)</text>
        <input
          class="input"
          type="number"
          placeholder="请输入押金"
          v-model="form.deposit"
        >
      </view>

      <view class="form-item" v-if="form.transactionType === 'rent'">
        <view class="form-item-header">
          <text class="label">可租时间</text>
          <view class="switch-section">
            <text class="switch-label">长期租用</text>
            <switch
              :checked="form.isLongTermRent"
              @change="handleLongTermRentChange"
              color="#007aff"
            />
          </view>
        </view>
        <view class="time-picker-section">
          <view class="time-picker-item">
            <text class="time-picker-label">开始时间</text>
            <view class="datetime-picker-row">
              <picker
                class="datetime-picker date-picker"
                mode="date"
                :value="form.availableTime.startDate"
                @change="handleStartDateChange"
              >
                <view class="picker-text">{{
                  form.availableTime.startDate || "日期"
                }}</view>
              </picker>
              <picker
                class="datetime-picker time-picker"
                mode="time"
                :value="form.availableTime.startTime"
                @change="handleStartTimeChange"
              >
                <view class="picker-text">{{
                  form.availableTime.startTime || "时间"
                }}</view>
              </picker>
            </view>
            <view class="display-time">
              {{ displayStartTime || "未选择" }}
            </view>
          </view>
          
          <view class="time-picker-item" v-if="!form.isLongTermRent">
            <text class="time-picker-label">结束时间</text>
            <view class="datetime-picker-row">
              <picker
                class="datetime-picker date-picker"
                mode="date"
                :value="form.availableTime.endDate"
                @change="handleEndDateChange"
              >
                <view class="picker-text">{{
                  form.availableTime.endDate || "日期"
                }}</view>
              </picker>
              <picker
                class="datetime-picker time-picker"
                mode="time"
                :value="form.availableTime.endTime"
                @change="handleEndTimeChange"
              >
                <view class="picker-text">{{
                  form.availableTime.endTime || "时间"
                }}</view>
              </picker>
            </view>
            <view class="display-time">
              {{ displayEndTime || "未选择" }}
            </view>
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="label">交易地点</text>
        <input
          class="input"
          type="text"
          placeholder="请输入交易地点"
          v-model="form.location"
        >
      </view>

      <view class="form-item">
        <text class="label">物品图片</text>
        <view class="image-upload-area">
          <view class="image-list">
            <view
              v-for="(image, index) in form.images"
              :key="index"
              class="image-item"
            >
              <image
                class="uploaded-image"
                :src="image"
                mode="aspectFill"
              />
              <view class="delete-btn" @click="removeImage(index)">
                <text class="delete-icon">×</text>
              </view>
            </view>
            <view
              v-if="form.images.length < 6"
              class="upload-btn"
              @click="chooseImage"
            >
              <text class="upload-plus">+</text>
              <text class="upload-hint">{{ form.images.length }}/6</text>
            </view>
          </view>
        </view>
      </view>

      <button
        class="submit-button"
        :disabled="isSubmitting"
        @click="submitForm"
      >
        {{ isSubmitting ? (isEditMode ? "保存中..." : "发布中...") : (isEditMode ? "保存修改" : "发布物品") }}
      </button>
    </form>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { createItem, updateItem, getItemDetail, type CreateItemParams, type Item } from '@/api/items'
  import { upload } from '@/utils/request'
  import { isLoggedIn } from '@/utils/auth'

  const itemId = ref<number | null>(null)
  const isEditMode = ref(false)
  const originalStatus = ref<string>('available') // 保存原始状态

  const getCurrentDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getCurrentTime = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const form = ref({
    title: '',
    categoryIndex: 0,
    description: '',
    price: '',
    deposit: '',
    transactionType: 'rent' as 'free' | 'rent' | 'sell',
    salePrice: '',
    isLongTermRent: false,
    availableTime: {
      startDate: getCurrentDate(),
      startTime: getCurrentTime(),
      endDate: '',
      endTime: '',
    },
    location: '',
    images: [] as string[],
  })

  const displayStartTime = computed(() => {
    const { startDate, startTime } = form.value.availableTime
    if (startDate && startTime) {
      return `${startDate} ${startTime}`
    }
    return ''
  })

  const displayEndTime = computed(() => {
    const { endDate, endTime } = form.value.availableTime
    if (endDate && endTime) {
      return `${endDate} ${endTime}`
    }
    return ''
  })

  const isSubmitting = ref(false)
  const categories = ['图书', '电子产品', '运动器材', '生活用品', '服装', '其他']

  onMounted(() => {
    if (!isLoggedIn()) {
      uni.reLaunch({
        url: '/pages/login/login'
      })
      return
    }
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1] as any
    const options = currentPage?.options || {}
    if (options.id) {
      itemId.value = parseInt(options.id)
      isEditMode.value = true
      loadItemDetail()
    }
  })

  const loadItemDetail = async () => {
    try {
      uni.showLoading({ title: '加载中...' })
      const { item } = await getItemDetail(itemId.value!)
      // 保存原始状态
      originalStatus.value = item.status
    
      form.value.title = item.title
      form.value.description = item.description || ''
      form.value.categoryIndex = categories.indexOf(item.category)
      if (form.value.categoryIndex === -1) form.value.categoryIndex = 0
      form.value.price = item.price.toString()
      form.value.deposit = item.deposit.toString()
      form.value.transactionType = item.transactionType || 'rent'
      form.value.salePrice = item.salePrice ? item.salePrice.toString() : ''
      form.value.isLongTermRent = item.isLongTermRent || false
      form.value.location = item.location || ''
      form.value.images = item.images || []
      if (item.availableTime) {
        if (item.availableTime.start) {
          const parts = item.availableTime.start.split(' ')
          form.value.availableTime.startDate = parts[0] || ''
          form.value.availableTime.startTime = parts[1] || ''
        }
        if (item.availableTime.end) {
          const parts = item.availableTime.end.split(' ')
          form.value.availableTime.endDate = parts[0] || ''
          form.value.availableTime.endTime = parts[1] || ''
        }
      }
    } catch (error) {
      uni.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      uni.hideLoading()
    }
  }

  const handleLongTermRentChange = (e: any) => {
    form.value.isLongTermRent = e.detail.value
  }

  const handleCategoryChange = (e: any) => {
    form.value.categoryIndex = e.detail.value
  }

  const combineDateTime = (date: string, time: string) => {
    return new Date(`${date}T${time}`)
  }

  const isPastDateTime = (date: string, time: string) => {
    if (!date || !time) return false
    const selected = combineDateTime(date, time)
    const now = new Date()
    return selected < now
  }

  const isEndBeforeStart = () => {
    const { startDate, startTime, endDate, endTime } = form.value.availableTime
    if (!startDate || !startTime || !endDate || !endTime) return false
    const start = combineDateTime(startDate, startTime)
    const end = combineDateTime(endDate, endTime)
    return end <= start
  }

  const handleStartDateChange = (e: any) => {
    const selectedDate = e.detail.value
    const currentTime = form.value.availableTime.startTime || getCurrentTime()
  
    if (isPastDateTime(selectedDate, currentTime)) {
      uni.showToast({
        title: '不能选择过去的日期',
        icon: 'none',
      })
      return
    }
  
    form.value.availableTime.startDate = selectedDate
  }

  const handleStartTimeChange = (e: any) => {
    const selectedTime = e.detail.value
    const currentDate = form.value.availableTime.startDate || getCurrentDate()
  
    if (isPastDateTime(currentDate, selectedTime)) {
      uni.showToast({
        title: '不能选择过去的时间',
        icon: 'none',
      })
      return
    }
  
    form.value.availableTime.startTime = selectedTime
  }

  const handleEndDateChange = (e: any) => {
    const selectedDate = e.detail.value
    const currentTime = form.value.availableTime.endTime || '23:59'
  
    if (isPastDateTime(selectedDate, currentTime)) {
      uni.showToast({
        title: '不能选择过去的日期',
        icon: 'none',
      })
      return
    }
  
    form.value.availableTime.endDate = selectedDate
  }

  const handleEndTimeChange = (e: any) => {
    const selectedTime = e.detail.value
    const currentDate = form.value.availableTime.endDate || getCurrentDate()
  
    if (isPastDateTime(currentDate, selectedTime)) {
      uni.showToast({
        title: '不能选择过去的时间',
        icon: 'none',
      })
      return
    }
  
    form.value.availableTime.endTime = selectedTime
  }

  const chooseImage = () => {
    const remainCount = 6 - form.value.images.length
    uni.chooseImage({
      count: remainCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths as string[]
        uploadImages(tempFilePaths)
      },
    })
  }

  const uploadImages = async (filePaths: string[]) => {
    uni.showLoading({ title: '上传中...' })

    try {
      for (const filePath of filePaths) {
        const result = await upload('/upload', filePath)
        if (result && typeof result === 'object' && 'url' in result) {
          form.value.images.push((result as { url: string }).url)
        } else if (typeof result === 'string') {
          form.value.images.push(result)
        }
      }
    } catch (error) {
      console.error('上传图片失败:', error)
      uni.showToast({
        title: '图片上传失败',
        icon: 'none',
      })
    } finally {
      uni.hideLoading()
    }
  }

  const removeImage = (index: number) => {
    form.value.images.splice(index, 1)
  }

  const validateForm = (): boolean => {
    if (!form.value.title.trim()) {
      uni.showToast({
        title: '请输入物品标题',
        icon: 'none',
      })
      return false
    }

    if (form.value.transactionType === 'rent') {
      if (!form.value.price || parseFloat(form.value.price) <= 0) {
        uni.showToast({
          title: '请输入有效的租金',
          icon: 'none',
        })
        return false
      }

      if (!form.value.deposit || parseFloat(form.value.deposit) < 0) {
        uni.showToast({
          title: '请输入有效的押金',
          icon: 'none',
        })
        return false
      }
    }

    if (form.value.transactionType === 'sell') {
      if (!form.value.salePrice || parseFloat(form.value.salePrice) <= 0) {
        uni.showToast({
          title: '请输入有效的售价',
          icon: 'none',
        })
        return false
      }
    }

    if (form.value.transactionType === 'rent') {
      const { startDate, startTime, endDate, endTime } = form.value.availableTime
    
      if (startDate && startTime) {
        if (isPastDateTime(startDate, startTime)) {
          uni.showToast({
            title: '开始时间不能早于当前时间',
            icon: 'none',
          })
          return false
        }
      }
    
      if (!form.value.isLongTermRent && endDate && endTime) {
        if (isPastDateTime(endDate, endTime)) {
          uni.showToast({
            title: '结束时间不能早于当前时间',
            icon: 'none',
          })
          return false
        }
      }
    
      if (!form.value.isLongTermRent && (startDate && startTime) && (endDate && endTime)) {
        if (isEndBeforeStart()) {
          uni.showToast({
            title: '结束时间必须晚于开始时间',
            icon: 'none',
          })
          return false
        }
      }
    }

    return true
  }

  const submitForm = async () => {
    if (isSubmitting.value) return

    if (!validateForm()) {
      return
    }

    isSubmitting.value = true
    uni.showLoading({ title: isEditMode.value ? '保存中...' : '发布中...' })

    try {
      const params: CreateItemParams = {
        title: form.value.title.trim(),
        description: form.value.description.trim(),
        category: categories[form.value.categoryIndex],
        images: form.value.images,
        price: form.value.transactionType === 'rent' ? parseFloat(form.value.price) : 0,
        deposit: form.value.transactionType === 'rent' ? parseFloat(form.value.deposit) : 0,
        transactionType: form.value.transactionType,
        salePrice: form.value.transactionType === 'sell' && form.value.salePrice 
          ? parseFloat(form.value.salePrice) 
          : null,
        isLongTermRent: form.value.transactionType === 'rent' ? form.value.isLongTermRent : false,
        location: form.value.location.trim() || undefined,
      }

      const { startDate, startTime, endDate, endTime } = form.value.availableTime
      if (form.value.transactionType === 'rent' && (startDate || startTime || endDate || endTime)) {
        params.availableTime = {
          start: (startDate && startTime) ? `${startDate} ${startTime}` : undefined,
          end: (!form.value.isLongTermRent && endDate && endTime) ? `${endDate} ${endTime}` : undefined,
        }
      }

      if (isEditMode.value && itemId.value) {
        // 编辑时保持原有状态：可租物品编辑后仍为可租，下架物品编辑后仍为下架
        const updateParams: any = { ...params }
        if (originalStatus.value === 'offline') {
          updateParams.status = 'offline'
        } else if (originalStatus.value === 'available') {
          updateParams.status = 'available'
        }
      
        await updateItem(itemId.value, updateParams, { showLoading: false })
        uni.hideLoading()
        uni.showToast({
          title: '保存成功',
          icon: 'success',
        })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } else {
        await createItem(params, { showLoading: false })
        uni.hideLoading()
        uni.showToast({
          title: '发布成功',
          icon: 'success',
        })
        setTimeout(() => {
          form.value = {
            title: '',
            categoryIndex: 0,
            description: '',
            price: '',
            deposit: '',
            transactionType: 'rent',
            salePrice: '',
            isLongTermRent: false,
            availableTime: {
              startDate: getCurrentDate(),
              startTime: getCurrentTime(),
              endDate: '',
              endTime: '',
            },
            location: '',
            images: [] as string[],
          }
        }, 1500)
      }
    } catch (error) {
      console.error(isEditMode.value ? '保存失败:' : '发布失败:', error)
      uni.hideLoading()
      uni.showToast({
        title: isEditMode.value ? '保存失败，请重试' : '发布失败，请重试',
        icon: 'none',
      })
    } finally {
      isSubmitting.value = false
    }
  }
</script>

<style scoped>
.container {
  padding: 16rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.publish-form {
  
  border-radius: 12rpx;
  padding: 24rpx;
}

.form-item {
  margin-bottom: 28rpx;
}

.tag-group {
  display: flex;
  gap: 20rpx;
}

.tag-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 16rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  background-color: #fafafa;
  transition: all 0.3s;
}

.tag-item.active {
  border-color: #007aff;
  background-color: #f0f7ff;
  color: #007aff;
  font-weight: 500;
}

.form-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14rpx;
}

.switch-section {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.switch-label {
  font-size: 26rpx;
  color: #495057;
}

.label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 14rpx;
  color: #1a1a1a;
}

.label.required::after {
  content: "*";
  color: #ff4d4f;
  margin-left: 6rpx;
}

.input {
  border: 2rpx solid #e8e8e8;
  border-radius: 10rpx;
  padding: 18rpx 22rpx;
  font-size: 28rpx;
  width: 100%;
  height: 92rpx;
  box-sizing: border-box;
  line-height: 56rpx;
  background-color: #fafafa;
  transition: border-color 0.3s;
}

.input:focus {
  border-color: #007aff;
  background-color: #ffffff;
}

.textarea {
  border: 2rpx solid #e8e8e8;
  border-radius: 10rpx;
  padding: 18rpx;
  font-size: 26rpx;
  width: 100%;
  box-sizing: border-box;
  height: 220rpx;
  resize: none;
  background-color: #fafafa;
  transition: border-color 0.3s;
}

.textarea:focus {
  border-color: #007aff;
  background-color: #ffffff;
}

.picker {
  border: 2rpx solid #e8e8e8;
  border-radius: 10rpx;
  padding: 18rpx;
  font-size: 26rpx;
  width: 100%;
  box-sizing: border-box;
  background-color: #fafafa;
}

.picker-text {
  color: #1a1a1a;
}

.time-picker-section {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  padding: 20rpx 0;
}

.time-picker-item {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  border: 1px solid #e9ecef;
}

.time-picker-label {
  font-size: 26rpx;
  color: #495057;
  font-weight: 500;
}

.datetime-picker-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.datetime-picker {
  flex: 1;
  border: 2rpx solid #e8e8e8;
  border-radius: 10rpx;
  padding: 16rpx 12rpx;
  font-size: 26rpx;
  text-align: center;
  background-color: #ffffff;
  transition: border-color 0.3s;
}

.datetime-picker:active {
  border-color: #007aff;
}

.date-picker {
  flex: 2;
}

.time-picker {
  flex: 1;
}

.display-time {
  font-size: 26rpx;
  color: #007aff;
  font-weight: 500;
  padding: 10rpx 0;
  background-color: rgba(0, 122, 255, 0.05);
  padding: 10rpx 14rpx;
  border-radius: 8rpx;
  margin-top: 6rpx;
}

.image-upload-area {
  width: 100%;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
}

.uploaded-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background-color: #f5f5f5;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.delete-btn {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  width: 44rpx;
  height: 44rpx;
  background-color: #ff4d4f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.3);
}

.delete-icon {
  color: #ffffff;
  font-size: 32rpx;
  line-height: 1;
}

.upload-btn {
  width: 200rpx;
  height: 200rpx;
  border: 2rpx dashed #d0d0d0;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  transition: all 0.3s;
}

.upload-btn:active {
  border-color: #007aff;
  background-color: #f0f7ff;
}

.upload-plus {
  font-size: 64rpx;
  color: #adb5bd;
  line-height: 1;
  transition: color 0.3s;
}

.upload-btn:active .upload-plus {
  color: #007aff;
}

.upload-hint {
  font-size: 24rpx;
  color: #adb5bd;
  margin-top: 8rpx;
}

.submit-button {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  background-color: #007aff;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 500;
  margin-top: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
  transition: all 0.3s;
}

.submit-button:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 6rpx rgba(0, 122, 255, 0.2);
}

.submit-button[disabled] {
  background-color: #ced4da;
  box-shadow: none;
  transform: none;
}
</style>
