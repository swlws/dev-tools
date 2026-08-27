import { useState, useCallback } from 'react'
import Button from '@/components/Button'

interface CopyButtonProps {
  text: string
  disabled?: boolean
}

export default function CopyButton({ text, disabled }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const handle = useCallback(async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }, [text])
  return (
    <Button onClick={handle} disabled={disabled}>
      {copied ? '已复制' : '复制'}
    </Button>
  )
}
