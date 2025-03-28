const Excel = require('exceljs');
const path = require('path');
const fs = require('fs-extra');
const { getAllProducts, saveAllProducts } = require('./productUtils');

// 临时目录路径
const tempDir = path.join(__dirname, '..', 'temp');
fs.ensureDirSync(tempDir);

/**
 * 从Excel文件导入产品
 * @param {string} filePath Excel文件路径
 * @returns {Object} 导入结果
 */
async function importProductsFromExcel(filePath) {
  try {
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    // 获取第一个工作表
    const worksheet = workbook.getWorksheet(1);
    
    // 获取标题行
    const headerRow = worksheet.getRow(1);
    const headers = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value;
    });
    
    console.log('Excel文件的列标题:', headers);
    
    // 检查是否有型号/款号/产品ID列
    // 扩展接受的字段名称列表
    const validIdFieldNames = ['productId', '产品ID', '款号', '型号', 'ID', 'id', '产品型号'];
    const productIdIndex = headers.findIndex(h => 
      h && validIdFieldNames.includes(h.toString().trim())
    );
    
    if (productIdIndex === -1) {
      // 如果找不到产品ID列，但存在第一列，则将第一列视为型号列
      if (headers.length > 0) {
        console.log('未找到标准的产品ID列，将使用第一列作为型号:', headers[0]);
        // 不抛出错误，继续处理，将第一列视为型号
      } else {
        throw new Error('Excel文件必须包含至少一列数据');
      }
    }
    
    // 读取现有产品
    const existingProducts = getAllProducts();
    const newProducts = [];
    let updatedCount = 0;
    
    // 从第二行开始读取数据
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      
      // 跳过空行
      if (row.cellCount === 0) continue;
      
      // 创建产品对象
      const product = {};
      
      // 读取每列数据
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          // 处理不同类型的值
          let value = cell.value;
          if (cell.type === Excel.ValueType.Date) {
            value = cell.value.toISOString().split('T')[0]; // 只保留日期部分
          }
          product[header] = value;
        }
      });
      
      // 确保产品有ID字段
      let productId;
      
      // 如果找到了有效的ID字段
      if (productIdIndex !== -1) {
        productId = product[headers[productIdIndex]];
      } else {
        // 否则使用第一列作为ID
        productId = product[headers[0]];
      }
      
      if (!productId) continue; // 跳过没有ID的行
      
      // 统一字段名称，确保同时有型号和productId字段
      product.productId = productId.toString();
      product.型号 = productId.toString();
      
      // 检查是否为更新现有产品
      const existingIndex = existingProducts.findIndex(p => 
        p.productId === product.productId || p.型号 === product.型号
      );
      
      if (existingIndex !== -1) {
        // 更新现有产品
        existingProducts[existingIndex] = product;
        updatedCount++;
      } else {
        // 添加新产品
        newProducts.push(product);
      }
    }
    
    // 合并新老产品
    const allProducts = [...existingProducts, ...newProducts];
    
    // 保存到JSON文件
    saveAllProducts(allProducts);
    
    // 清理上传的文件
    fs.unlinkSync(filePath);
    
    return {
      count: newProducts.length + updatedCount,
      newCount: newProducts.length,
      updatedCount: updatedCount
    };
  } catch (error) {
    // 确保清理上传的文件
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error('Excel导入错误:', error);
    throw error;
  }
}

/**
 * 导出产品到Excel文件
 * @returns {string} 导出的Excel文件路径
 */
async function exportProductsToExcel() {
  // 创建临时文件名
  const timestamp = new Date().getTime();
  const filePath = path.join(tempDir, `products_${timestamp}.xlsx`);
  
  // 读取产品数据
  const products = getAllProducts();
  
  // 如果没有产品，创建一个空模板
  if (products.length === 0) {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('产品');
    
    // 添加默认标题
    worksheet.columns = [
      { header: '型号', key: '型号', width: 15 },
      { header: '分类', key: '分类', width: 15 },
      { header: '价格', key: '价格', width: 15 },
      { header: '功能', key: '功能', width: 20 },
      { header: '颜色', key: '颜色', width: 15 },
      { header: '材质', key: '材质', width: 15 }
    ];
    
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }
  
  // 收集所有可能的字段
  const allFields = new Set();
  products.forEach(product => {
    Object.keys(product).forEach(key => allFields.add(key));
  });
  
  // 定义优先字段顺序
  const priorityFields = ['型号', '分类', '价格', '功能', '颜色', '材质'];
  
  // 排序字段：优先字段在前，其他按字母排序
  const fields = Array.from(allFields);
  fields.sort((a, b) => {
    const aIndex = priorityFields.indexOf(a);
    const bIndex = priorityFields.indexOf(b);
    
    // 如果两个字段都在优先列表中
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    
    // 如果只有a在优先列表中
    if (aIndex !== -1) return -1;
    
    // 如果只有b在优先列表中
    if (bIndex !== -1) return 1;
    
    // 否则按字母排序
    return a.localeCompare(b);
  });
  
  // 移除productId字段，使用型号代替
  if (fields.includes('productId') && fields.includes('型号')) {
    fields.splice(fields.indexOf('productId'), 1);
  }
  
  // 创建工作表
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet('产品');
  
  // 设置列
  worksheet.columns = fields.map(field => ({
    header: field,
    key: field,
    width: 15
  }));
  
  // 添加数据
  products.forEach(product => {
    const row = {};
    fields.forEach(field => {
      row[field] = product[field] !== undefined ? product[field] : '';
    });
    worksheet.addRow(row);
  });
  
  // 美化表格样式
  // 设置标题行样式
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFD700' } // 金色背景
  };
  
  // 设置边框
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
  
  // 写入文件
  await workbook.xlsx.writeFile(filePath);
  
  return filePath;
}

module.exports = {
  importProductsFromExcel,
  exportProductsToExcel
};