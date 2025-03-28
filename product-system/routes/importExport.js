const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { importProductsFromExcel, exportProductsToExcel } = require('../utils/excelHandler');

// 设置文件上传
const upload = multer({ 
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 限制10MB
});

// 导入导出页面
router.get('/', (req, res) => {
  res.render('import-export', { 
    title: '导入/导出产品', 
    message: req.query.message,
    error: req.query.error
  });
});

// 处理Excel文件导入
router.post('/import', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.redirect('/import-export?error=请选择Excel文件');
    }

    const result = await importProductsFromExcel(req.file.path);
    
    // 导入完成后重定向回导入/导出页面
    res.redirect(`/import-export?message=成功导入${result.count}个产品`);
  } catch (error) {
    console.error('Excel导入错误:', error);
    res.redirect(`/import-export?error=${encodeURIComponent(error.message)}`);
  }
});

// 导出产品到Excel
router.get('/export', async (req, res) => {
  try {
    const filePath = await exportProductsToExcel();
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
    
    // 发送文件
    res.sendFile(filePath, {}, (err) => {
      if (err) {
        console.error('发送文件错误:', err);
      }
    });
  } catch (error) {
    console.error('Excel导出错误:', error);
    res.redirect(`/import-export?error=${encodeURIComponent(error.message)}`);
  }
});

module.exports = router;