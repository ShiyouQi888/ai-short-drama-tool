# AI 短剧节点式流水线创作工具 (AI Short Drama Pipeline Tool)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg)
![React](https://img.shields.io/badge/React-19.0-blue.svg)

这是一个基于节点式工作流的 AI 短剧全流程创作工具。通过可视化的连接逻辑，将剧本创作、角色提取、分镜生成、图像绘制、语音合成以及视频生成有机结合，极大提升短剧内容的生产效率。

## 🌟 核心特性

- **可视化节点流**：采用直观的节点连接方式，自由组合创作流程，支持贝塞尔曲线、直线、折线等多种连线风格。
- **全流程 AI 集成**：
  - **剧本创作 (LLM)**：支持 OpenAI, DeepSeek, Anthropic, 通义千问, 智谱AI 等主流大模型。
  - **生图系统**：集成 DALL-E 3, Stable Diffusion, Flux 等。
  - **语音合成 (TTS)**：支持 OpenAI TTS, ElevenLabs 等顶级拟人化语音。
  - **视频生成**：深度集成 Luma AI (Dream Machine), Runway, 可灵 (Kling) 等。
- **自动化生产线**：支持从剧本一键自动生成角色库、分集内容及分镜镜头，实现真正的“剧本进，视频出”。
- **灵活的配置管理**：内置设置面板，支持本地模型 (LM Studio, Ollama) 与云端 API 的自由切换与状态监控。
- **高性能交互**：基于 Next.js 15 和 Zustand 状态管理，提供流畅的缩放、平移及实时预览体验。

## 🛠️ 技术栈

- **前端框架**：[Next.js 15](https://nextjs.org/) (App Router)
- **状态管理**：[Zustand](https://github.com/pmndrs/zustand)
- **UI 组件库**：[Radix UI](https://www.radix-ui.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **图标库**：[Lucide React](https://lucide.dev/)
- **动画/交互**：Framer Motion, Tailwind Animate
- **后端集成**：内置多平台 AI API 服务封装

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/ShiyouQi888/ai-short-drama-tool.git
cd ai-short-drama-tool
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 配置 API Key
点击界面左下角的 **设置图标**，配置您的大语言模型、生图、视频及 TTS 的 API 密钥。

### 4. 运行开发服务器
```bash
pnpm dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始创作。

## 📖 使用指南

1. **添加节点**：从顶部工具栏选择不同类型的节点（输入、AI、流程、输出）。
2. **连接逻辑**：拖动节点的输出端口连接到另一个节点的输入端口。
3. **自动生成**：
   - 添加“剧本生成”节点，输入提示词运行后，点击节点上的“自动生成角色”或“自动生成剧集”。
   - 系统将自动在画布上构建完整的后续生产流程。
4. **运行流水线**：点击顶部工具栏的“运行流水线”，系统将按照拓扑顺序依次调用 AI 接口生成内容。

## 🤝 贡献指南

欢迎提交 Issue 或 Pull Request。对于重大更改，请先开 Issue 讨论您想要更改的内容。

## 📄 开源协议

本项目采用 [MIT](LICENSE) 协议开源。
