import { useState, useEffect, useRef, useCallback } from 'react'
import './index.css'
import { useSeo } from '@/hooks/useSeo'
import { TOOLS } from '@/tools'
import Button from '@/components/Button'
import ToggleGroup from '@/components/ToggleGroup'
import { downloadBlob } from '@/utils/export'

const TOOL = TOOLS.find((t) => t.path === '/image-merge')!

type Layout = 'vertical' | 'horizontal' | 'grid' | 'template'
// How the cross-axis size (width for vertical, height for horizontal, column
// width for grid) is unified across images so they line up flush.
type SizeMode = 'min' | 'max' | 'custom'

// A collage cell as a rectangle in normalized canvas coordinates (0..1).
type Cell = [x: number, y: number, w: number, h: number]

interface Template {
  id: string
  count: number
  label: string
  cells: Cell[]
}

// Preset collage templates on a square (1:1) canvas. Cells are normalized so
// the same table drives both the picker thumbnail and the draw pass.
const TEMPLATES: Template[] = [
  { id: '2-lr', count: 2, label: '左右', cells: [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]] },
  { id: '2-tb', count: 2, label: '上下', cells: [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]] },
  {
    id: '3-l1r2',
    count: 3,
    label: '左1右2',
    cells: [[0, 0, 0.5, 1], [0.5, 0, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
  },
  {
    id: '3-t1b2',
    count: 3,
    label: '上1下2',
    cells: [[0, 0, 1, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
  },
  {
    id: '3-v',
    count: 3,
    label: '竖三',
    cells: [[0, 0, 1 / 3, 1], [1 / 3, 0, 1 / 3, 1], [2 / 3, 0, 1 / 3, 1]],
  },
  {
    id: '3-h',
    count: 3,
    label: '横三',
    cells: [[0, 0, 1, 1 / 3], [0, 1 / 3, 1, 1 / 3], [0, 2 / 3, 1, 1 / 3]],
  },
  {
    id: '4-grid',
    count: 4,
    label: '田字',
    cells: [
      [0, 0, 0.5, 0.5],
      [0.5, 0, 0.5, 0.5],
      [0, 0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5, 0.5],
    ],
  },
  {
    id: '4-l1r3',
    count: 4,
    label: '左1右3',
    cells: [
      [0, 0, 0.5, 1],
      [0.5, 0, 0.5, 1 / 3],
      [0.5, 1 / 3, 0.5, 1 / 3],
      [0.5, 2 / 3, 0.5, 1 / 3],
    ],
  },
  {
    id: '4-v',
    count: 4,
    label: '竖四',
    cells: [[0, 0, 0.25, 1], [0.25, 0, 0.25, 1], [0.5, 0, 0.25, 1], [0.75, 0, 0.25, 1]],
  },
  {
    id: '4-h',
    count: 4,
    label: '横四',
    cells: [[0, 0, 1, 0.25], [0, 0.25, 1, 0.25], [0, 0.5, 1, 0.25], [0, 0.75, 1, 0.25]],
  },
]

interface LoadedImage {
  id: string
  url: string
  img: HTMLImageElement
  name: string
  w: number
  h: number
}

interface Options {
  layout: Layout
  gap: number
  padding: number
  bg: string
  transparent: boolean
  sizeMode: SizeMode
  customSize: number
  columns: number
  templateId: string
  canvasSize: number
}

function loadImage(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () =>
      resolve({
        id: `${file.name}-${file.size}-${img.naturalWidth}x${img.naturalHeight}-${Math.round(performance.now() * 1000)}`,
        url,
        img,
        name: file.name,
        w: img.naturalWidth,
        h: img.naturalHeight,
      })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`无法加载图片：${file.name}`))
    }
    img.src = url
  })
}

// Resolve the unified cross-axis dimension from the chosen mode.
function resolveTarget(sizes: number[], mode: SizeMode, custom: number): number {
  if (mode === 'custom') return Math.max(1, custom)
  if (mode === 'min') return Math.min(...sizes)
  return Math.max(...sizes)
}

