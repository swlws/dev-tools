import { useState, useEffect, useRef, useCallback } from 'react'
import './index.css'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { useSeo } from '@/hooks/useSeo'
import { TOOLS } from '@/tools'
import CopyButton from '@/components/CopyButton'
import Button from '@/components/Button'
import ToggleGroup from '@/components/ToggleGroup'
import { useQrFavorites, type Favorite } from '@/hooks/useQrFavorites'
import { downloadUrl, downloadBlob } from '@/utils/export'

const TOOL = TOOLS.find((t) => t.path === '/qrcode')!

const DEFAULT_INPUT = 'https://swlws.github.io/tools/'

type Mode = 'generate' | 'decode'

// Decode a QR code from an image source using jsQR against an offscreen canvas.
function decodeImage(img: HTMLImageElement): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return jsQR(data.data, data.width, data.height)?.data ?? null
}

function DecodePanel() {
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setPreview(url)
      const decoded = decodeImage(img)
      if (decoded === null) {
        setResult('')
        setError('未识别到二维码')
      } else {
        setResult(decoded)
        setError('')
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setError('图片加载失败')
    }
    img.src = url
  }, [])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const file = Array.from(e.clipboardData.files)[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  return (
    <div className="qr-body">
      <section className="qr-pane qr-preview-pane">
        <div className="pane-header">
          <span className="pane-label">上传图片</span>
        </div>
        <div
          className={`qr-drop ${dragOver ? 'qr-drop-over' : ''}`}
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
            handleFile(Array.from(e.dataTransfer.files)[0])
          }}
          tabIndex={0}
        >
          {preview ? (
            <img src={preview} alt="预览" className="qr-drop-img" />
          ) : (
            <p className="qr-drop-hint">点击选择、拖拽或粘贴二维码图片</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="qr-file-input"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      </section>

      <section className="qr-pane">
        <div className="pane-header">
          <span className="pane-label">解析结果</span>
          {error && <span className="error-badge">{error}</span>}
        </div>
        <div className="qr-result">
          {result ? (
            <>
              <textarea className="qr-textarea" value={result} readOnly spellCheck={false} />
              <div className="qr-result-actions">
                <CopyButton text={result} />
              </div>
            </>
          ) : (
            <p className="error-hint">上传二维码图片后显示解析内容</p>
          )}
        </div>
      </section>
    </div>
  )
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function FavoriteList({
  favorites,
  onPick,
  onRemove,
}: {
  favorites: Favorite[]
  onPick: (fav: Favorite) => void
  onRemove: (id: string) => void
}) {
  if (favorites.length === 0) {
    return <p className="qr-fav-empty">暂无收藏</p>
  }
  return (
    <ul className="qr-fav-list">
      {favorites.map((fav) => (
        <li key={fav.id} className="qr-fav-item">
          <button type="button" className="qr-fav-main" onClick={() => onPick(fav)}>
            {fav.label && <span className="qr-fav-label">{fav.label}</span>}
            <span className="qr-fav-text">{fav.text}</span>
            <span className="qr-fav-time">{formatTime(fav.createdAt)}</span>
          </button>
          <button
            type="button"
            className="qr-fav-remove"
            aria-label="删除收藏"
            onClick={() => onRemove(fav.id)}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function QrCodePage() {
  useSeo(TOOL.name, TOOL.description)
  const [mode, setMode] = useState<Mode>('generate')

  // Generate mode state
  const [text, setText] = useState(DEFAULT_INPUT)
  const [error, setError] = useState('')
  const [label, setLabel] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const trimmed = text.trim()
  const { favorites, add, remove } = useQrFavorites()

  const openDialog = useCallback(() => {
    setLabel('')
    setDialogOpen(true)
  }, [])

  const confirmSave = useCallback(() => {
    if (trimmed === '' || error) return
    add(trimmed, label)
    setLabel('')
    setDialogOpen(false)
  }, [trimmed, error, label, add])

  const handlePick = useCallback((fav: Favorite) => {
    setText(fav.text)
  }, [])

  useEffect(() => {
    if (mode !== 'generate') return
    const canvas = canvasRef.current
    if (!canvas) return
    if (trimmed === '') {
      setError('')
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
      return
    }
    let cancelled = false
    QRCode.toCanvas(canvas, trimmed, { width: 280, margin: 2 })
      .then(() => {
        if (!cancelled) setError('')
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '生成失败')
      })
    return () => {
      cancelled = true
    }
  }, [trimmed, mode])

  const handleDownloadPng = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || trimmed === '' || error) return
    downloadUrl(canvas.toDataURL('image/png'), 'qrcode.png')
  }, [trimmed, error])

  const handleDownloadSvg = useCallback(async () => {
    if (trimmed === '') return
    try {
      const svg = await QRCode.toString(trimmed, { type: 'svg', margin: 2 })
      downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'qrcode.svg')
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
    }
  }, [trimmed])

  const downloadDisabled = trimmed === '' || error !== ''

  return (
    <div className="page qr-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          {mode === 'generate' && (
            <>
              <Button onClick={handleDownloadPng} disabled={downloadDisabled}>
                下载 PNG
              </Button>
              <Button onClick={handleDownloadSvg} disabled={downloadDisabled}>
                下载 SVG
              </Button>
            </>
          )}
          <ToggleGroup
            value={mode}
            onChange={setMode}
            options={[
              { value: 'generate', label: '生成' },
              { value: 'decode', label: '解析' },
            ]}
          />
        </div>
      </header>

      {mode === 'generate' ? (
        <div className="qr-body">
          <section className="qr-pane qr-fav-pane">
            <div className="pane-header">
              <span className="pane-label">收藏</span>
            </div>
            <FavoriteList favorites={favorites} onPick={handlePick} onRemove={remove} />
          </section>

          <section className="qr-pane qr-input-pane">
            <div className="pane-header">
              <span className="pane-label">输入内容</span>
              <div className="qr-fav-trigger">
                <button
                  type="button"
                  className="qr-fav-btn"
                  onClick={openDialog}
                  disabled={downloadDisabled}
                >
                  ☆ 收藏
                </button>
                {dialogOpen && (
                  <>
                    <div className="qr-dialog-mask" onClick={() => setDialogOpen(false)} />
                    <div className="qr-dialog" role="dialog">
                      <input
                        className="qr-fav-name"
                        value={label}
                        autoFocus
                        onChange={(e) => setLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmSave()
                          if (e.key === 'Escape') setDialogOpen(false)
                        }}
                        placeholder="备注名称（可选）"
                        spellCheck={false}
                      />
                      <div className="qr-dialog-actions">
                        <Button onClick={() => setDialogOpen(false)}>取消</Button>
                        <Button variant="primary" onClick={confirmSave}>
                          保存
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <textarea
              className="qr-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入文本或链接，实时生成二维码"
              spellCheck={false}
            />
          </section>

          <section className="qr-pane qr-preview-pane">
            <div className="pane-header">
              <span className="pane-label">二维码</span>
              {error && <span className="error-badge">{error}</span>}
            </div>
            <div className="qr-preview">
              {trimmed === '' ? (
                <p className="error-hint">输入内容后显示二维码</p>
              ) : (
                <canvas ref={canvasRef} className={error ? 'qr-canvas-hidden' : ''} />
              )}
            </div>
          </section>
        </div>
      ) : (
        <DecodePanel />
      )}
    </div>
  )
}
