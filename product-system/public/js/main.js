document.addEventListener('DOMContentLoaded', () => {
  // 模态框相关元素
  const modal = document.getElementById('productModal');
  const closeBtn = modal && modal.querySelector('.close');
  const addProductBtn = document.getElementById('addProductBtn');
  const editBtns = document.querySelectorAll('.btn-edit');
  const deleteBtns = document.querySelectorAll('.btn-delete');
  const productForm = document.getElementById('productForm');
  const addFieldBtn = document.getElementById('addFieldBtn');
  
  // 编辑产品详情页面的按钮
  const editProductBtn = document.getElementById('editProductBtn');
  const deleteProductBtn = document.getElementById('deleteProductBtn');
  
  // 搜索框自动搜索功能
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = e.target.value.trim();
        // 只有在输入字符超过1个时才自动搜索
        if (query.length > 1) {
          // 构建URL
          const searchUrl = `/?q=${encodeURIComponent(query)}`;
          window.location.href = searchUrl;
        } else if (query.length === 0 && window.location.search) {
          // 如果搜索框为空，且URL有搜索参数，则返回主页
          window.location.href = '/';
        }
      }, 500); // 500ms延迟，避免频繁请求
    });
  }
  
  // 打开添加产品模态框
  if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
      // 重置表单
      if (productForm) {
        productForm.reset();
        document.getElementById('modalTitle').textContent = '添加产品';
        document.getElementById('productId').value = '';
        
        // 确保newProductId字段存在
        const newProductIdField = document.getElementById('newProductId');
        if (newProductIdField) {
          newProductIdField.disabled = false;
          newProductIdField.value = '';
        }
        
        // 清除动态字段
        const dynamicFields = document.getElementById('dynamicFields');
        if (dynamicFields) {
          dynamicFields.innerHTML = '';
        }
        
        // 显示模态框
        modal.style.display = 'block';
      }
    });
  }
  
  // 打开编辑产品模态框 (产品列表页)
  editBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const productId = btn.dataset.id;
      
      try {
        // 获取产品数据
        const response = await fetch(`/products/${productId}`);
        if (!response.ok) throw new Error('获取产品数据失败');
        
        // 尝试解析JSON响应
        let product;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          product = await response.json();
        } else {
          // 如果不是JSON响应，可能是重定向到详情页面
          // 在这种情况下，我们需要通过DOM从页面获取数据
          console.warn('Response was not JSON, attempting to fetch product data from page...');
          
          // 由于这种情况不常见，我们简单地重定向到产品详情页
          window.location.href = `/products/${productId}`;
          return;
        }
        
        // 填充表单
        document.getElementById('modalTitle').textContent = '编辑产品';
        document.getElementById('productId').value = productId;
        
        const newProductIdField = document.getElementById('newProductId');
        if (newProductIdField) {
          newProductIdField.value = productId;
          newProductIdField.disabled = true; // 禁用ID字段，防止修改
        }
        
        const nameField = document.getElementById('name');
        if (nameField) {
          nameField.value = product.name || '';
        }
        
        // 添加动态字段
        const dynamicFields = document.getElementById('dynamicFields');
        if (dynamicFields) {
          dynamicFields.innerHTML = '';
          
          Object.entries(product).forEach(([key, value]) => {
            if (key !== 'productId' && key !== 'name') {
              addFieldToForm(key, value);
            }
          });
        }
        
        // 显示模态框
        modal.style.display = 'block';
      } catch (error) {
        console.error('Error:', error);
        alert('获取产品数据失败: ' + error.message);
      }
    });
  });
  
  // 产品详情页的编辑按钮
  if (editProductBtn) {
    editProductBtn.addEventListener('click', () => {
      modal.style.display = 'block';
    });
  }
  
  // 删除产品 (列表页)
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const productId = btn.dataset.id;
      
      if (confirm(`确定要删除产品 ${productId} 吗？此操作不可撤销。`)) {
        try {
          const response = await fetch(`/products/${productId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) throw new Error('删除产品失败');
          
          // 删除成功，刷新页面
          window.location.reload();
        } catch (error) {
          console.error('Error:', error);
          alert('删除产品失败: ' + error.message);
        }
      }
    });
  });
  
  // 产品详情页的删除按钮
  if (deleteProductBtn) {
    deleteProductBtn.addEventListener('click', async () => {
      const productId = deleteProductBtn.dataset.id;
      
      if (confirm(`确定要删除此产品吗？此操作不可撤销。`)) {
        try {
          const response = await fetch(`/products/${productId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) throw new Error('删除产品失败');
          
          // 删除成功，返回列表页
          window.location.href = '/';
        } catch (error) {
          console.error('Error:', error);
          alert('删除产品失败: ' + error.message);
        }
      }
    });
  }
  
  // 添加字段按钮
  if (addFieldBtn) {
    addFieldBtn.addEventListener('click', () => {
      addFieldToForm();
    });
  }
  
  // 关闭模态框
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
  
  // 点击模态框外部关闭
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // 提交表单
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        // 构建产品数据
        const productData = {};
        
        // 获取基本字段
        const productId = document.getElementById('productId').value || 
                          document.getElementById('newProductId').value;
                          
        if (!productId) {
          alert('产品款号不能为空');
          return;
        }
        
        // 设置产品ID
        productData.productId = productId;
        
        // 获取产品名称
        const nameField = document.getElementById('name');
        if (nameField && nameField.value.trim()) {
          productData.name = nameField.value.trim();
        }
        
        // 获取所有自定义字段
        const fieldGroups = document.querySelectorAll('.field-group');
        fieldGroups.forEach(group => {
          const inputs = group.querySelectorAll('input');
          if (inputs.length >= 2) {
            const fieldName = inputs[0].value.trim();
            const fieldValue = inputs[1].value.trim();
            
            if (fieldName && fieldValue) {
              productData[fieldName] = fieldValue;
            }
          }
        });
        
        // 确定使用哪个API端点
        let url = '/products';
        let method = 'POST';
        
        // 如果是编辑模式
        if (document.getElementById('productId').value) {
          url = `/products/${document.getElementById('productId').value}`;
          method = 'PUT';
        }
        
        // 发送API请求
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error ${response.status}: ${errorText}`);
        }
        
        // 成功，关闭模态框
        modal.style.display = 'none';
        
        // 显示成功消息
        alert(method === 'POST' ? '产品添加成功！' : '产品更新成功！');
        
        // 重新加载页面以显示更新
        window.location.reload();
      } catch (error) {
        console.error('Error saving product:', error);
        alert('保存产品失败: ' + error.message);
      }
    });
  }
  
  // 动态添加字段到表单
  function addFieldToForm(key = '', value = '') {
    const dynamicFields = document.getElementById('dynamicFields');
    if (!dynamicFields) return;
    
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'form-group field-group';
    
    // 创建字段名输入框
    const fieldNameInput = document.createElement('input');
    fieldNameInput.type = 'text';
    fieldNameInput.placeholder = '字段名称';
    fieldNameInput.value = key;
    fieldNameInput.required = false;
    
    // 创建字段值输入框
    const fieldValueInput = document.createElement('input');
    fieldValueInput.type = 'text';
    fieldValueInput.placeholder = '字段值';
    fieldValueInput.value = value;
    fieldValueInput.required = false;
    
    // 创建删除按钮
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-field';
    removeButton.innerHTML = '&times;';
    removeButton.addEventListener('click', () => {
      dynamicFields.removeChild(fieldGroup);
    });
    
    // 添加到字段组
    fieldGroup.appendChild(fieldNameInput);
    fieldGroup.appendChild(fieldValueInput);
    fieldGroup.appendChild(removeButton);
    
    // 添加到动态字段容器
    dynamicFields.appendChild(fieldGroup);
  }
  
  // 初始化删除自定义字段的事件
  document.querySelectorAll('.remove-field').forEach(btn => {
    btn.addEventListener('click', function() {
      this.parentElement.remove();
    });
  });
});