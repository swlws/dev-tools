import { useEffect } from 'react'
import './index.css'

const SCRIPT_SRC = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'

// 不蒜子加载时发一次 JSONP，回调按固定 id 回填数字。SPA 下需保证 span 先在 DOM，
// 且每次挂载重新注入脚本，二次进首页才会重新拉取。
export default function BusuanziStats() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    document.body.appendChild(script)
    return () => {
      script.remove()
    }
  }, [])

  return (
    <p className="busuanzi-stats">
      本站访问量 <span id="busuanzi_value_site_pv">…</span> 次 · 访客{' '}
      <span id="busuanzi_value_site_uv">…</span> 人
    </p>
  )
}
