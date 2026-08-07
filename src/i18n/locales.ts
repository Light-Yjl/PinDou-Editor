export type Locale = 'en' | 'zh'

export const LOCALE_STORAGE_KEY = 'pindou-studio-locale'

const presetTexts = {
  en: {
    default: { name: 'Default', desc: 'Balanced detail and difficulty' },
    mini: { name: 'Mini Charm', desc: 'Keychains and small badges' },
    standard: { name: 'Standard', desc: 'Desk ornaments and decor' },
    large: { name: 'Large Art', desc: 'Bigger pieces, more detail' },
    fine: { name: 'Fine Detail', desc: 'Maximum colors and fidelity' },
    simple: { name: 'Simple', desc: 'Fewer colors, beginner-friendly' },
    tiny: { name: 'Tiny', desc: 'Very small, fast to make' },
  },
  zh: {
    default: { name: '默认', desc: '日常通用，细节与难度均衡' },
    mini: { name: '迷你挂件', desc: '小尺寸钥匙扣、徽章' },
    standard: { name: '标准摆件', desc: '适合桌面摆件、小装饰画' },
    large: { name: '大型画', desc: '大幅作品，细节更丰富' },
    fine: { name: '精细还原', desc: '尽量还原原图，颜色与细节最多' },
    simple: { name: '简约少色', desc: '颜色少、制作快，适合新手' },
    tiny: { name: '超小', desc: '非常小，制作快速' },
  },
} as const

const colorNames = {
  en: {
    '01': 'White',
    '02': 'Black',
    '03': 'Light Gray',
    '04': 'Gray',
    '05': 'Dark Gray',
    '06': 'Light Skin',
    '07': 'Skin',
    '08': 'Dark Skin',
    '09': 'Red',
    '10': 'Dark Red',
    '11': 'Rose',
    '12': 'Pink',
    '13': 'Light Pink',
    '14': 'Orange',
    '15': 'Light Orange',
    '16': 'Yellow',
    '17': 'Light Yellow',
    '18': 'Lemon',
    '19': 'Green',
    '20': 'Light Green',
    '21': 'Dark Green',
    '22': 'Forest',
    '23': 'Cyan',
    '24': 'Sky Blue',
    '25': 'Blue',
    '26': 'Dark Blue',
    '27': 'Navy',
    '28': 'Purple',
    '29': 'Light Purple',
    '30': 'Dark Purple',
    '31': 'Brown',
    '32': 'Light Brown',
    '33': 'Dark Brown',
    '34': 'Beige',
    '35': 'Cream',
    '36': 'Coral',
    '37': 'Peach',
    '38': 'Wine',
    '39': 'Olive',
    '40': 'Teal',
    '41': 'Navy Blue',
    '42': 'Indigo',
    '43': 'Lavender',
    '44': 'Gold',
    '45': 'Silver',
  },
  zh: {
    '01': '白色',
    '02': '黑色',
    '03': '浅灰',
    '04': '中灰',
    '05': '深灰',
    '06': '肤色浅',
    '07': '肤色',
    '08': '肤色深',
    '09': '红色',
    '10': '深红',
    '11': '玫红',
    '12': '粉色',
    '13': '浅粉',
    '14': '橙色',
    '15': '浅橙',
    '16': '黄色',
    '17': '浅黄',
    '18': '柠檬黄',
    '19': '绿色',
    '20': '浅绿',
    '21': '深绿',
    '22': '墨绿',
    '23': '青色',
    '24': '天蓝',
    '25': '蓝色',
    '26': '深蓝',
    '27': '藏青',
    '28': '紫色',
    '29': '浅紫',
    '30': '深紫',
    '31': '棕色',
    '32': '浅棕',
    '33': '深棕',
    '34': '米色',
    '35': '奶油色',
    '36': '珊瑚色',
    '37': '桃色',
    '38': '酒红',
    '39': '橄榄绿',
    '40': '蓝绿',
    '41': '海军蓝',
    '42': '靛蓝',
    '43': '薰衣草',
    '44': '金色',
    '45': '银色',
  },
} as const

