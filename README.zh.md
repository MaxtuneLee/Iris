# Afilmory

Afilmory (/əˈfɪlməri/, "uh-FIL-muh-ree") 是一个为个人摄影网站创造的术语，融合了对焦 (AF)、光圈（光线控制）、胶片（复古媒介）和记忆（捕捉的瞬间）。

一个现代化的照片画廊网站，采用 React + TypeScript 构建，支持从多种存储源（S3、GitHub）自动同步照片，具有高性能 WebGL 渲染、瀑布流布局、EXIF 信息展示、缩略图生成等功能。

线上照片墙：

- https://gallery.innei.in
- https://gallery.mxte.cc
- https://photography.pseudoyu.com

## 🌟 特性

### 核心功能

- 🖼️ **高性能 WebGL 图像渲染器** - 基于自研 WebGL 组件，支持流畅的缩放、平移操作
- 📱 **响应式瀑布流布局** - 采用 Masonic 实现，自适应不同屏幕尺寸
- 🎨 **现代化 UI 设计** - 基于 Tailwind CSS 和 Radix UI 组件库
- ⚡ **增量同步** - 智能检测文件变化，仅处理新增或修改的照片
- 🌐 **i18n** - 支持多语言

### 图像处理

- 🔄 **HEIC/HEIF 格式支持** - 自动转换 Apple 设备的 HEIC 格式
- 🖼️ **智能缩略图生成** - 多尺寸缩略图，优化加载性能
- 📊 **EXIF 信息展示** - 完整的拍摄参数，包括相机型号、焦距、光圈等
- 🌈 **Blurhash 占位符** - 优雅的图片加载体验
- 📱 **Live Photo 支持** - 检测并展示 iPhone Live Photo

### 高级功能

- 🎛️ **富士胶片模拟** - 读取和展示富士相机的胶片模拟设置
- 🔍 **全屏查看器** - 支持手势操作的图片查看器
- 🏷️ **智能标签** - 基于 EXIF 数据自动生成标签
- ⚡ **并发处理** - 支持多进程/多线程并发处理
- 🗂️ **多存储支持** - S3、GitHub 等多种存储后端

## 🏗️ 技术架构

### 前端技术栈

- **React 19** - 使用最新的 React 版本和 Compiler
- **TypeScript** - 完整的类型安全
- **Vite** - 现代化构建工具
- **Tailwind CSS** - 原子化 CSS 框架
- **Radix UI** - 无障碍组件库
- **Jotai** - 状态管理
- **TanStack Query** - 数据获取和缓存
- **React Router 7** - 路由管理
- **i18next** - 国际化

### 构建系统

- **Node.js** - 服务端运行时
- **Sharp** - 高性能图像处理
- **AWS SDK** - S3 存储操作
- **Worker Threads/Cluster** - 并发处理
- **EXIF-Reader** - EXIF 数据提取

### 存储架构

采用适配器模式设计，支持多种存储后端：

- **S3 兼容存储** - AWS S3、MinIO、阿里云 OSS 等
- **GitHub 存储** - 使用 GitHub 仓库作为图片存储

## 🚀 快速开始

### Docker 部署

