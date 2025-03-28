const express = require('express');
const router = express.Router();
const { getAllProducts } = require('../utils/productUtils');

// 获取所有产品
router.get('/products', (req, res) => {
  try {
    const products = getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('API错误:', error);
    res.status(500).json({ error: '获取产品失败' });
  }
});

module.exports = router;