function buildMessages(locale: Locale) {
  const p = presetTexts[locale]
  return {
    app: {
      title: locale === 'en' ? 'PinDou Studio' : 'PinDou Studio 拼豆工坊',
      subtitle:
        locale === 'en'
          ? 'Upload → Smart params → Optional cutout → Generate pattern'
          : '上传图片 → 智能参数 → 可选抠图 → 一键生成图纸',
    },
    lang: {
      label: locale === 'en' ? 'Language' : '语言',
      en: 'English',
      zh: '中文',
    },
    upload: {
      title: locale === 'en' ? 'Click or drag to upload' : '点击或拖拽上传图片',
      hint: locale === 'en' ? 'JPG, PNG, WebP and more' : '支持 JPG、PNG、WebP 等常见格式',
      preview: locale === 'en' ? 'Original' : '原图预览',
      reupload: locale === 'en' ? 'Re-upload' : '重新上传',
      bgRemoved: locale === 'en' ? 'Background removed' : '已抠图完成',
    },
    controls: {
      title: locale === 'en' ? 'Settings' : '生成设置',
      autoDetect: locale === 'en' ? 'Auto-detect params' : '自动识别参数',
      autoDetectHint:
        locale === 'en'
          ? 'Recommend and lock params based on image'
          : '开启后根据图片自动推荐并锁定下方参数',
      detected: locale === 'en' ? 'Detected: recommend' : '已识别：推荐',
      applied: locale === 'en' ? '(applied)' : '（已应用）',
      autoCutout: locale === 'en' ? 'AI background removal' : '自动抠图',
      autoCutoutHint:
        locale === 'en'
          ? 'Independent toggle, not tied to param detection'
          : '独立开关，不受参数识别影响',
      autoCutoutLocked:
        locale === 'en'
          ? 'Download AI models below to enable'
          : '请先在下方下载 AI 模型',
      downloadModels: locale === 'en' ? 'Download AI models' : '下载 AI 模型',
      downloadModelsHint:
        locale === 'en'
          ? '~330 MB, one-time · skip if you do not need cutout'
          : '约 330 MB，仅需一次 · 不用抠图可跳过',
      downloadModelsDone: locale === 'en' ? 'AI models ready' : 'AI 模型已就绪',
      downloadModelsDownloading:
        locale === 'en' ? 'Downloading AI models...' : '正在下载 AI 模型...',
      downloadModelsDesktopOnly:
        locale === 'en'
          ? 'Run start.bat (desktop app) to download models'
          : '请双击 start.bat 在桌面版中下载',
      presets: locale === 'en' ? 'Presets' : '推荐参数',
      paramsLocked:
        locale === 'en'
          ? 'Params locked (disable auto-detect to edit manually)'
          : '参数已锁定（关闭「自动识别参数」后可手动调整）',
      gridWidth: locale === 'en' ? 'Grid width (cells)' : '图纸宽度（格）',
      maxColors: locale === 'en' ? 'Max colors' : '最大颜色数',
      gridUnit: locale === 'en' ? 'cells' : '格',
      colorUnit: locale === 'en' ? 'colors' : '色',
      presetSize: (w: number, c: number) =>
        locale === 'en' ? `${w} cells · ${c} colors` : `${w} 格 · ${c} 色`,
      manualAdjust: locale === 'en' ? 'Manually adjusted' : '已手动调整参数',
      showGrid: locale === 'en' ? 'Show grid lines' : '显示网格线',
      showCodes: locale === 'en' ? 'Show color codes' : '显示色号',
      generate: locale === 'en' ? 'Generate Pattern' : '一键生成拼豆图纸',
      processing: locale === 'en' ? 'Processing...' : '处理中...',
      // 新增颜色选择器文本
      colorPalette: locale === 'en' ? 'All Colors' : '全部色盘',
      colors: locale === 'en' ? 'colors' : '种颜色',
      searchColor: locale === 'en' ? 'Search color (name/code/hex)...' : '搜索颜色 (名称/编号/色值)...',
      showAll: locale === 'en' ? 'Show all colors' : '显示全部颜色',
      showLess: locale === 'en' ? 'Show less' : '收起',
      more: locale === 'en' ? 'more' : '更多',
      selected: locale === 'en' ? 'Selected' : '已选中',
    },
    presets: p,
    processing: {
      analyzing: locale === 'en' ? 'Analyzing image...' : '正在分析图片...',
      removingBg: locale === 'en' ? 'Removing background...' : '正在 AI 抠图...',
      generating: locale === 'en' ? 'Generating pattern...' : '正在生成拼豆图纸...',
      modelDownload: locale === 'en' ? 'Loading AI models...' : '正在加载 AI 模型...',
    },
    errors: {
      generateFailed: locale === 'en' ? 'Generation failed.' : '生成失败。',
      generateFailedHint:
        locale === 'en'
          ? 'Disable AI cutout to retry without models.'
          : '可关闭「自动抠图」后重试。',
      modelsDownloadFailed:
        locale === 'en' ? 'AI model download failed. Check network and retry.'
          : 'AI 模型下载失败，请检查网络后重试。',
      modelsNotReady:
        locale === 'en' ? 'AI models not ready. Download models in Settings first.'
          : 'AI 模型未就绪，请先在设置中下载。',
    },
    empty: {
      ready:
        locale === 'en'
          ? 'Params ready — click Generate Pattern'
          : '参数已就绪，点击「一键生成拼豆图纸」',
    },
    guide: {
      title: locale === 'en' ? 'How to use' : '使用说明',
      steps: [
        locale === 'en'
          ? 'Upload an image; enable auto-detect for smart presets'
          : '上传图片，可开启「自动识别参数」自动推荐档位',
        locale === 'en'
          ? 'Disable auto-detect to pick presets or adjust sliders'
          : '关闭自动识别后可手动选择推荐参数或调整滑块',
        locale === 'en'
          ? 'Download AI models in Settings if you need cutout (optional)'
          : '需要抠图时，在设置中点击「下载 AI 模型」（可选）',
        locale === 'en'
          ? 'Toggle AI cutout after models are ready, then generate'
          : '模型就绪后可开启「自动抠图」，点击生成图纸',
        locale === 'en'
          ? 'View color stats below and download HD PNG'
          : '查看下方色号统计，下载高清 PNG',
      ],
    },
    pattern: {
      title: locale === 'en' ? 'Pattern' : '拼豆图纸',
      size: (w: number, h: number) =>
        locale === 'en' ? `${w} × ${h} cells` : `${w} × ${h} 格`,
      download: locale === 'en' ? 'Download HD PNG' : '下载高清 PNG',
      doubleClick: locale === 'en' ? 'Double-click to zoom' : '双击放大查看',
      doubleClickHint: locale === 'en' ? 'Double-click to zoom' : '双击放大',
      legend: locale === 'en' ? 'Color Stats' : '色号统计',
      legendSummary: (kinds: number, total: number) =>
        locale === 'en'
          ? `${kinds} colors · ${total} beads total`
          : `${kinds} 种 · 共 ${total} 颗`,
      beadUnit: locale === 'en' ? 'beads' : '颗',
      filename: (w: number, h: number) =>
        locale === 'en' ? `pattern_${w}x${h}.png` : `拼豆图纸_${w}x${h}.png`,
    },
    lightbox: {
      title: locale === 'en' ? 'Full Pattern' : '图纸大图',
      hint: (w: number, h: number) =>
        locale === 'en'
          ? `${w} × ${h} cells · Press Esc or click outside to close`
          : `${w} × ${h} 格 · 按 Esc 或点击背景关闭`,
      close: locale === 'en' ? 'Close' : '关闭',
    },
    analysis: {
      imageSize: (w: number, h: number) =>
        locale === 'en' ? `Image ${w}×${h}` : `图片 ${w}×${h}`,
      colorEstimate: (n: number) =>
        locale === 'en' ? `~${n} colors detected` : `约 ${n} 种色彩`,
      simpleBg: locale === 'en' ? 'Simple background — cutout recommended' : '背景较简单，可开抠图',
    },
    colorNames: colorNames[locale],
  }
}