interface Rendered {
  width: number
  height: number
}

// Per-image pan/zoom within a template cell. scale ≥ 1 on top of cover;
// ox/oy in [-1,1] slide the image across the clipped-off overflow.
interface Transform {
  scale: number
  ox: number
  oy: number
}

const DEFAULT_TRANSFORM: Transform = { scale: 1, ox: 0, oy: 0 }
const MIN_SCALE = 1
const MAX_SCALE = 5

interface CellRect {
  x: number
  y: number
  w: number
  h: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

// Pure layout+draw. Fills the background unless transparent, then paints every
// image according to the layout. Returns the canvas pixel dimensions.
function drawMerged(
  canvas: HTMLCanvasElement,
  images: LoadedImage[],
  opts: Options,
  forceBg?: string,
): Rendered | null {
  if (images.length === 0) return null
  const { layout, gap, padding, sizeMode, customSize, columns } = opts
  const bg = forceBg ?? (opts.transparent ? null : opts.bg)

  let width = 0
  let height = 0
  // Precompute placements as [x, y, w, h] to keep the draw loop trivial.
  const placements: [number, number, number, number][] = []

  if (layout === 'vertical') {
    const targetW = resolveTarget(images.map((i) => i.w), sizeMode, customSize)
    let y = padding
    for (const im of images) {
      const scaledH = (im.h * targetW) / im.w
      placements.push([padding, y, targetW, scaledH])
      y += scaledH + gap
    }
    width = targetW + padding * 2
    height = y - gap + padding
  } else if (layout === 'horizontal') {
    const targetH = resolveTarget(images.map((i) => i.h), sizeMode, customSize)
    let x = padding
    for (const im of images) {
      const scaledW = (im.w * targetH) / im.h
      placements.push([x, padding, scaledW, targetH])
      x += scaledW + gap
    }
    width = x - gap + padding
    height = targetH + padding * 2
  } else {
    const cols = Math.max(1, columns)
    const colW = resolveTarget(images.map((i) => i.w), sizeMode, customSize)
    const scaledHeights = images.map((im) => (im.h * colW) / im.w)
    const rowCount = Math.ceil(images.length / cols)
    const rowHeights: number[] = []
    for (let r = 0; r < rowCount; r++) {
      const slice = scaledHeights.slice(r * cols, r * cols + cols)
      rowHeights.push(Math.max(...slice))
    }
    let yBase = padding
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c
        if (idx >= images.length) break
        const x = padding + c * (colW + gap)
        placements.push([x, yBase, colW, scaledHeights[idx]])
      }
      yBase += rowHeights[r] + gap
    }
    width = cols * colW + (cols - 1) * gap + padding * 2
    height = yBase - gap + padding
  }

  canvas.width = Math.round(width)
  canvas.height = Math.round(height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (bg) {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  images.forEach((im, i) => {
    const [x, y, w, h] = placements[i]
    ctx.drawImage(im.img, x, y, w, h)
  })
  return { width: canvas.width, height: canvas.height }
}

// Draw an image into a target rect with object-fit: cover — scale to fill,
// center, and clip the overflow to the rect. A per-image transform (scale ≥ 1
// on top of cover, offset normalized to [-1,1] of the slack) lets the user
// pan and zoom within the cell.
function drawCover(
  ctx: CanvasRenderingContext2D,
  im: LoadedImage,
  x: number,
  y: number,
  w: number,
  h: number,
  tf: Transform = DEFAULT_TRANSFORM,
) {
  if (w <= 0 || h <= 0) return
  const base = Math.max(w / im.w, h / im.h)
  const eff = base * tf.scale
  const dw = im.w * eff
  const dh = im.h * eff
  const slackX = (dw - w) / 2
  const slackY = (dh - h) / 2
  const dx = x + (w - dw) / 2 + tf.ox * slackX
  const dy = y + (h - dh) / 2 + tf.oy * slackY
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(im.img, dx, dy, dw, dh)
  ctx.restore()
}

// Pixel rects of every template cell on the current canvas — shared by the
// draw pass and pointer hit-testing so they never drift apart.
function templateCellRects(template: Template, opts: Options): CellRect[] {
  const size = Math.max(1, Math.round(opts.canvasSize))
  const { padding, gap } = opts
  const inner = size - padding * 2
  return template.cells.map(([nx, ny, nw, nh]) => ({
    x: padding + nx * inner + gap / 2,
    y: padding + ny * inner + gap / 2,
    w: nw * inner - gap,
    h: nh * inner - gap,
  }))
}

// Render a collage template onto a square canvas.
function drawTemplate(
  canvas: HTMLCanvasElement,
  images: LoadedImage[],
  template: Template,
  opts: Options,
  transforms: Record<string, Transform>,
  forceBg?: string,
): Rendered | null {
  if (images.length === 0) return null
  const size = Math.max(1, Math.round(opts.canvasSize))
  const bg = forceBg ?? (opts.transparent ? null : opts.bg)

  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, size, size)
  if (bg) {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, size, size)
  }

  const rects = templateCellRects(template, opts)
  rects.forEach((r, i) => {
    const im = images[i]
    if (!im) return
    drawCover(ctx, im, r.x, r.y, r.w, r.h, transforms[im.id] ?? DEFAULT_TRANSFORM)
  })
  return { width: size, height: size }
}

