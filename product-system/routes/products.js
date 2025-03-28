const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { getAllProducts, saveAllProducts, getProductById } = require('../utils/productUtils');

// 获取产品详情
router.get('/:id', (req, res) => {
  try {
    const productId = req.params.id;
    const products = getAllProducts();
    
    // 查找产品
    const product = products.find(p => p.productId === productId);
    
    if (!product) {
      return res.status(404).render('error', { 
        title: '产品未找到', 
        message: `未找到ID为 ${productId} 的产品` 
      });
    }

    // 检查Accept头，如果请求JSON，则返回JSON
    const acceptHeader = req.get('Accept');
    if (acceptHeader && acceptHeader.includes('application/json')) {
      return res.json(product);
    }
    
    // 否则渲染产品详情页面
    res.render('product', { 
      title: product.name || `产品 ${productId}`,
      product: product
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).render('error', { 
      title: '服务器错误', 
      message: '获取产品详情时出错' 
    });
  }
});

// 添加新产品
router.post('/', (req, res) => {
  try {
    const newProduct = req.body;
    
    // 验证必要字段
    if (!newProduct.productId) {
      return res.status(400).json({ error: '产品ID是必需的' });
    }
    
    const products = getAllProducts();
    
    // 检查是否已存在相同ID的产品
    if (products.some(p => p.productId === newProduct.productId)) {
      return res.status(400).json({ error: '相同ID的产品已存在' });
    }
    
    // 添加产品
    products.push(newProduct);
    saveAllProducts(products);
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: '添加产品时出错: ' + error.message });
  }
});

// 更新产品
router.put('/:id', (req, res) => {
  try {
    const productId = req.params.id;
    const updatedProduct = req.body;
    
    // 调试日志
    console.log('更新产品请求:', {productId, body: updatedProduct});
    
    const products = getAllProducts();
    
    // 查找产品索引
    const productIndex = products.findIndex(p => p.productId === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: '产品未找到' });
    }
    
    // 确保产品ID不变
    updatedProduct.productId = productId;
    
    // 更新产品
    products[productIndex] = updatedProduct;
    const saveResult = saveAllProducts(products);
    
    if (!saveResult) {
      throw new Error('保存产品数据失败');
    }
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: '更新产品时出错: ' + error.message });
  }
});

// 删除产品
router.delete('/:id', (req, res) => {
  try {
    const productId = req.params.id;
    let products = getAllProducts();
    
    // 过滤掉要删除的产品
    const originalLength = products.length;
    const filteredProducts = products.filter(p => p.productId !== productId);
    
    if (filteredProducts.length === originalLength) {
      return res.status(404).json({ error: '产品未找到' });
    }
    
    const saveResult = saveAllProducts(filteredProducts);
    
    if (!saveResult) {
      throw new Error('保存产品数据失败');
    }
    
    res.json({ message: '产品删除成功' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: '删除产品时出错: ' + error.message });
  }
});

module.exports = router;