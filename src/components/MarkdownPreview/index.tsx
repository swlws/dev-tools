import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import MermaidBlock from '@/components/MermaidBlock'
import './index.css'

interface MarkdownPreviewProps {
  source: string
}

export default function MarkdownPreview({ source }: MarkdownPreviewProps) {
  return (
    <div className="markdown-preview">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        children={source}
        components={{
          code({ className, children, ...rest }) {
            const match = /language-mermaid/.exec(className || '')
            const codeText = String(children).replace(/\n$/, '')

            if (match) {
              return <MermaidBlock code={codeText} />
            }

            const isInline = !className
            if (isInline) {
              return (
                <code className="inline-code" {...rest}>
                  {children}
                </code>
              )
            }

            return (
              <pre className="code-block">
                <code className={className} {...rest}>
                  {children}
                </code>
              </pre>
            )
          },
          table({ children }) {
            return (
              <div className="table-wrapper">
                <table>{children}</table>
              </div>
            )
          },
        }}
      />
    </div>
  )
}