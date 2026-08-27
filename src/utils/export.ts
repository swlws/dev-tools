export function exportSvg(svgString: string, filename: string) {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, `${filename}.svg`)
}

export async function exportPng(svgString: string, filename: string, scale = 2) {
  const { svg: fixedSvg, width, height } = normalizeSvgSize(svgString)
  const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(fixedSvg)))}`

  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = dataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D 上下文不可用')
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('PNG 导出失败'))
    }, 'image/png')
  })

  downloadBlob(blob, `${filename}.png`)
}

/** 解析 SVG 尺寸并强制设置像素宽高，确保 data URL 加载后尺寸正确 */
function normalizeSvgSize(svgRaw: string): { svg: string; width: number; height: number } {
  let svg = ensureXmlns(svgRaw)

  // 尝试从 viewBox 获取尺寸
  const viewBoxMatch = svg.match(/viewBox\s*=\s*"([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)"/)
  // 尝试从 width/height 属性获取像素值
  const widthMatch = svg.match(/<svg[^>]*\bwidth\s*=\s*"([\d.]+)"/)
  const heightMatch = svg.match(/<svg[^>]*\bheight\s*=\s*"([\d.]+)"/)

  let width: number
  let height: number

  if (viewBoxMatch) {
    // viewBox="x y w h" → 取 w, h
    width = parseFloat(viewBoxMatch[3])
    height = parseFloat(viewBoxMatch[4])
  } else if (widthMatch && heightMatch) {
    width = parseFloat(widthMatch[1])
    height = parseFloat(heightMatch[1])
  } else {
    // 兜底默认值
    width = 800
    height = 600
  }

  // 确保尺寸有效
  if (!isFinite(width) || width <= 0) width = 800
  if (!isFinite(height) || height <= 0) height = 600

  // 移除旧的 width/height 属性，替换为像素值
  svg = svg.replace(/<svg([^>]*)/, (_, attrs: string) => {
    let a = attrs.replace(/\bwidth\s*=\s*"[^"]*"/, '')
    a = a.replace(/\bheight\s*=\s*"[^"]*"/, '')
    return `<svg${a} width="${width}" height="${height}"`
  })

  return { svg, width, height }
}

function ensureXmlns(svg: string): string {
  if (/<svg[^>]*xmlns\s*=/i.test(svg)) return svg
  return svg.replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
}

/** 触发浏览器下载：给定任意 href（data URL、blob URL、http…）与文件名 */
export function downloadUrl(href: string, name: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = name
  a.click()
}

/** 下载一个 Blob，自动创建并回收 object URL */
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  downloadUrl(url, name)
  URL.revokeObjectURL(url)
}