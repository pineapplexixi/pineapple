const fs = require('fs-extra');
const path = require('path');

// 产品数据文件路径
const productsFilePath = path.join(__dirname, '..', 'data', 'products.json');

/**
 * 获取所有产品
 * @returns {Array} 产品数组
 */
function getAllProducts() {
  try {
    return fs.readJsonSync(productsFilePath, { throws: false }) || [];
  } catch (error) {
    console.error('读取产品数据错误:', error);
    return [];
  }
}

/**
 * 保存所有产品
 * @param {Array} products 产品数组
 * @returns {boolean} 保存是否成功
 */
function saveAllProducts(products) {
  try {
    // 确保产品ID字段一致性（支持productId和型号两种形式）
    products.forEach(product => {
      if (product.型号 && !product.productId) {
        product.productId = product.型号;
      } else if (product.productId && !product.型号) {
        product.型号 = product.productId;
      }
    });
    
    fs.writeJsonSync(productsFilePath, products, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('保存产品数据错误:', error);
    return false;
  }
}

/**
 * 根据ID获取产品
 * @param {string} productId 产品ID
 * @returns {Object|null} 产品对象或null
 */
function getProductById(productId) {
  const products = getAllProducts();
  return products.find(product => 
    product.productId === productId || product.型号 === productId
  ) || null;
}

/**
 * 搜索产品
 * @param {string} query 搜索关键词
 * @returns {Array} 匹配的产品数组
 */
function searchProducts(query) {
  if (!query) return getAllProducts();
  
  const products = getAllProducts();
  const lowercaseQuery = query.toLowerCase();
  
  // 先查找精确匹配型号的产品
  const exactMatches = products.filter(product => {
    const productId = product.productId || product.型号 || '';
    return productId.toLowerCase() === lowercaseQuery;
  });
  
  // 再查找部分匹配型号的产品
  const partialIdMatches = products.filter(product => {
    const productId = product.productId || product.型号 || '';
    return productId.toLowerCase().includes(lowercaseQuery) && 
           !exactMatches.includes(product);
  });
  
  // 最后查找其他字段匹配的产品
  const otherMatches = products.filter(product => {
    // 排除已经在之前两个数组中的产品
    if (exactMatches.includes(product) || partialIdMatches.includes(product)) {
      return false;
    }
    
    // 在所有字段中搜索
    return Object.entries(product).some(([key, value]) => {
      if (value === null || value === undefined) return false;
      return value.toString().toLowerCase().includes(lowercaseQuery);
    });
  });
  
  // 合并结果，按优先级排序
  return [...exactMatches, ...partialIdMatches, ...otherMatches];
}

/**
 * 添加产品
 * @param {Object} product 产品对象
 * @returns {Object} 添加的产品
 */
function addProduct(product) {
  const products = getAllProducts();
  
  // 确保productId和型号一致
  if (product.型号 && !product.productId) {
    product.productId = product.型号;
  } else if (product.productId && !product.型号) {
    product.型号 = product.productId;
  }
  
  // 检查是否已存在相同ID的产品
  if (products.some(p => p.productId === product.productId || p.型号 === product.型号)) {
    throw new Error(`型号为 ${product.型号 || product.productId} 的产品已存在`);
  }
  
  products.push(product);
  saveAllProducts(products);
  return product;
}

/**
 * 更新产品
 * @param {string} productId 产品ID
 * @param {Object} updatedProduct 更新后的产品对象
 * @returns {Object} 更新后的产品
 */
function updateProduct(productId, updatedProduct) {
  const products = getAllProducts();
  const index = products.findIndex(p => 
    p.productId === productId || p.型号 === productId
  );
  
  if (index === -1) {
    throw new Error(`型号为 ${productId} 的产品不存在`);
  }
  
  // 确保不改变productId和型号
  updatedProduct.productId = productId;
  updatedProduct.型号 = productId;
  
  products[index] = updatedProduct;
  
  saveAllProducts(products);
  return updatedProduct;
}

/**
 * 删除产品
 * @param {string} productId 产品ID
 * @returns {boolean} 删除是否成功
 */
function deleteProduct(productId) {
  const products = getAllProducts();
  const filteredProducts = products.filter(p => 
    p.productId !== productId && p.型号 !== productId
  );
  
  if (filteredProducts.length === products.length) {
    throw new Error(`型号为 ${productId} 的产品不存在`);
  }
  
  return saveAllProducts(filteredProducts);
}

module.exports = {
  getAllProducts,
  saveAllProducts,
  getProductById,
  searchProducts,
  addProduct,
  updateProduct,
  deleteProduct
};