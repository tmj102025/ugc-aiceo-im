// Image template id → paired video template id
// Ported from Flow Unlocked extension (promptTemplateSelector.IMAGE_TO_VIDEO_MAP)
export const IMAGE_TO_VIDEO_MAP: Record<string, string> = {
  'ugc-review': 'video-ugc',
  'ugc-review-global': 'video-ugc-global',
  'ugc-warehouse': 'video-ugc-warehouse',
  'ugc-factory': 'video-ugc-factory',
  'ugc-live': 'video-ugc-live',
  'ugc-mall': 'video-ugc-mall',
  'ugc-market': 'video-ugc-market',
  'ugc-hand': 'video-ugc-hand',
  'ugc-random': 'video-ugc-random',
  'ugc-using': 'video-ugc-using',
  'ugc-feeling': 'video-ugc-feeling',
  'ugc-compare': 'video-ugc-compare',
  'ugc-closeup': 'video-ugc-closeup',
  'ugc-recommend': 'video-ugc-recommend',
  'professional-ad': 'video-professional',
  'product-only': 'video-product-only',
  'lifestyle': 'video-lifestyle',
  'social-viral': 'video-social-viral',
  'pixar-3d-review': 'video-pixar-3d-review',
  'pixar-3d-person': 'video-pixar-3d-person',
  'pixar-3d-fruit': 'video-pixar-3d-fruit',
  'pixar-3d-animal': 'video-pixar-3d-animal',
  'pixar-3d-object': 'video-pixar-3d-object',
  'pixar-3d-car': 'video-pixar-3d-car',
  'funny-short-clip': 'video-funny-short-clip',
};

export function pairedVideoFor(imageTemplateId: string): string {
  return IMAGE_TO_VIDEO_MAP[imageTemplateId] ?? 'video-ugc';
}
