# 轻量级产品管理系统

这是一个使用 Node.js (Express) 构建的轻量级产品管理系统，设计用于OpenWrt环境下运行。系统支持多人查询、少量修改，使用JSON文件存储数据，适合小型团队（约5人）使用。

## 功能特点

- **产品管理**：添加、编辑、删除产品信息
- **灵活字段**：不同产品可以有不同的信息字段，动态匹配显示
- **搜索功能**：支持模糊搜索，根据款号或产品信息匹配
- **Excel导入/导出**：支持Excel文件导入导出，自动识别不同产品字段
- **轻量级**：使用JSON文件存储数据，无需数据库
- **响应式设计**：适配手机和桌面设备

## 系统要求

- Node.js 14+
- 可访问的Web服务器（如OpenWrt设备）
- 约20MB可用存储空间

## 安装步骤

1. 克隆或下载项目到服务器

```bash
git clone <repository-url> product-management-system
cd product-management-system
```

2. 安装依赖

```bash
npm install
```

3. 启动应用

```bash
npm start
```

默认情况下，应用将在 http://localhost:3000 启动

## 在OpenWrt上部署

1. 确保OpenWrt设备已安装Node.js

```bash
opkg update
opkg install node
```

2. 将项目复制到OpenWrt设备

3. 设置自启动

在 `/etc/init.d/` 创建启动脚本 `product-system`：

```bash
#!/bin/sh /etc/rc.common

START=99
STOP=15

USE_PROCD=1
NAME=product-system
PROG=/path/to/product-management-system/app.js

start_service() {
    procd_open_instance
    procd_set_param command node $PROG
    procd_set_param respawn
    procd_set_param stdout 1
    procd_set_param stderr 1
    procd_close_instance
}
```

添加执行权限并启用：

```bash
chmod +x /etc/init.d/product-system
/etc/init.d/product-system enable
/etc/init.d/product-system start
```

## 使用说明

### 产品搜索

在首页的搜索框中输入产品款号或任何产品信息进行搜索。系统支持模糊搜索，会返回所有匹配的产品。

### 产品管理

- **添加产品**：点击首页的"添加产品"按钮，填写产品信息
- **编辑产品**：点击产品卡片上的"编辑"按钮修改产品信息
- **删除产品**：点击产品卡片上的"删除"按钮删除产品

### 自定义字段

添加或编辑产品时，可以添加任意名称的自定义字段，适应不同类型产品的需求。例如：
- 阳具产品可以添加"尺寸"、"震动模式"等字段
- 倒模产品可以添加"明星名称"、"重量"等字段

### Excel导入导出

- **导入**：在"导入/导出"页面上传Excel文件，系统会自动识别各列并导入产品
- **导出**：点击"导出所有产品"按钮，将所有产品数据导出为Excel文件

## 文件结构

```
product-management-system/
│
├── data/                   # 存储JSON文件
│   └── products.json       # 产品数据
│
├── public/                 # 静态资源
│   ├── css/                # 样式文件
│   │   └── style.css
│   └── js/                 # 客户端JavaScript
│       └── main.js
│
├── views/                  # EJS模板
│   ├── partials/           # 可复用的模板部分
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── index.ejs           # 主页/搜索页
│   ├── product.ejs         # 产品详情页
│   └── import-export.ejs   # 导入导出页面
│
├── utils/                  # 工具函数
│   ├── excelHandler.js     # Excel导入导出处理
│   └── productUtils.js     # 产品数据处理工具
│
├── routes/                 # 路由处理
│   ├── index.js            # 主路由
│   ├── products.js         # 产品相关路由
│   └── importExport.js     # 导入导出路由
│
├── app.js                  # 应用主入口
├── package.json            # 项目依赖
└── README.md               # 项目说明文档
```

## 注意事项

- 数据保存在 `data/products.json` 文件中，建议定期备份
- 为了最佳性能，建议产品数量保持在1000个以内
- 上传的Excel文件必须包含产品ID列（标题可以是 "productId"、"产品ID" 或 "款号"）

## 故障排除

1. **应用无法启动**
   - 检查Node.js是否正确安装: `node -v`
   - 检查依赖是否已安装: `npm install`

2. **Excel导入失败**
   - 确保Excel文件包含正确的productId列
   - 检查Excel文件格式是否为.xlsx或.xls

3. **搜索功能不工作**
   - 检查日志是否有错误信息
   - 确保products.json文件存在且有读写权限

## 开发维护

- **添加功能**：修改相应的路由和视图文件
- **样式调整**：编辑`public/css/style.css`文件
- **客户端交互**：编辑`public/js/main.js`文件