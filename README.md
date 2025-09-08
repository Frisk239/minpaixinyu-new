# 民派新语 - 文化学习平台

为社会历史学院同学创作的网页应用，基于 Flask + React + SQLite 技术栈。

## 项目结构

```
minpaixinyu-new/
├── backend/                 # Flask 后端
│   ├── app.py              # 主应用文件
│   ├── init_db.py          # 数据库初始化脚本
│   ├── requirements.txt    # Python 依赖
│   └── data/               # 数据库文件目录
│       └── users.db        # SQLite 数据库文件
├── frontend/               # React 前端
│   ├── public/
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── styles/         # 样式文件
│   │   ├── App.tsx         # 主应用组件
│   │   └── index.tsx       # 入口文件
│   ├── package.json        # Node.js 依赖
│   └── tsconfig.json       # TypeScript 配置
├── static/                 # 静态资源
│   ├── image/              # 图片文件
│   └── font/               # 字体文件
├── .gitignore              # Git 忽略文件
└── README.md               # 项目说明
```

## 功能特性

- 🎭 **进入页面**: 过渡动画效果，点击下半部分进入登录
- 🔐 **用户认证**: 登录/注册功能，基于 session 的认证
- 🏠 **首页**: 文化学习平台主界面，展示功能模块
- 🎨 **响应式设计**: 支持移动端和桌面端
- 🔧 **TypeScript**: 前端使用 TypeScript 开发

## 技术栈

### 后端
- **Flask**: Python Web 框架
- **SQLAlchemy**: ORM 数据库操作
- **SQLite**: 轻量级数据库
- **Flask-CORS**: 跨域支持

### 前端
- **React**: 用户界面框架
- **TypeScript**: 类型安全的 JavaScript
- **React Router**: 前端路由管理
- **Axios**: HTTP 客户端

## 安装和运行

### 1. 后端设置

```bash
# 进入后端目录
cd backend

# 安装 Python 依赖 (使用 conda 或 pip)
pip install -r requirements.txt

# 初始化数据库 (可选，会创建示例用户)
python init_db.py

# 运行 Flask 应用
python app.py
```

后端将在 `http://localhost:5000` 启动

### 2. 前端设置

```bash
# 进入前端目录
cd frontend

# 安装 Node.js 依赖
npm install

# 启动开发服务器
npm start
```

前端将在 `http://localhost:3000` 启动

### 3. 访问应用

打开浏览器访问 `http://localhost:3000`

## 数据库

应用使用 SQLite 数据库，数据库文件 `users.db` 会在首次运行时自动创建。

### 用户表结构
- `id`: 主键
- `username`: 用户名（唯一）
- `email`: 邮箱（唯一）
- `password_hash`: 密码哈希
- `created_at`: 创建时间

## API 接口

### 认证相关
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `POST /api/logout` - 用户登出
- `GET /api/check_auth` - 检查登录状态

### 静态文件
- `GET /static/<path>` - 静态文件服务

## 页面流程

1. **进入页面** (`/`) - 显示 entrance.png，点击下半部分进入登录
2. **登录页面** (`/login`) - 显示 login1.png + login2.png，右侧登录表单
3. **注册页面** (`/register`) - 类似登录页面，提供注册功能
4. **首页** (`/home`) - 显示 index.png 背景，顶部导航栏

## 自定义配置

### 环境变量
在生产环境中，建议设置以下环境变量：

```bash
export FLASK_SECRET_KEY="your-secret-key"
export FLASK_ENV="production"
```

### 数据库配置
修改 `app.py` 中的数据库 URI：

```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///your-database.db'
```

## 开发说明

- 前端使用 TypeScript 开发，提供类型安全
- 样式使用 CSS，支持响应式设计
- 导航栏使用半透明米黄色背景
- 自定义字体：方正风雅楷宋简体

## 注意事项

- 确保所有图片文件路径正确
- 字体文件需要正确加载
- 开发环境使用 session 存储用户状态
- 生产环境建议使用更安全的认证机制

## 许可证

本项目仅用于学习和演示目的。