export const messages = {
  en: buildMessages('en'),
  zh: buildMessages('zh'),
} as const

export type Messages = (typeof messages)['en']

export function detectDefaultLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
  if (stored === 'en' || stored === 'zh') return stored
  const lang = navigator.language.toLowerCase()
  return lang.startsWith('zh') ? 'zh' : 'en'
}

export function formatAnalysisReason(
  locale: Locale,
  data: {
    imageWidth: number
    imageHeight: number
    estimatedColors: number
    hasSimpleBackground: boolean
  },
): string {
  const m = messages[locale].analysis
  const parts = [
    m.imageSize(data.imageWidth, data.imageHeight),
    m.colorEstimate(data.estimatedColors),
  ]
  if (data.hasSimpleBackground) parts.push(m.simpleBg)
  return parts.join(' · ')
}

export function getPresetName(locale: Locale, id: string): string {
  const presets = messages[locale].presets as Record<string, { name: string }>
  return presets[id]?.name ?? id
}

export function getPresetDesc(locale: Locale, id: string): string {
  const presets = messages[locale].presets as Record<string, { desc: string }>
  return presets[id]?.desc ?? ''
}

export function getColorName(locale: Locale, id: string, fallback: string): string {
  const names = messages[locale].colorNames as Record<string, string>
  return names[id] ?? fallback
}