# 20-20-20 护眼助手 👁️

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/your-extension-id?label=Chrome%20%E7%89%88%E6%9C%AC)](https://chrome.google.com/webstore/detail/your-extension-id)
[![GitHub license](https://img.shields.io/github/license/yourusername/eye-protector)](https://github.com/yourusername/eye-protector)

> 一款遵循「20-20-20」用眼原则的优雅护眼工具，为数字时代用眼健康保驾护航

## ✨ 核心功能

- **科学定时提醒**  
  每隔 `20分钟`（可自定义）自动提示眺望远方
- **优雅视觉设计**  
  Ant Design 风格提示界面 + 流畅动效
- **智能状态管理**
    - 一键启用/禁用提醒
    - 自动保存用户设置
    - 每日数据统计报表
- **深度自定义**
  ```bash
  # 可配置参数
  提醒间隔: 1-180 分钟
  休息时长: 5-300 秒
- **多场景适配**
    - 自动深色模式
    - 移动端优化布局
    - 跨窗口状态同步

## 🚀 快速开始
1. **Chrome 商店安装**  
   前往 [Chrome Web Store](https://chrome.google.com/webstore/detail/your-extension-id) 安装

2. **手动安装**
   ```bash
   git clone https://github.com/yourusername/eye-protector.git
   # Chrome 访问 chrome://extensions/
   # 启用开发者模式 -> 加载已解压的扩展程序

### 使用方法
1. 点击工具栏图标激活插件
2. 通过开关控制提醒状态 🔛
3. 在设置面板调整参数 ⚙
4. 查看统计面板了解用眼习惯 📊

## ⚙️ 技术架构
```markdown
├── Chrome 扩展 API
├── Service Worker 后台服务
├── Ant Design 风格组件
├── 本地存储（chrome.storage）
└── 跨窗口消息通信
```
## 🤝 参与贡献
欢迎通过 Issues 或 PR 参与改进：
1. Fork 项目
2. 创建特性分支  
   `git checkout -b feature/improvement`
3. 提交修改  
   `git commit -m 'Add some feature'`
4. 推送分支  
   `git push origin feature/improvement`
5. 新建 Pull Request

## 📜 开源协议
本项目采用 [MIT License](LICENSE)

---

🌱 眼睛是心灵的窗户，让科技守护你的视界健康  
⏰ 每隔20分钟，给自己20秒的绿色时光






