# 订阅管理系统

一个简单的、基于浏览器的订阅管理系统，帮助用户追踪和管理他们的各种在线服务订阅。

## 项目简介

这个订阅管理系统是一个轻量级的Web应用，旨在帮助用户方便地记录、查看和管理他们的订阅信息。它支持添加、编辑、删除订阅，并根据到期日期自动标记订阅状态（有效、即将到期、已过期）。此外，还提供了筛选功能和批量操作意向设置，方便用户规划续订或取消。

数据优先从浏览器本地存储加载，如果本地存储没有数据或加载失败，则从 `data.json` 文件加载默认数据。所有更改都会实时保存到本地存储中。

## 功能特性

*   **订阅信息管理:**
    *   添加新的订阅，包括产品名称、关联账户（支持多个）、到期日期、管理页面链接。
    *   编辑现有订阅的详细信息。
    *   删除不再需要的订阅。
*   **状态追踪:**
    *   根据到期日期自动计算并显示订阅状态：有效、即将到期（7天内）、已过期。
    *   视觉化状态提示，即将到期的订阅有醒目提醒。
*   **意向设置:**
    *   为订阅设置“计划续订”或“计划取消”的意向标记。
    *   支持批量设置意向。
*   **筛选功能:**
    *   按状态（全部、有效、即将到期、已过期）或意向（计划续订、计划取消）筛选订阅列表。
*   **批量操作:**
    *   支持多选订阅，并批量设置续订或取消意向。
    *   提供清除批量选择的功能。
*   **数据持久化:**
    *   数据自动保存到浏览器本地存储，关闭浏览器后数据不会丢失。
    *   首次加载或本地存储失败时，从 `data.json` 加载默认数据。
*   **响应式设计:**
    *   界面适应不同屏幕尺寸（尽管示例代码中未完全展示完整的响应式布局，但使用了Tailwind CSS的基础响应式类）。
*   **用户友好界面:**
    *   模态框用于添加/编辑订阅，提供清晰的表单。
    *   账户字段动态增删。
    *   表单验证提供实时反馈。
    *   成功通知和加载状态提示。
    *   统计卡片直观展示订阅概况。
    *   账户列表支持折叠/展开。
    *   键盘快捷键支持 (ESC 关闭模态框, Ctrl+A 全选可见订阅)。

## 技术栈

*   **HTML5:** 页面结构。
*   **Tailwind CSS:** 快速构建现代化的UI样式。
*   **JavaScript (ES6+):** 应用逻辑，包括数据管理、DOM操作、事件处理、本地存储交互、数据验证等。
*   **本地存储 (localStorage):** 数据持久化。
*   **Fetch API:** 用于加载 `data.json` 文件（尽管在这个简单的应用中，它主要用于演示加载过程，实际数据存储是基于localStorage）。

## 文件结构
.
├── index.html      # 应用主页面
├── script.js       # 应用核心JavaScript逻辑
└── data.json       # 初始或默认订阅数据

## 安装与使用

这个应用是一个纯前端应用，不需要后端服务器。你只需要一个现代浏览器即可运行。

1.  **克隆或下载代码库:**
    ```bash
    git clone <仓库地址> # 如果代码在一个Git仓库中
    # 或者直接下载ZIP文件并解压
    ```
2.  **打开 `index.html` 文件:**
    在你的浏览器中直接打开 `index.html` 文件即可运行应用。

**注意:** 由于浏览器安全限制，直接通过 `file://` 协议打开 `index.html` 可能无法加载 `data.json` 文件。推荐使用一个简单的本地Web服务器来运行，例如：

*   **使用 Python:**
    在项目根目录下打开终端，运行：
    ```bash
    python -m http.server 8000
    ```
    然后访问 `http://localhost:8000`。
*   **使用 Node.js (需要安装):**
    安装 `http-server`：
    ```bash
    npm install -g http-server
    ```
    在项目根目录下打开终端，运行：
    ```bash
    http-server
    ```
    然后访问 `http://localhost:8080` (默认端口)。

## 数据存储

应用数据存储在浏览器的 `localStorage` 中。这意味着：

*   数据仅保存在当前浏览器中。
*   清除浏览器缓存或更换浏览器将丢失数据。
*   数据不会同步到其他设备。

`data.json` 文件仅在首次加载应用且本地存储没有数据时作为默认数据源使用。

## 代码结构概述

*   `script.js` 文件包含一个 `SubscriptionManager` 类，封装了应用的全部逻辑。
*   类中的方法包括：
    *   `constructor()`: 初始化属性和绑定事件。
    *   `init()`: 加载数据、绑定事件、渲染界面。
    *   `loadData()`: 从本地存储或 `data.json` 加载数据。
    *   `saveData()`: 将数据保存到本地存储。
    *   `bindEvents()`: 绑定DOM事件监听器。
    *   `render()`: 更新整个界面，包括统计和列表。
    *   `renderSubscriptions()`: 渲染订阅列表。
    *   `openModal()` / `closeModal()`: 控制模态框的显示和隐藏。
    *   `handleFormSubmit()`: 处理表单提交，包括验证和保存。
    *   `saveSubscription()`: 添加或更新订阅数据。
    *   `editSubscription()` / `deleteSubscription()`: 处理编辑和删除操作。
    *   `calculateStatus()` / `getStatusInfo()`: 计算和获取订阅状态信息。
    *   `updateStats()`: 更新统计卡片。
    *   `setFilter()` / `getFilteredSubscriptions()`: 处理筛选逻辑。
    *   `setupValidation()` / `validateField()` / `validateAllAccounts()`: 设置和执行表单验证。
    *   `addAccountField()` / `populateAccounts()` / `resetAccountFields()` / `updateAccountFieldsRequired()`: 管理账户输入字段。
    *   `setIntention()` / `clearIntention()`: 设置和清除订阅意向。
    *   `toggleAccounts()`: 控制账户列表的折叠/展开。
    *   `showSuccessNotification()` / `showLoading()` / `hideLoading()`: 显示各种UI反馈。
    *   批量操作相关方法 (`toggleBatchSelection`, `clearBatchSelection`, `selectAllVisibleSubscriptions`, `updateBatchSelectionUI`, `applyBatchIntention`)。

## 贡献

如果你想为这个项目做出贡献，可以提交Pull Request或Issue。

## 许可证

[根据你的项目选择一个许可证，例如 MIT 或 Apache 2.0]

---

**请注意:** 这是一个基础的演示项目，不适用于存储高度敏感的信息。本地存储的数据可以被浏览器访问和修改。对于生产环境或需要更安全、更强大数据存储的应用，需要一个后端服务。