[Docker 部署](https://github.com/Afilmory/docker)

### 环境要求

- Node.js 18+
- 至少 4GB RAM（用于图像处理）

### 1. 克隆项目

```bash
git clone https://github.com/Afilmory/Afilmory.git
cd photo-gallery-site
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 环境配置

创建 `.env` 文件：

```env
# S3 存储配置
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your_access_key_id
S3_SECRET_ACCESS_KEY=your_secret_access_key
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET_NAME=your_bucket_name
S3_PREFIX=photos/
S3_CUSTOM_DOMAIN=your_custom_domain.com
S3_EXCLUDE_REGEX=
```

### 4. 站点配置

复制并编辑配置文件：

```bash
cp config.example.json config.json
```

编辑 `config.json`：

```json
{
  "name": "我的照片画廊",
  "title": "我的照片画廊",
  "description": "记录生活中的美好瞬间",
  "url": "https://gallery.example.com",
  "accentColor": "#007bff", // 可选, 设置主题色
  "author": {
    "name": "Your Name", // 必填, 设置作者名称
    "url": "https://example.com", // 可选, 设置作者主页
    "avatar": "https://example.com/avatar.png" // 可选, 设置作者头像
  },
  "social": {
    "twitter": "@yourusername" // 可选, 设置社交账号
  }
}
```

### 5. 构建照片清单

```bash
# 首次构建
pnpm run build:manifest

# 增量更新
pnpm run build:manifest

# 强制全量更新
pnpm run build:manifest -- --force
```

### 6. 启动开发服务器

```bash
pnpm dev
```

## ⚙️ 配置选项

### 构建器配置

创建 `builder.config.json` 文件进行高级配置：

```json
{
  "repo": {
    "enable": false,
    "url": "https://github.com/username/gallery-assets"
  },
  "storage": {
    "provider": "s3",
    "bucket": "my-photos",
    "region": "us-east-1",
    "prefix": "photos/",
    "customDomain": "https://cdn.example.com"
  },
  "options": {
    "defaultConcurrency": 8,
    "enableLivePhotoDetection": true,
    "showProgress": true,
    "showDetailedStats": true
  },
  "logging": {
    "verbose": true,
    "level": "info",
    "outputToFile": false
  },
  "performance": {
    "worker": {
      "workerCount": 8,
      "timeout": 30000,
      "useClusterMode": true,
      "workerConcurrency": 2
    }
  }
}
```

### 配置选项说明

#### 存储配置 (`storage`)

- `provider`: 存储提供商 (`s3` | `github`)
- `bucket`: S3 存储桶名称
- `region`: S3 区域
- `endpoint`: S3 端点（可选）
- `prefix`: 文件前缀
- `customDomain`: 自定义域名
- `excludeRegex`: 排除文件的正则表达式（可选）

#### 构建选项 (`options`)

- `defaultConcurrency`: 默认并发数
- `enableLivePhotoDetection`: 启用 Live Photo 检测
- `showProgress`: 显示构建进度
- `showDetailedStats`: 显示详细统计信息

#### 性能配置 (`performance`)

- `worker.workerCount`: Worker 进程数
- `worker.timeout`: Worker 超时时间（毫秒）
- `worker.useClusterMode`: 启用集群模式

#### 日志配置 (`logging`)

- `verbose`: 详细日志
- `level`: 日志级别 (`info` | `warn` | `error` | `debug`)
- `outputToFile`: 输出到文件

### 远程资源库配置

如果你有独立的资源仓库存储缩略图和清单：

```json
{
  "repo": {
    "enable": true,
    "url": "https://github.com/username/gallery-assets"
  }
}
```

这将自动从远程仓库拉取资源，避免每次构建。

## 📋 CLI 命令

### 构建命令

```bash
# 查看帮助
pnpm run build:manifest -- --help

# 增量更新（默认）
pnpm run build:manifest

# 强制全量更新
pnpm run build:manifest -- --force

# 仅重新生成缩略图
pnpm run build:manifest -- --force-thumbnails

# 仅重新生成清单
pnpm run build:manifest -- --force-manifest
```

### 开发命令

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

### 注意事项

- 确保你的 S3 存储桶已经包含照片文件
- 如果使用远程资源库，需要先配置 `builder.config.json`

## 🔧 高级用法

### 自定义存储提供商

实现 `StorageProvider` 接口以支持新的存储后端：

```typescript
import { StorageProvider } from './src/core/storage/interfaces'

class MyStorageProvider implements StorageProvider {
  async getFile(key: string): Promise<Buffer | null> {
    // 实现文件获取逻辑
  }

  async listImages(): Promise<StorageObject[]> {
    // 实现图片列表获取逻辑
  }

  // ... 其他方法
}
```

### 自定义图像处理

在 `src/core/image/` 目录下添加自定义处理器：

```typescript
export async function customImageProcessor(buffer: Buffer) {
  // 自定义图像处理逻辑
  return processedBuffer
}
```

## 📄 许可证

MIT License © 2025 Innei

## 🔗 相关链接

- [在线演示](https://gallery.innei.in)
- [个人网站](https://innei.in)
- [GitHub](https://github.com/innei)

---

如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！ 
