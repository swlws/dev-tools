# 开发者工具箱

常用的前端与开发辅助工具集合,无需登录、纯本地运行(数据不离开浏览器)。

在线访问:<https://swlws.github.io/dev-tools/>

## 功能

| 工具 | 说明 |
| --- | --- |
| Markdown + Mermaid 编辑器 | 实时预览 Markdown,支持 Mermaid 图表渲染与 SVG / PNG 导出 |
| JSON 可视化工具 | 格式化、压缩、树形查看,自动修复单引号、尾逗号、注释等非标准格式 |
| 文本对比 | 基于 Monaco 的并排 Diff,高亮显示两段文本 / 代码的差异 |
| 时间戳工具 | Unix 时间戳与日期互转、实时时间显示、时区切换、时间差计算 |
| 二维码工具 | 文本/链接生成二维码并导出 PNG/SVG,支持上传图片解析二维码内容 |
| Base64 编解码 | 文本与 Base64 互转(UTF-8),支持将本地文件转为 Base64 |
| URL 编解码 | URL / 查询参数编码与解码,支持中文等特殊字符 |
| JWT 解析 | 解析 JWT 的 Header 与 Payload,展示过期时间,纯本地不校验签名 |
| 哈希生成 | 对文本生成 SHA-1/256/384/512 哈希,浏览器本地计算 |
| UUID 生成 | 批量生成 UUID v4,支持大写与去连字符 |
| 颜色转换 | HEX / RGB / HSL 互转,带取色器与实时预览 |
| 正则表达式测试 | 实时测试正则,高亮匹配、展示分组与替换预览,支持常用 flags |
| 进制转换 | 二进制 / 八进制 / 十进制 / 十六进制实时互转,支持 2-36 任意进制与大整数 |
| Cron 表达式解析 | 解析 cron 表达式,生成中文可读描述并预测未来执行时间,支持 5/6 段格式 |
| YAML ↔ JSON 转换 | YAML 与 JSON 双向互转,实时转换并提示语法错误,纯本地运行 |
| 图片拼接 | 多张图片垂直 / 水平 / 宫格拼接为一张图,可调间距、边距、背景,导出 PNG / JPEG |

## 技术栈

- React 19 + TypeScript
- Vite 6 构建
- react-router-dom(HashRouter)
- Monaco Editor(文本对比)、Mermaid(图表)、react-markdown

## 本地开发

```bash
npm install
npm run dev      # 启动开发服务器
```

## 常用脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 类型检查并打包到 `dist/` |
| `npm run preview` | 本地预览打包产物 |
| `npm run lint` | 运行 ESLint |

## 部署

推送到 `master` 分支后,GitHub Actions 会自动构建并发布到 GitHub Pages(工作流见 `.github/workflows/deploy.yml`)。

首次部署需在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。

> 站点作为项目页发布在 `/dev-tools/` 路径下,对应 `vite.config.ts` 中的 `base: '/dev-tools/'`。
