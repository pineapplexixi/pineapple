const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');

// 产品数据文件路径
const productsFilePath = path.join(__dirname, '..', 'data', 'products.json');

// 主页 - 显示所有产品和搜索框
router.get('/', (req, res) => {
  try {
    // 读取产品数据
    const products = fs.readJsonSync(productsFilePath, { throws: false }) || [];
    
    // 获取搜索查询参数
    const query = req.query.q || '';
    
    // 如果有搜索查询，过滤产品
    let filteredProducts = products;
    
    if (query) {
      // 实现更好的模糊搜索
      filteredProducts = products.filter(product => {
        // 检查每个产品的所有字段
        return Object.entries(product).some(([key, value]) => {
          // 跳过空值和非字符串/数字值
          if (value === null || value === undefined) return false;
          
          // 转换为字符串并进行不区分大小写的搜索
          const valueStr = value.toString().toLowerCase();
          const queryLower = query.toLowerCase();
          
          return valueStr.includes(queryLower);
        });
      });
      
      // 对结果排序 - 将匹配程度较高的放在前面
      filteredProducts.sort((a, b) => {
        // 如果productId匹配，优先级最高
        const aIdMatch = a.productId && a.productId.toString().toLowerCase().includes(query.toLowerCase());
        const bIdMatch = b.productId && b.productId.toString().toLowerCase().includes(query.toLowerCase());
        
        if (aIdMatch && !bIdMatch) return -1;
        if (!aIdMatch && bIdMatch) return 1;
        
        // 如果名称匹配，第二优先级
        const aNameMatch = a.name && a.name.toLowerCase().includes(query.toLowerCase());
        const bNameMatch = b.name && b.name.toLowerCase().includes(query.toLowerCase());
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // 默认排序保持原来顺序
        return 0;
      });
    }
    
    res.render('index', { 
      title: '产品管理系统', 
      products: filteredProducts,
      query: query
    });
  } catch (error) {
    console.error('Error loading products:', error);
    res.status(500).render('error', { 
      title: '服务器错误', 
      message: '加载产品数据时出错: ' + error.message 
    });
  }
});

module.exports = router;