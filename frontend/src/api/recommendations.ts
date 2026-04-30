import { get } from '@/utils/request'
import type { Item } from './items'

export interface RecommendationResponse {
  items: Item[]
  type: string
}

export const getHotRecommendations = (params?: { limit?: number }): Promise<RecommendationResponse> => {
  return get<RecommendationResponse>('/recommendations/hot', params)
}
