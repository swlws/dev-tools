export type CategoryKey = 'edit' | 'convert' | 'compare' | 'generate'

export interface Category {
  key: CategoryKey
  label: string
}

// Display order for both the nav dropdowns and the homepage sections.
// Ordered by real-world usage frequency for developers, most-used first.
export const CATEGORIES: Category[] = [
  { key: 'convert', label: '格式转换' },
  { key: 'compare', label: '对比校验' },
  { key: 'generate', label: '生成工具' },
  { key: 'edit', label: '编辑预览' },
]

export interface Tool {
  path: string
  name: string
  navLabel: string
  description: string
  keywords: string[]
  icon: string
  category: CategoryKey
}

export const TOOLS: Tool[] = [
  {
    path: '/editor',
    name: 'Markdown + Mermaid 编辑器',
    navLabel: 'Markdown 编辑器',
    description: '实时预览 Markdown,支持 Mermaid 图表渲染与 SVG/PNG 导出。',
    keywords: ['markdown', 'mermaid', '编辑器', '预览', '图表', 'svg', 'png', '导出'],
    icon: '📝',
    category: 'edit',
  },
  {
    path: '/json',
    name: 'JSON 可视化工具',
    navLabel: 'JSON 工具',
    description: '格式化、压缩、树形查看 JSON,支持自动修复单引号、尾逗号、注释等非标准格式。',
    keywords: ['json', '格式化', '压缩', '树形', '可视化', '校验', '修复'],
    icon: '{ }',
    category: 'convert',
  },
  {
    path: '/diff',
    name: '文本对比',
    navLabel: '文本对比',
    description: '并排对比两段文本或代码,高亮显示差异。',
    keywords: ['diff', '对比', '比较', '文本', '代码', '差异'],
    icon: '⇄',
    category: 'compare',
  },
  {
    path: '/timestamp',
    name: '时间戳工具',
    navLabel: '时间戳工具',
    description: 'Unix 时间戳与日期互转、实时时间显示、时区切换、时间差计算。',
    keywords: ['时间戳', 'timestamp', 'unix', '日期', '时区', '时间差', '转换'],
    icon: '🕐',
    category: 'convert',
  },
  {
    path: '/qrcode',
    name: '二维码工具',
    navLabel: '二维码',
    description: '将文本或链接生成二维码并导出 PNG/SVG,也可上传图片解析二维码内容。',
    keywords: ['二维码', 'qrcode', 'qr', '生成', '解析', '解码', '识别', '链接', 'url', 'png', 'svg', '导出'],
    icon: '▦',
    category: 'generate',
  },
  {
    path: '/base64',
    name: 'Base64 编解码',
    navLabel: 'Base64',
    description: '文本与 Base64 互转,支持中文（UTF-8),也可将本地文件转为 Base64。',
    keywords: ['base64', '编码', '解码', 'encode', 'decode', '转换', 'utf-8', '文件', 'dataurl'],
    icon: '⇄',
    category: 'convert',
  },
  {
    path: '/url',
    name: 'URL 编解码',
    navLabel: 'URL 编解码',
    description: '对 URL 或查询参数进行编码与解码,支持中文等特殊字符。',
    keywords: ['url', '编码', '解码', 'encode', 'decode', 'uri', 'encodeuricomponent', '转义', '转换'],
    icon: '%',
    category: 'convert',
  },
  {
    path: '/jwt',
    name: 'JWT 解析',
    navLabel: 'JWT 解析',
    description: '解析 JWT 的 Header 与 Payload,展示过期时间等字段,纯本地不校验签名。',
    keywords: ['jwt', 'token', '解析', '解码', 'json web token', 'header', 'payload', '登录', '鉴权'],
    icon: '🔑',
    category: 'convert',
  },
  {
    path: '/hash',
    name: '哈希生成',
    navLabel: '哈希生成',
    description: '对文本生成 SHA-1/256/384/512 哈希,全部在浏览器本地计算。',
    keywords: ['hash', '哈希', '摘要', 'sha', 'sha256', 'sha1', 'sha512', '签名', '校验', '生成'],
    icon: '#',
    category: 'generate',
  },
  {
    path: '/uuid',
    name: 'UUID 生成',
    navLabel: 'UUID 生成',
    description: '批量生成 UUID v4,支持大写与去连字符,一键复制。',
    keywords: ['uuid', 'guid', '唯一标识', '生成', 'v4', 'random', '批量', 'id'],
    icon: '🆔',
    category: 'generate',
  },
  {
    path: '/color',
    name: '颜色转换',
    navLabel: '颜色转换',
    description: 'HEX / RGB / HSL 颜色格式互转,带取色器与实时预览。',
    keywords: ['颜色', 'color', 'hex', 'rgb', 'hsl', '转换', '取色', '调色', '色值'],
    icon: '🎨',
    category: 'convert',
  },
  {
    path: '/regex',
    name: '正则表达式测试',
    navLabel: '正则测试',
    description: '实时测试正则表达式,高亮匹配、展示分组与替换预览,支持常用 flags。',
    keywords: ['正则', 'regex', 'regexp', '正则表达式', '匹配', '测试', '分组', '替换', 'flags'],
    icon: '.*',
    category: 'compare',
  },
  {
    path: '/radix',
    name: '进制转换',
    navLabel: '进制转换',
    description: '二进制/八进制/十进制/十六进制实时互转,支持 2-36 任意进制与大整数。',
    keywords: ['进制', '进制转换', 'radix', '二进制', '八进制', '十进制', '十六进制', 'binary', 'hex', 'octal', 'decimal', 'base', '转换'],
    icon: '01',
    category: 'convert',
  },
  {
    path: '/cron',
    name: 'Cron 表达式解析',
    navLabel: 'Cron 解析',
    description: '解析 cron 表达式,生成中文可读描述并预测未来执行时间,支持 5/6 段格式。',
    keywords: ['cron', 'crontab', '定时', '定时任务', '表达式', '解析', '调度', 'schedule', '执行时间'],
    icon: '⏲',
    category: 'convert',
  },
  {
    path: '/yaml',
    name: 'YAML ↔ JSON 转换',
    navLabel: 'YAML/JSON',
    description: 'YAML 与 JSON 双向互转,实时转换并提示语法错误,纯本地运行。',
    keywords: ['yaml', 'json', 'yml', '转换', '互转', 'convert', '格式化', '配置'],
    icon: '⇄',
    category: 'convert',
  },
  {
    path: '/image-merge',
    name: '图片拼接',
    navLabel: '图片拼接',
    description: '多张图片垂直、水平或宫格拼接为一张长图,可调间距、边距、背景,导出 PNG/JPEG,纯本地处理。',
    keywords: ['图片', '拼接', '拼图', '长图', '合并', 'merge', '截图', '宫格', '九宫格', '垂直', '水平', 'png', 'jpeg', '导出'],
    icon: '🖼',
    category: 'generate',
  },
]

export interface ToolGroup extends Category {
  tools: Tool[]
}

// Tools grouped by category, in CATEGORIES order, skipping empty groups.
export function groupedTools(tools: Tool[] = TOOLS): ToolGroup[] {
  return CATEGORIES.map((cat) => ({
    ...cat,
    tools: tools.filter((t) => t.category === cat.key),
  })).filter((g) => g.tools.length > 0)
}
