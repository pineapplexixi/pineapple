// 即时搜索功能 - 直接修改DOM而不刷新页面
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-input');
    
    if (searchInput) {
      let searchTimeout;
      let allProducts = []; // 存储所有产品数据
      
      // 首次加载时获取所有产品
      fetch('/api/products')
        .then(response => response.json())
        .then(products => {
          allProducts = products;
        })
        .catch(error => {
          console.error('加载产品数据失败:', error);
        });
      
      // 监听输入变化
      searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        
        // 200ms延迟，提供更快的响应
        searchTimeout = setTimeout(() => {
          const query = this.value.trim().toLowerCase();
          
          // 客户端过滤数据
          if (allProducts.length > 0) {
            filterProductsClient(query, allProducts);
          } else {
            // 如果客户端数据不可用，使用服务器过滤
            filterProductsServer(query);
          }
        }, 200);
      });
      
      // 防止表单提交导致页面刷新
      const searchForm = document.querySelector('.search-form');
      if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const query = searchInput.value.trim();
          if (query) {
            filterProductsServer(query);
          }
        });
      }
    }
    
    // 初始绑定事件
    bindCardEvents();
  });
  
  // 客户端过滤产品（更快）
  function filterProductsClient(query, products) {
    const container = document.querySelector('.products-grid');
    if (!container) return;
    
    // 清空现有产品
    container.innerHTML = '';
    
    // 如果查询为空，显示所有产品
    if (!query) {
      renderProducts(products);
      updateProductCount(products.length);
      return;
    }
    
    // 过滤匹配的产品
    const filteredProducts = products.filter(product => {
      return Object.entries(product).some(([key, value]) => {
        if (!value) return false;
        return value.toString().toLowerCase().includes(query);
      });
    });
    
    // 显示过滤后的产品
    if (filteredProducts.length > 0) {
      renderProducts(filteredProducts);
    } else {
      container.innerHTML = `<div class="no-products"><p>未找到产品与 "${query}" 匹配</p></div>`;
    }
    
    // 更新产品计数
    updateProductCount(filteredProducts.length);
  }
  
  // 服务器过滤产品（备用方案）
  function filterProductsServer(query) {
    const searchUrl = query ? `/?q=${encodeURIComponent(query)}` : '/';
    
    fetch(searchUrl)
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 提取产品网格
        const productsGrid = doc.querySelector('.products-grid');
        
        if (productsGrid) {
          // 更新产品网格
          document.querySelector('.products-grid').innerHTML = productsGrid.innerHTML;
          
          // 更新产品计数
          const countElement = doc.querySelector('.products-header h2');
          if (countElement) {
            document.querySelector('.products-header h2').innerHTML = countElement.innerHTML;
          }
          
          // 重新绑定事件
          bindCardEvents();
        }
      })
      .catch(error => {
        console.error('搜索错误:', error);
      });
  }
  
  // 渲染产品到DOM
  function renderProducts(products) {
    const container = document.querySelector('.products-grid');
    if (!container) return;
    
    products.forEach(product => {
      // 创建产品卡片
      const card = createProductCard(product);
      container.appendChild(card);
    });
    
    // 重新绑定事件
    bindCardEvents();
  }
  
  // 创建产品卡片HTML
  function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.productId || product.型号;
    
    // 产品ID（型号）
    const productId = product.型号 || product.productId || '未知型号';
    
    // 分类
    const category = product.分类 || product.类别 || product.category || '';
    
    // 价格
    const price = product.价格 || '';
    
    // 构建卡片内容
    card.innerHTML = `
      <div class="product-header">
        <h3 class="product-title">
          ${productId}
          ${category ? `<span class="product-category-badge">${category}</span>` : ''}
        </h3>
        <span class="product-id">型号: ${productId}</span>
      </div>
      <div class="product-body">
        ${category ? `
          <div class="product-attribute highlight">
            <span class="attribute-name">分类:</span>
            <span class="attribute-value">${category}</span>
          </div>
        ` : ''}
        
        ${price ? `
          <div class="product-attribute highlight price">
            <span class="attribute-name">价格:</span>
            <span class="attribute-value">${price}</span>
          </div>
        ` : ''}
        
        ${renderAttributes(product)}
      </div>
      <div class="product-footer">
        <a href="/products/${productId}" class="btn btn-view">查看</a>
        <button class="btn btn-edit" data-id="${productId}">编辑</button>
        <button class="btn btn-delete" data-id="${productId}">删除</button>
      </div>
    `;
    
    return card;
  }
  
  // 渲染产品属性
  function renderAttributes(product) {
    // 跳过这些字段
    const skipFields = ['productId', '型号', '分类', '类别', 'category', '价格', 'name'];
    
    // 提取其他字段
    const attributes = Object.entries(product)
      .filter(([key, value]) => !skipFields.includes(key) && value);
    
    if (attributes.length === 0) return '';
    
    let html = '';
    attributes.forEach(([key, value], index) => {
      html += `
        <div class="product-attribute product-attribute-flat">
          <span class="attribute-name">${key}:</span>
          <span class="attribute-value">${value}</span>
        </div>
      `;
    });
    
    return html;
  }
  
  // 更新产品计数
  function updateProductCount(count) {
    const countElement = document.querySelector('.products-header h2');
    if (countElement) {
      countElement.textContent = `产品列表 (${count})`;
    }
  }
  
  // 绑定卡片事件函数
  function bindCardEvents() {
    // 绑定编辑按钮事件
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const productId = this.dataset.id;
        
        // 打开编辑模态框
        openEditModal(productId);
      });
    });
    
    // 绑定删除按钮事件
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const productId = this.dataset.id;
        
        if (confirm(`确定要删除产品 ${productId} 吗？此操作不可撤销。`)) {
          deleteProduct(productId);
        }
      });
    });
  }
  
  // 打开编辑模态框
  function openEditModal(productId) {
    fetch(`/products/${productId}`)
      .then(response => {
        // 检查响应类型
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return response.json();
        } else {
          // 如果不是JSON，改为重定向
          window.location.href = `/products/${productId}`;
          throw new Error('重定向到产品详情页');
        }
      })
      .then(product => {
        const modal = document.getElementById('productModal');
        if (!modal) return;
        
        document.getElementById('modalTitle').textContent = '编辑产品';
        document.getElementById('productId').value = productId;
        
        const newProductIdField = document.getElementById('newProductId');
        if (newProductIdField) {
          newProductIdField.value = productId;
          newProductIdField.disabled = true;
        }
        
        // 填充分类字段
        const categoryField = document.getElementById('category');
        if (categoryField) {
          categoryField.value = product.分类 || product.类别 || product.category || '';
        }
        
        // 填充价格字段
        const priceField = document.getElementById('price');
        if (priceField) {
          priceField.value = product.价格 || '';
        }
        
        // 清除动态字段
        const dynamicFields = document.getElementById('dynamicFields');
        if (dynamicFields) {
          dynamicFields.innerHTML = '';
          
          // 添加其他字段
          Object.entries(product).forEach(([key, value]) => {
            if (!['productId', '型号', '分类', '类别', 'category', '价格'].includes(key) && value) {
              // 创建字段组
              const fieldGroup = document.createElement('div');
              fieldGroup.className = 'form-group field-group';
              
              // 创建字段名输入
              const fieldNameInput = document.createElement('input');
              fieldNameInput.type = 'text';
              fieldNameInput.value = key;
              fieldNameInput.placeholder = '字段名称';
              
              // 创建字段值输入
              const fieldValueInput = document.createElement('input');
              fieldValueInput.type = 'text';
              fieldValueInput.value = value;
              fieldValueInput.placeholder = '字段值';
              
              // 创建删除按钮
              const removeBtn = document.createElement('button');
              removeBtn.type = 'button';
              removeBtn.className = 'remove-field';
              removeBtn.innerHTML = '&times;';
              removeBtn.addEventListener('click', function() {
                fieldGroup.remove();
              });
              
              // 组合字段组
              fieldGroup.appendChild(fieldNameInput);
              fieldGroup.appendChild(fieldValueInput);
              fieldGroup.appendChild(removeBtn);
              
              // 添加到容器
              dynamicFields.appendChild(fieldGroup);
            }
          });
        }
        
        // 显示模态框
        modal.style.display = 'block';
      })
      .catch(error => {
        if (error.message !== '重定向到产品详情页') {
          console.error('获取产品数据失败:', error);
          alert('获取产品数据失败: ' + error.message);
        }
      });
  }
  
  // 删除产品
  function deleteProduct(productId) {
    fetch(`/products/${productId}`, {
      method: 'DELETE'
    })
      .then(response => {
        if (!response.ok) throw new Error('删除产品失败');
        
        // 从DOM中移除卡片
        const card = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (card) {
          card.remove();
          
          // 更新计数
          const countElement = document.querySelector('.products-header h2');
          if (countElement) {
            const match = countElement.textContent.match(/\d+/);
            if (match) {
              const newCount = parseInt(match[0]) - 1;
              countElement.textContent = countElement.textContent.replace(/\d+/, newCount);
            }
          }
        }
      })
      .catch(error => {
        console.error('删除失败:', error);
        alert('删除产品失败: ' + error.message);
      });
  }