// Dispatch to the right renderer for the active layout.
function render(
  canvas: HTMLCanvasElement,
  images: LoadedImage[],
  opts: Options,
  transforms: Record<string, Transform>,
  forceBg?: string,
): Rendered | null {
  if (opts.layout === 'template') {
    const tpl = TEMPLATES.find((t) => t.id === opts.templateId) ?? TEMPLATES[0]
    return drawTemplate(canvas, images, tpl, opts, transforms, forceBg)
  }
  return drawMerged(canvas, images, opts, forceBg)
}

export default function ImageMergePage() {
  useSeo(TOOL.name, TOOL.description)
  const [images, setImages] = useState<LoadedImage[]>([])
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [rendered, setRendered] = useState<Rendered | null>(null)
  const [transforms, setTransforms] = useState<Record<string, Transform>>({})
  const [opts, setOpts] = useState<Options>({
    layout: 'vertical',
    gap: 0,
    padding: 0,
    bg: '#ffffff',
    transparent: false,
    sizeMode: 'max',
    customSize: 800,
    columns: 3,
    templateId: '2-lr',
    canvasSize: 1080,
  })

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const imagesRef = useRef(images)
  imagesRef.current = images

  const set = <K extends keyof Options>(key: K, value: Options[K]) =>
    setOpts((o) => ({ ...o, [key]: value }))

  // Revoke every object URL on unmount to avoid leaks.
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((im) => URL.revokeObjectURL(im.url))
    }
  }, [])

  const addFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      if (files.length > 0) setError('请选择图片文件')
      return
    }
    setError('')
    try {
      const loaded = await Promise.all(imageFiles.map(loadImage))
      setImages((prev) => [...prev, ...loaded])
    } catch (e) {
      setError(e instanceof Error ? e.message : '图片加载失败')
    }
  }, [])

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((im) => im.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((im) => im.id !== id)
    })
    setTransforms((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setImages((prev) => {
      prev.forEach((im) => URL.revokeObjectURL(im.url))
      return []
    })
    setTransforms({})
  }, [])

  const reorder = useCallback((from: number, to: number) => {
    if (from === to) return
    setImages((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const files = Array.from(e.clipboardData.files)
      if (files.length) addFiles(files)
    },
    [addFiles],
  )

  // Redraw the preview whenever images or options change.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (images.length === 0) {
      setRendered(null)
      return
    }
    setRendered(render(canvas, images, opts, transforms))
  }, [images, opts, transforms])

  // Keep the selected template usable: if it needs more images than loaded,
  // fall back to the richest template the current image count supports.
  useEffect(() => {
    if (opts.layout !== 'template' || images.length === 0) return
    const active = TEMPLATES.find((t) => t.id === opts.templateId)
    if (active && images.length >= active.count) return
    const best = [...TEMPLATES].reverse().find((t) => images.length >= t.count)
    if (best && best.id !== opts.templateId) set('templateId', best.id)
  }, [opts.layout, opts.templateId, images.length])

  const download = useCallback(
    (format: 'png' | 'jpeg') => {
      if (images.length === 0) return
      const canvas = document.createElement('canvas')
      // JPEG has no alpha; force white behind transparent regions.
      const forceBg = format === 'jpeg' && opts.transparent ? '#ffffff' : undefined
      const res = render(canvas, images, opts, transforms, forceBg)
      if (!res) return
      const mime = format === 'png' ? 'image/png' : 'image/jpeg'
      const quality = format === 'jpeg' ? 0.92 : undefined
      canvas.toBlob(
        (blob) => {
          if (blob) downloadBlob(blob, `merged.${format === 'png' ? 'png' : 'jpg'}`)
        },
        mime,
        quality,
      )
    },
    [images, opts, transforms],
  )

  const activeTemplate =
    opts.layout === 'template'
      ? TEMPLATES.find((t) => t.id === opts.templateId) ?? TEMPLATES[0]
      : null

  // Convert a pointer event to canvas pixel coordinates (canvas is CSS-scaled
  // to fit the preview, so map through the rendered rect), then find the cell
  // under it and the image bound to that cell.
  const hitCell = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const canvas = canvasRef.current
      if (!canvas || !activeTemplate) return null
      const rect = canvas.getBoundingClientRect()
      const px = ((e.clientX - rect.left) / rect.width) * canvas.width
      const py = ((e.clientY - rect.top) / rect.height) * canvas.height
      const rects = templateCellRects(activeTemplate, opts)
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i]
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
          const im = images[i]
          if (im) return { im, rect: r, canvas }
        }
      }
      return null
    },
    [activeTemplate, opts, images],
  )

  const dragRef = useRef<{ id: string; startX: number; startY: number; ox: number; oy: number; rect: CellRect; canvasW: number } | null>(null)

  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!activeTemplate) return
      const hit = hitCell(e)
      if (!hit) return
      const tf = transforms[hit.im.id] ?? DEFAULT_TRANSFORM
      dragRef.current = {
        id: hit.im.id,
        startX: e.clientX,
        startY: e.clientY,
        ox: tf.ox,
        oy: tf.oy,
        rect: hit.rect,
        canvasW: hit.canvas.width,
      }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [activeTemplate, hitCell, transforms],
  )

  const onCanvasPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = dragRef.current
      const canvas = canvasRef.current
      if (!d || !canvas) return
      // Pointer delta in CSS px → canvas px → fraction of the cell's slack.
      const cssToCanvas = canvas.width / canvas.getBoundingClientRect().width
      const im = images.find((i) => i.id === d.id)
      if (!im) return
      const tf = transforms[d.id] ?? DEFAULT_TRANSFORM
      const base = Math.max(d.rect.w / im.w, d.rect.h / im.h)
      const dw = im.w * base * tf.scale
      const dh = im.h * base * tf.scale
      const slackX = (dw - d.rect.w) / 2
      const slackY = (dh - d.rect.h) / 2
      const dxCanvas = (e.clientX - d.startX) * cssToCanvas
      const dyCanvas = (e.clientY - d.startY) * cssToCanvas
      const nox = slackX > 0 ? clamp(d.ox + dxCanvas / slackX, -1, 1) : 0
      const noy = slackY > 0 ? clamp(d.oy + dyCanvas / slackY, -1, 1) : 0
      setTransforms((prev) => ({ ...prev, [d.id]: { ...(prev[d.id] ?? DEFAULT_TRANSFORM), ox: nox, oy: noy } }))
    },
    [images, transforms],
  )

  const endDrag = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current) {
      e.currentTarget.releasePointerCapture?.(e.pointerId)
      dragRef.current = null
    }
  }, [])

  // Native non-passive wheel listener so preventDefault can stop the preview
  // from scrolling while zooming a cell. (React's onWheel is passive.)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !activeTemplate) return
    const onWheel = (e: WheelEvent) => {
      const hit = hitCell(e)
      if (!hit) return
      e.preventDefault()
      setTransforms((prev) => {
        const cur = prev[hit.im.id] ?? DEFAULT_TRANSFORM
        const nextScale = clamp(cur.scale - Math.sign(e.deltaY) * 0.1, MIN_SCALE, MAX_SCALE)
        return { ...prev, [hit.im.id]: { scale: nextScale, ox: cur.ox, oy: cur.oy } }
      })
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [activeTemplate, hitCell])

  const onCanvasDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const hit = hitCell(e)
      if (!hit) return
      setTransforms((prev) => {
        if (!(hit.im.id in prev)) return prev
        const next = { ...prev }
        delete next[hit.im.id]
        return next
      })
    },
    [hitCell],
  )

  const disabled = images.length === 0
  const sizeLabel =
    opts.layout === 'horizontal' ? '高度' : opts.layout === 'grid' ? '列宽' : '宽度'

  return (
    <div className="page image-merge-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          <ToggleGroup
            value={opts.layout}
            onChange={(v) => set('layout', v)}
            options={[
              { value: 'vertical', label: '垂直' },
              { value: 'horizontal', label: '水平' },
              { value: 'grid', label: '宫格' },
              { value: 'template', label: '模板' },
            ]}
          />
          <Button onClick={() => download('png')} disabled={disabled}>
            导出 PNG
          </Button>
          <Button onClick={() => download('jpeg')} disabled={disabled}>
            导出 JPEG
          </Button>
        </div>
      </header>

      <div className="im-body">
        <section className="im-pane im-list-pane">
          <div className="pane-header">
            <span className="pane-label">图片（{images.length}）</span>
            {images.length > 0 && (
              <button type="button" className="im-clear" onClick={clearAll}>
                清空
              </button>
            )}
          </div>
          <div className="im-list">
            <div
              className={`im-drop ${dragOver ? 'im-drop-over' : ''}`}
              onClick={() => inputRef.current?.click()}
              onPaste={handlePaste}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                addFiles(Array.from(e.dataTransfer.files))
              }}
              tabIndex={0}
            >
              <p className="im-drop-hint">点击选择、拖拽或粘贴图片（可多选）</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="im-file-input"
                onChange={(e) => {
                  addFiles(Array.from(e.target.files ?? []))
                  e.target.value = ''
                }}
              />
            </div>

            {error && <span className="error-badge im-error">{error}</span>}

            <ul className="im-thumbs">
              {images.map((im, i) => (
                <li
                  key={im.id}
                  className={`im-thumb ${dragIndex === i ? 'im-thumb-dragging' : ''}`}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragEnd={() => setDragIndex(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null) reorder(dragIndex, i)
                    setDragIndex(null)
                  }}
                >
                  <span className="im-thumb-index">{i + 1}</span>
                  <img src={im.url} alt={im.name} className="im-thumb-img" />
                  <div className="im-thumb-meta">
                    <span className="im-thumb-name" title={im.name}>
                      {im.name}
                    </span>
                    <span className="im-thumb-size">
                      {im.w}×{im.h}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="im-thumb-remove"
                    aria-label="删除"
                    onClick={() => removeImage(im.id)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="im-pane im-preview-pane">
          <div className="pane-header">
            <span className="pane-label">预览</span>
            {rendered && (
              <span className="im-dims">
                {rendered.width}×{rendered.height}
              </span>
            )}
          </div>
          <div className="im-preview">
            {disabled ? (
              <p className="error-hint">添加图片后显示拼接预览</p>
            ) : (
              <canvas
                ref={canvasRef}
                className={`im-canvas ${opts.transparent ? 'im-canvas-alpha' : ''} ${
                  activeTemplate ? 'im-canvas-interactive' : ''
                }`}
                onPointerDown={activeTemplate ? onCanvasPointerDown : undefined}
                onPointerMove={activeTemplate ? onCanvasPointerMove : undefined}
                onPointerUp={activeTemplate ? endDrag : undefined}
                onPointerCancel={activeTemplate ? endDrag : undefined}
                onDoubleClick={activeTemplate ? onCanvasDoubleClick : undefined}
              />
            )}
          </div>
          {activeTemplate && (
            <p className="im-hint">拖动图片调整位置 · 滚轮缩放 · 双击复位</p>
          )}
          <div className="im-controls">
            {opts.layout === 'template' ? (
              <>
                <div className="im-field im-field-wide">
                  <span className="im-field-label">模板（按图片数）</span>
                  <div className="im-templates">
                    {TEMPLATES.map((t) => {
                      const usable = images.length >= t.count
                      return (
                        <button
                          key={t.id}
                          type="button"
                          className={`im-tpl ${opts.templateId === t.id ? 'active' : ''}`}
                          disabled={!usable}
                          title={`${t.count} 图 · ${t.label}`}
                          onClick={() => set('templateId', t.id)}
                        >
                          <span className="im-tpl-figure">
                            {t.cells.map((c, i) => (
                              <span
                                key={i}
                                className="im-tpl-cell"
                                style={{
                                  left: `${c[0] * 100}%`,
                                  top: `${c[1] * 100}%`,
                                  width: `${c[2] * 100}%`,
                                  height: `${c[3] * 100}%`,
                                }}
                              />
                            ))}
                          </span>
                          <span className="im-tpl-label">{t.count}图·{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <label className="im-field">
                  <span className="im-field-label">画布边长 px</span>
                  <input
                    type="number"
                    className="im-num"
                    min={1}
                    value={opts.canvasSize}
                    onChange={(e) => set('canvasSize', Math.max(1, Number(e.target.value) || 1))}
                  />
                </label>
              </>
            ) : (
              <>
                <label className="im-field">
                  <span className="im-field-label">{sizeLabel}对齐</span>
                  <ToggleGroup
                    value={opts.sizeMode}
                    onChange={(v) => set('sizeMode', v)}
                    options={[
                      { value: 'min', label: '最小' },
                      { value: 'max', label: '最大' },
                      { value: 'custom', label: '自定义' },
                    ]}
                  />
                </label>
                {opts.sizeMode === 'custom' && (
                  <label className="im-field">
                    <span className="im-field-label">{sizeLabel} px</span>
                    <input
                      type="number"
                      className="im-num"
                      min={1}
                      value={opts.customSize}
                      onChange={(e) => set('customSize', Number(e.target.value) || 1)}
                    />
                  </label>
                )}
                {opts.layout === 'grid' && (
                  <label className="im-field">
                    <span className="im-field-label">列数</span>
                    <input
                      type="number"
                      className="im-num"
                      min={1}
                      max={10}
                      value={opts.columns}
                      onChange={(e) =>
                        set('columns', Math.min(10, Math.max(1, Number(e.target.value) || 1)))
                      }
                    />
                  </label>
                )}
              </>
            )}
            <label className="im-field">
              <span className="im-field-label">间距 px</span>
              <input
                type="number"
                className="im-num"
                min={0}
                value={opts.gap}
                onChange={(e) => set('gap', Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
            <label className="im-field">
              <span className="im-field-label">边距 px</span>
              <input
                type="number"
                className="im-num"
                min={0}
                value={opts.padding}
                onChange={(e) => set('padding', Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
            <label className="im-field">
              <span className="im-field-label">背景</span>
              <div className="im-bg-control">
                <input
                  type="color"
                  className="im-color"
                  value={opts.bg}
                  disabled={opts.transparent}
                  onChange={(e) => set('bg', e.target.value)}
                />
                <label className="im-check">
                  <input
                    type="checkbox"
                    checked={opts.transparent}
                    onChange={(e) => set('transparent', e.target.checked)}
                  />
                  透明
                </label>
              </div>
            </label>
          </div>
        </section>
      </div>
    </div>
  )
}
