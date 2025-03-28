// 自动搜索功能
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-input');
    
    if (searchInput) {
      let searchTimeout;
      
      // 监听输入变化
      searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        
        // 300ms延迟，避免每次按键都搜索
        searchTimeout = setTimeout(() => {
          const query = this.value.trim();
          
          // 构建查询URL
          const searchUrl = `/?q=${encodeURIComponent(query)}`;
          
          // 使用fetch进行AJAX搜索，避免整页刷新
          fetch(searchUrl)
            .then(response => response.text())
            .then(html => {
              // 提取结果部分
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              const productsGrid = doc.querySelector('.products-grid');
              const productsCount = doc.querySelector('.products-header h2');
              
              // 更新结果
              if (productsGrid) {
                document.querySelector('.products-grid').innerHTML = productsGrid.innerHTML;
                document.querySelector('.products-header h2').innerHTML = productsCount.innerHTML;
                
                // 重新绑定事件
                bindCardEvents();
              } else {
                // 如果没有结果或结果为空
                const noProducts = doc.querySelector('.no-products');
                if (noProducts) {
                  const container = document.querySelector('.products-grid') || document.createElement('div');
                  container.innerHTML = noProducts.outerHTML;
                  document.querySelector('.products-section').appendChild(container);
                }
              }
              
              // 更新URL，但不刷新页面
              window.history.pushState({}, '', searchUrl);
            })
            .catch(error => {
              console.error('搜索错误:', error);
            });
        }, 300);
      });
      
      // 防止表单提交导致页面刷新
      const searchForm = document.querySelector('.search-form');
      if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const query = searchInput.value.trim();
          window.location.href = `/?q=${encodeURIComponent(query)}`;
        });
      }
    }
    
    // 初始绑定事件
    bindCardEvents();
  });
  
  // 绑定卡片事件函数
  function bindCardEvents() {
    // 绑定编辑按钮事件
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', handleEditButtonClick);
    });
    
    // 绑定删除按钮事件
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', handleDeleteButtonClick);
    });
    
    // 绑定展开/收起按钮事件
    document.querySelectorAll('.expand-button').forEach(btn => {
      btn.addEventListener('click', function() {
        const card = this.closest('.product-card');
        const attributes = card.querySelectorAll('.product-attribute:not(.highlight)');
        
        if (this.dataset.expanded === 'true') {
          // 收起卡片
          attributes.forEach(attr => {
            attr.classList.add('product-attribute-collapsed');
          });
          this.textContent = '展开更多 ▼';
          this.dataset.expanded = 'false';
        } else {
          // 展开卡片
          attributes.forEach(attr => {
            attr.classList.remove('product-attribute-collapsed');
          });
          this.textContent = '收起 ▲';
          this.dataset.expanded = 'true';
        }
      });
    });
  }
  
  // 处理编辑按钮点击
  function handleEditButtonClick(e) {
    e.preventDefault();
    const productId = this.dataset.id;
    // 复用main.js中的编辑逻辑
    if (typeof openEditModal === 'function') {
      openEditModal(productId);
    } else {
      // 兼容旧代码
      fetch(`/products/${productId}`)
        .then(response => {
          if (response.ok) return response.json();
          throw new Error('获取产品数据失败');
        })
        .then(product => {
          const modal = document.getElementById('productModal');
          if (modal) {
            document.getElementById('modalTitle').textContent = '编辑产品';
            document.getElementById('productId').value = productId;
            
            const newProductIdField = document.getElementById('newProductId');
            if (newProductIdField) {
              newProductIdField.value = productId;
              newProductIdField.disabled = true;
            }
            
            document.getElementById('name').value = product.name || '';
            
            // 填充其他字段
            // ...
            
            modal.style.display = 'block';
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('获取产品数据失败');
        });
    }
  }
  
  // 处理删除按钮点击
  function handleDeleteButtonClick(e) {
    e.preventDefault();
    const productId = this.dataset.id;
    
    if (confirm(`确定要删除产品 ${productId} 吗？此操作不可撤销。`)) {
      fetch(`/products/${productId}`, {
        method: 'DELETE'
      })
      .then(response => {
        if (!response.ok) throw new Error('删除产品失败');
        
        // 直接从DOM中移除对应卡片，无需刷新页面
        const card = this.closest('.product-card');
        card.remove();
        
        // 更新产品计数
        const countElement = document.querySelector('.products-header h2');
        if (countElement) {
          const currentCount = countElement.textContent.match(/\d+/);
          if (currentCount) {
            const newCount = parseInt(currentCount[0]) - 1;
            countElement.textContent = countElement.textContent.replace(/\d+/, newCount);
          }
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('删除产品失败');
      });
    }
  }