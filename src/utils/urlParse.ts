export interface UrlParts {
  protocol: string
  host: string
  port: string
  path: string
  hash: string
  // 嵌套后的查询结构：值可能是字符串、数组、对象，或被展开的 JSON。
  query: Record<string, unknown>
  hasQuery: boolean
}

// 把 key 拆成路径段，支持方括号语法：
//   a        -> ['a']
//   a[b][c]  -> ['a', 'b', 'c']
//   a[]      -> ['a', '']（空段表示数组追加）
// 无法完整匹配方括号结构时，退回为整体单段，避免误解析。
function parseKeyPath(key: string): string[] {
  const open = key.indexOf('[')
  if (open === -1) return [key]

  const segs = [key.slice(0, open)]
  const rest = key.slice(open)
  const re = /\[([^\]]*)\]/g
  let m: RegExpExecArray | null
  let consumed = 0
  while ((m = re.exec(rest))) {
    segs.push(m[1])
    consumed = re.lastIndex
  }
  if (consumed !== rest.length) return [key]
  return segs
}

// 把一对 key/value 按路径写入嵌套容器；空段追加进数组，重名键合并为数组。
function insert(root: Record<string, unknown>, segments: string[], value: string) {
  let node: Record<string, unknown> | unknown[] = root

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const isLast = i === segments.length - 1

    if (seg === '') {
      const arr = node as unknown[]
      if (isLast) {
        arr.push(value)
      } else {
        const child: Record<string, unknown> = {}
        arr.push(child)
        node = child
      }
      continue
    }

    const obj = node as Record<string, unknown>
    if (isLast) {
      if (seg in obj) {
        const prev = obj[seg]
        if (Array.isArray(prev)) prev.push(value)
        else obj[seg] = [prev, value]
      } else {
        obj[seg] = value
      }
    } else {
      const nextIsPush = segments[i + 1] === ''
      if (!(seg in obj)) obj[seg] = nextIsPush ? [] : {}
      node = obj[seg] as Record<string, unknown> | unknown[]
    }
  }
}

// 递归把字符串叶子里的 JSON 对象/数组展开为子树；纯数字/布尔等标量保持原字符串。
function expandJson(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed && typeof parsed === 'object') return expandJson(parsed)
      } catch {
        // 不是合法 JSON，按普通字符串处理
      }
    }
    return value
  }
  if (Array.isArray(value)) return value.map(expandJson)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = expandJson(v)
    return out
  }
  return value
}

export function parseUrl(input: string): UrlParts | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }

  const query: Record<string, unknown> = {}
  let hasQuery = false
  for (const [key, value] of url.searchParams) {
    hasQuery = true
    insert(query, parseKeyPath(key), value)
  }

  return {
    protocol: url.protocol.replace(/:$/, ''),
    host: url.hostname,
    port: url.port,
    path: url.pathname,
    hash: url.hash.replace(/^#/, ''),
    query: expandJson(query) as Record<string, unknown>,
    hasQuery,
  }
}
