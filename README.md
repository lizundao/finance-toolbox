# 财务工具箱

基于 Tauri 2 的离线财务小工具桌面应用，由 [墨点 inkdot](https://inkdot.cn) 免费提供。

面向会计、出纳、财务人员：人民币大写、价税分离、日期利息等日常计算，输入即得结果，一键复制。

## 文档

| 文档 | 说明 |
|------|------|
| [功能全景](docs/功能全景.md) | 全部规划功能清单与模块划分 |
| [开发计划](docs/开发计划.md) | 分阶段路线图与验收标准 |
| [用户手册](docs/用户手册.md) | 安装与使用说明（随版本更新） |
| [发布说明](docs/发布说明.md) | v0.1.0 下载、安装与功能一览 |
| [品牌与视觉](docs/品牌与视觉.md) | Logo、配色与界面视觉规范 |
| [产品原则](PRINCIPLES.md) | 免费 · 离线 · 安全 · 方便 · 绿色 |

## 产品原则

| | |
|---|---|
| **免费** | 免费使用，无内购、无订阅 |
| **离线** | 本地运行，断网也能用 |
| **安全** | 数据不出设备，不收集、不上传 |
| **方便** | 即装即用，轻巧顺手 |
| **绿色** | 无广告、无捆绑、无后台骚扰 |

## 当前状态

**v0.1.0** — 规划内功能与发布打包已全部完成。

已上线：人民币大写、大写反查、支票日期、金额格式化、价税分离、日期差/账期/利息、月历与节假日、贷款试算、直线折旧、比例分摊、工资个税、身份证/银行卡校验。

发布打包见 [发布说明](docs/发布说明.md)；远期扩展见 [开发计划](docs/开发计划.md)。

## 技术栈

- **前端**：原生 JS 模块化 + Vite 6，侧边栏 Shell 布局
- **后端**：Rust + Tauri 2（薄后端，多数工具纯前端）
- **数据**：本地 JSON 配置（税率、节假日、个税表）

## 开发

```bash
npm install
npm run tauri dev
```

```bash
npm run release            # 编译 NSIS 安装包 + exe
npm run release:portable   # 上述 + 整理 release/ 目录与便携 zip
```

本地发布产物位于 `release/`，统一使用 ASCII 命名：

| 路径 | 说明 |
|------|------|
| `release/FinanceToolbox-0.1.0-setup-win-x64.exe` | Windows 安装版 |
| `release/FinanceToolbox-0.1.0-portable-win-x64.zip` | Windows 绿色便携版（含文档与 LICENSE） |

macOS（`FinanceToolbox-0.1.0-aarch64.dmg` / `-aarch64.app.zip`）由 GitHub Actions 构建：手动触发工作流，或推送 `v*` tag 自动构建并生成草稿 Release。详见 [发布说明](docs/发布说明.md)。

## 项目结构（规划）

```
finance/
├── public/logo.svg          # 应用 Logo（计算器网格，珊瑚红）
├── public/inkdot.png        # 网站品牌 Logo（关于页墨点展示）
├── index.html               # 应用壳（侧边栏 + 多视图）
├── css/app.css              # 全局样式与设计 token
├── js/
│   ├── app.js               # 路由与视图切换
│   ├── menubar.js           # 自定义标题栏
│   ├── theme.js             # 主题切换
│   ├── common.js            # 复制、toast、数字解析
│   ├── lib/                 # 纯算法（无 UI）
│   └── tools/               # 各工具 UI 模块
├── data/                    # 本地配置（税率、节假日等）
├── docs/
└── src-tauri/
```

## 许可

采用 [MIT License](LICENSE) 开源，中文参考译本见 [LICENSE.zh-CN.md](LICENSE.zh-CN.md)；应用内「许可证」页也提供全文。
