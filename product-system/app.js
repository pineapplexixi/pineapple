const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs-extra');

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 允许在iframe中嵌入
app.use(function(req, res, next) {
  res.removeHeader('X-Frame-Options');
  next();
});

// 添加CORS支持
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// 路由引入
const indexRouter = require('./routes/index');
const productsRouter = require('./routes/products');
const importExportRouter = require('./routes/importExport');
const helpRouter = require('./routes/help');
const apiRouter = require('./routes/api'); // 新增API路由

// 确保数据目录存在
fs.ensureDirSync(path.join(__dirname, 'data'));

// 如果products.json不存在，创建一个空的产品列表
const productsFilePath = path.join(__dirname, 'data', 'products.json');
if (!fs.existsSync(productsFilePath)) {
  fs.writeJsonSync(productsFilePath, []);
}

// 视图引擎设置
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 路由设置
app.use('/', indexRouter);
app.use('/products', productsRouter);
app.use('/import-export', importExportRouter);
app.use('/help', helpRouter);
app.use('/api', apiRouter); // 使用API路由

// 错误处理
app.use((req, res) => {
  res.status(404).render('404', { title: '页面未找到' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: '服务器错误', 
    message: err.message 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
});

module.exports = app;