export const DEFAULT_CONTENT = `# 文档编辑器

支持 **Markdown** 语法和 Mermaid 图表渲染。

## 功能特性

- 实时 Markdown 预览
- Mermaid 图表渲染
- 导出 Mermaid 图为 SVG / PNG

## 示例：流程图

\`\`\`mermaid
graph TD
    A[开始] --> B{是否登录?}
    B -->|是| C[进入主页]
    B -->|否| D[跳转登录]
    D --> E[输入账号密码]
    E --> F{验证通过?}
    F -->|是| C
    F -->|否| G[提示错误]
    G --> E
\`\`\`

## 示例：时序图

\`\`\`mermaid
sequenceDiagram
    participant U as 用户
    participant S as 服务器
    participant D as 数据库
    U->>S: 发起请求
    S->>D: 查询数据
    D-->>S: 返回结果
    S-->>U: 响应数据
\`\`\`

## 示例：饼图

\`\`\`mermaid
pie title 技术栈占比
    "React" : 40
    "TypeScript" : 30
    "Vite" : 20
    "其他" : 10
\`\`\`

---

> 点击预览区域的 Mermaid 图表上方的导出按钮，可将图表导出为 SVG 或 PNG 文件。
`