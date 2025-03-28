/**
 * ============================
 * 菠萝利润计算器 JavaScript
 * 版本：1.0
 * 主要功能：
 * 1. 产品数据管理
 * 2. 利润计算
 * 3. 与服务器API交互
 * 4. 侧边栏注意事项面板
 * ============================
 */

// ============= 【1. 全局变量和常量定义】=============
// 产品数据存储 - 所有产品信息会保存在这个对象中，格式为：{产品ID: 成本}
let productData = {};

// 当前正在编辑的产品ID - 用于记录用户正在编辑哪个产品
let currentEditProduct = '';

// 数据API路径 - 服务器上存储和获取数据的地址
// 注意: 如果遇到连接问题，可能需要修改这个路径
const API_URL = './data_api.php';  // 默认为网站根目录下的data_api.php将代码中的API路径从绝对路径改为相对路径

// ============= 【2. 初始化和主要事件设置】=============
// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', function() {
    // 从服务器加载数据
    loadServerData();
    
    // 设置各种按钮和输入框的事件监听
    initEvents();
    
    // 检查并记录初始化完成
    console.log('页面初始化完成，开始加载数据...');
});

// ============= 【3. 数据加载功能】=============
/**
 * 从服务器加载数据
 * 这个函数会尝试从服务器获取产品数据，如果失败则尝试从本地存储读取
 */
async function loadServerData() {
    try {
        // 显示加载中的状态，在表格中显示旋转的加载图标
        const tableBody = document.getElementById('productsTableBody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: var(--pineapple-yellow);"></i>
                    <p style="margin-top: 10px;">正在加载数据...</p>
                </td>
            </tr>
        `;
        
        console.log('开始从服务器获取数据，API路径:', API_URL);
        
        // 发送请求到服务器获取数据
        const response = await fetch(API_URL);
        
        // 检查服务器响应是否正常
        if (!response.ok) {
            console.error('服务器响应异常:', response.status, response.statusText);
            throw new Error('服务器错误: ' + response.status);
        }
        
        // 解析服务器返回的JSON数据
        const data = await response.json();
        console.log('服务器数据获取成功，产品数量:', Object.keys(data).length);
        
        // 更新产品数据
        productData = data;
        
        // 更新产品表格显示
        updateProductTable();
        
        // 更新连接状态为在线
        updateConnectionStatus(true);
        
        // 显示成功提示
        showToast('数据已从服务器加载', 'success');
    } catch (error) {
        // 如果出错，记录错误并显示提示
        console.error('加载服务器数据失败:', error);
        
        // 添加更详细的错误信息
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.error('可能是服务器未运行或网络问题');
            showToast('无法连接到服务器，请检查PHP服务是否运行', 'error');
        } else if (error.name === 'SyntaxError') {
            console.error('JSON解析错误，服务器返回的可能不是有效JSON');
            showToast('服务器返回格式错误，请检查PHP响应', 'error');
        } else {
            showToast('加载服务器数据失败: ' + error.message, 'error');
        }
        
        // 更新连接状态为离线
        updateConnectionStatus(false);
        
        // 尝试从本地存储加载数据作为备份
        tryLoadFromLocalStorage();
    }
}

/**
 * 更新连接状态指示器
 * @param {boolean} isOnline - 是否在线
 */
function updateConnectionStatus(isOnline) {
    const statusIndicator = document.getElementById('connectionStatus');
    const statusText = document.getElementById('connectionText');
    
    if (isOnline) {
        statusIndicator.className = 'status-indicator status-online';
        statusText.textContent = '在线模式';
    } else {
        statusIndicator.className = 'status-indicator status-offline';
        statusText.textContent = '离线模式';
    }
}

/**
 * 尝试从本地存储加载数据
 * 当无法连接服务器时，可以从浏览器本地存储读取之前保存的数据
 */
function tryLoadFromLocalStorage() {
    try {
        console.log('尝试从本地存储加载数据...');
        // 从localStorage读取数据
        const savedData = localStorage.getItem('pineappleCalcData');
        if (savedData) {
            // 转换为JavaScript对象
            productData = JSON.parse(savedData);
            console.log('本地数据加载成功，产品数量:', Object.keys(productData).length);
            // 更新表格显示
            updateProductTable();
            // 显示提示
            showToast('已从本地存储加载数据（离线模式）', 'success');
        } else {
            console.log('未找到本地存储的数据');
            // 如果没有找到本地存储的数据，显示空表格
            updateProductTable();
        }
    } catch (error) {
        // 如果读取本地存储出错，记录错误并显示空表格
        console.error('加载本地数据失败:', error);
        updateProductTable();
    }
}

// ============= 【4. 数据保存功能】=============
/**
 * 保存数据到服务器
 * 将当前的产品数据保存到服务器，如果失败则保存到本地存储
 * @returns {Promise<boolean>} 保存是否成功
 */
async function saveToServer() {
    try {
        console.log('开始保存数据到服务器...');
        // 发送POST请求将数据保存到服务器
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        // 检查服务器响应是否正常
        if (!response.ok) {
            console.error('服务器保存响应异常:', response.status, response.statusText);
            throw new Error('服务器错误: ' + response.status);
        }
        
        // 解析服务器返回的结果
        const result = await response.json();
        
        if (result.status === 'success') {
            console.log('服务器保存成功');
            // 更新连接状态为在线
            updateConnectionStatus(true);
            // 如果服务器保存成功，同时也保存到本地存储作为备份
            localStorage.setItem('pineappleCalcData', JSON.stringify(productData));
            return true;
        } else {
            console.error('服务器返回错误:', result.message);
            throw new Error(result.message || '保存失败');
        }
    } catch (error) {
        // 如果服务器保存失败，尝试保存到本地存储
        console.error('保存到服务器失败:', error);
        
        // 更新连接状态为离线
        updateConnectionStatus(false);
        
        try {
            localStorage.setItem('pineappleCalcData', JSON.stringify(productData));
            console.log('数据已保存到本地存储');
            showToast('无法连接到服务器，数据已保存到本地（离线模式）', 'error');
            return true;
        } catch (localError) {
            console.error('保存到本地存储失败:', localError);
            return false;
        }
    }
}

// ============= 【5. 事件初始化】=============
/**
 * 初始化所有事件监听器
 * 设置网页中各种按钮、输入框等元素的交互行为
 */
function initEvents() {
    console.log('初始化事件监听器...');
    
    // ==== 标签页切换按钮事件 ====
    // 点击"售价计算利润"标签
    document.getElementById('priceTabBtn').addEventListener('click', function() {
        switchTab('price');
    });
    
    // 点击"加成率计算售价"标签
    document.getElementById('rateTabBtn').addEventListener('click', function() {
        switchTab('rate');
    });
    
    // 点击"利润率计算售价"标签
    document.getElementById('marginTabBtn').addEventListener('click', function() {
        switchTab('margin');
    });
    
    // ==== 产品搜索和过滤 ====
    // 在产品列表中搜索产品
    document.getElementById('productSearch').addEventListener('input', function() {
        const searchTerm = this.value.trim().toLowerCase();
        filterProductTable(searchTerm);
    });
    
    // ==== 添加产品相关事件 ====
    // 点击添加产品按钮
    document.getElementById('addProductBtn').addEventListener('click', addProduct);
    // 在成本输入框中按回车键也可以添加产品
    document.getElementById('newProductCost').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addProduct();
    });
    
    // ==== 数据管理相关事件 ====
    // 保存按钮点击事件
    document.getElementById('saveBtn').addEventListener('click', async function() {
        // 显示保存中状态
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
        
        const success = await saveToServer();
        
        // 恢复按钮状态
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-save"></i> 保存';
        
        if (success) {
            showToast('数据已保存', 'success');
        } else {
            showToast('保存数据失败', 'error');
        }
    });
    
    // 导入按钮点击事件 - 打开导入模态框
    document.getElementById('importBtn').addEventListener('click', function() {
        openModal('importModal');
    });
    
    // 导出按钮点击事件 - 打开导出模态框并填充数据
    document.getElementById('exportBtn').addEventListener('click', function() {
        document.getElementById('exportData').value = JSON.stringify(productData, null, 2);
        openModal('exportModal');
    });
    
    // ==== 模态框按钮相关事件 ====
    // 关闭编辑模态框
    document.getElementById('closeEditModal').addEventListener('click', function() {
        closeModal('editModal');
    });
    
    // 关闭导入模态框
    document.getElementById('closeImportModal').addEventListener('click', function() {
        closeModal('importModal');
    });
    
    // 关闭导出模态框
    document.getElementById('closeExportModal').addEventListener('click', function() {
        closeModal('exportModal');
    });
    
    // 取消编辑按钮
    document.getElementById('cancelEdit').addEventListener('click', function() {
        closeModal('editModal');
    });
    
    // 取消导入按钮
    document.getElementById('cancelImport').addEventListener('click', function() {
        closeModal('importModal');
    });
    
    // 取消导出按钮
    document.getElementById('cancelExport').addEventListener('click', function() {
        closeModal('exportModal');
    });
    
    // 保存编辑按钮
    document.getElementById('saveEdit').addEventListener('click', saveProductEdit);
    
    // 确认导入按钮
    document.getElementById('confirmImport').addEventListener('click', importData);
    
    // 复制导出数据按钮
    document.getElementById('copyExport').addEventListener('click', function() {
        const exportData = document.getElementById('exportData');
        exportData.select();
        document.execCommand('copy');
        showToast('数据已复制到剪贴板', 'success');
    });
    
    // ==== 计算器输入事件 ====
    // 售价输入框变化时计算利润
    document.getElementById('priceInput').addEventListener('input', calculateProfit);
    // 成本输入框变化时计算利润
    document.getElementById('costInput').addEventListener('input', calculateProfit);
    
    // 目标加成率输入框变化时计算售价
    document.getElementById('targetRateInput').addEventListener('input', calculatePrice);
    // 加成率计算中的成本输入框变化时计算售价
    document.getElementById('rateCostInput').addEventListener('input', calculatePrice);
    
    // 目标利润率输入框变化时计算售价
    document.getElementById('targetMarginInput').addEventListener('input', calculatePriceFromMargin);
    // 利润率计算中的成本输入框变化时计算售价
    document.getElementById('marginCostInput').addEventListener('input', calculatePriceFromMargin);
    
    // ==== 产品搜索框输入事件 ====
    // 售价计算利润标签页中的产品输入框
    document.getElementById('productInput').addEventListener('input', function() {
        searchProduct(this.value, 'price');
    });
    
    // 加成率计算售价标签页中的产品输入框
    document.getElementById('productRateInput').addEventListener('input', function() {
        searchProduct(this.value, 'rate');
    });
    
    // 利润率计算售价标签页中的产品输入框
    document.getElementById('productMarginInput').addEventListener('input', function() {
        searchProduct(this.value, 'margin');
    });
    
    // ==== 点击外部关闭搜索结果 ====
    document.addEventListener('click', function(e) {
        // 如果点击的不是产品搜索框或搜索结果，则关闭搜索结果列表
        if (!e.target.closest('#productInput') && !e.target.closest('#priceSearchResults')) {
            document.getElementById('priceSearchResults').classList.remove('active');
        }
        
        if (!e.target.closest('#productRateInput') && !e.target.closest('#rateSearchResults')) {
            document.getElementById('rateSearchResults').classList.remove('active');
        }
        
        if (!e.target.closest('#productMarginInput') && !e.target.closest('#marginSearchResults')) {
            document.getElementById('marginSearchResults').classList.remove('active');
        }
    });
    
    // ==== 点击外部关闭模态框 ====
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    // ==== 刷新按钮事件 ====
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadServerData();
    });
    
    // ==== 侧边注意事项面板交互 ====
    const sidePanel = document.getElementById('sideNotesPanel');
    const sideTab = sidePanel.querySelector('.side-notes-tab');
    const closeBtn = sidePanel.querySelector('.notes-close');
    
    // 点击标签展开面板
    sideTab.addEventListener('click', function() {
        // 切换展开/折叠状态
        sidePanel.classList.toggle('expanded');
        // 保存状态到本地存储，下次访问时恢复
        localStorage.setItem('notesExpanded', sidePanel.classList.contains('expanded'));
    });
    
    // 点击关闭按钮收起面板
    closeBtn.addEventListener('click', function() {
        sidePanel.classList.remove('expanded');
        // 保存状态到本地存储
        localStorage.setItem('notesExpanded', 'false');
    });
    
    // 恢复上次的展开/折叠状态
    const wasExpanded = localStorage.getItem('notesExpanded') === 'true';
    if (wasExpanded) {
        sidePanel.classList.add('expanded');
    }
    
    console.log('事件监听器初始化完成');
}

// ============= 【6. 界面交互功能】=============
/**
 * 切换标签页
 * 在"售价计算利润"、"加成率计算售价"和"利润率计算售价"三个标签页之间切换
 * @param {string} tab - 标签页标识('price'、'rate'或'margin')
 */
function switchTab(tab) {
    console.log('切换到标签页:', tab);
    // 获取所有标签页ID
    const tabs = ['price', 'rate', 'margin'];
    
    // 先移除所有标签页的active状态
    tabs.forEach(t => {
        document.getElementById(`${t}TabBtn`).classList.remove('active');
        document.getElementById(`${t}Tab`).classList.remove('active');
    });
    
    // 给选中的标签页添加active状态
    document.getElementById(`${tab}TabBtn`).classList.add('active');
    document.getElementById(`${tab}Tab`).classList.add('active');
}

/**
 * 更新产品表格
 * 根据当前productData显示所有产品
 */
function updateProductTable() {
    console.log('更新产品表格...');
    const tableBody = document.getElementById('productsTableBody');
    tableBody.innerHTML = '';
    
    // 如果没有产品数据，显示空状态
    if (Object.keys(productData).length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <p>暂无产品数据<br>请添加新产品或导入数据</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // 对产品按名称字母顺序排序
    const sortedProducts = Object.entries(productData).sort((a, b) => a[0].localeCompare(b[0]));
    
    // 遍历所有产品，创建表格行
    for (const [id, cost] of sortedProducts) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${id}</td>
            <td>¥${cost.toFixed(2)}</td>
            <td>
                <div class="product-actions">
                    <button class="product-btn select-btn" title="选择此产品"><i class="fas fa-check"></i></button>
                    <button class="product-btn edit-btn" title="编辑产品"><i class="fas fa-edit"></i></button>
                    <button class="product-btn delete-btn" title="删除产品"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        
        // 选择按钮点击事件 - 将产品信息填充到当前激活的计算器标签页
        row.querySelector('.select-btn').addEventListener('click', function() {
            const activeTab = document.querySelector('.tab-content.active').id;
            if (activeTab === 'priceTab') {
                selectProduct(id, cost);
            } else if (activeTab === 'rateTab') {
                selectRateProduct(id, cost);
            } else if (activeTab === 'marginTab') {
                selectMarginProduct(id, cost);
            }
        });
        
        // 编辑按钮点击事件 - 打开编辑模态框
        row.querySelector('.edit-btn').addEventListener('click', function() {
            openEditModal(id, cost);
        });
        
        // 删除按钮点击事件 - 删除产品(先确认)
        row.querySelector('.delete-btn').addEventListener('click', function() {
            if (confirm(`确定要删除产品 "${id}" 吗？`)) {
                deleteProduct(id);
            }
        });
        
        tableBody.appendChild(row);
    }
}

/**
 * 按搜索条件过滤产品表格
 * 在左侧产品库中根据输入的搜索词筛选产品
 * @param {string} searchTerm - 搜索关键词
 */
function filterProductTable(searchTerm) {
    const rows = document.getElementById('productsTableBody').querySelectorAll('tr');
    
    // 如果表格为空或只有空状态行，则不处理
    if (!rows.length || rows[0].querySelector('.empty-state')) {
        return;
    }
    
    let hasMatch = false;
    
    // 遍历所有行，隐藏不匹配的行
    rows.forEach(row => {
        const productId = row.cells[0].textContent.toLowerCase();
        
        if (productId.includes(searchTerm)) {
            row.style.display = '';
            hasMatch = true;
        } else {
            row.style.display = 'none';
        }
    });
    
    // 如果没有匹配项，显示无结果提示
    if (!hasMatch) {
        const tableBody = document.getElementById('productsTableBody');
        if (tableBody.querySelector('.no-results')) {
            tableBody.querySelector('.no-results').style.display = '';
        } else {
            const noResultsRow = document.createElement('tr');
            noResultsRow.className = 'no-results';
            noResultsRow.innerHTML = `
                <td colspan="3">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>未找到匹配的产品</p>
                    </div>
                </td>
            `;
            tableBody.appendChild(noResultsRow);
        }
    } else {
        // 如果有匹配项，隐藏无结果提示
        const noResults = document.querySelector('.no-results');
        if (noResults) {
            noResults.style.display = 'none';
        }
    }
}

// ============= 【7. 模态框和弹窗功能】=============
/**
 * 打开编辑产品对话框
 * @param {string} productId - 产品ID
 * @param {number} cost - 产品成本
 */
function openEditModal(productId, cost) {
    // 填充编辑框中的产品信息
    document.getElementById('editProductId').value = productId;
    document.getElementById('editProductCost').value = cost.toFixed(2);
    // 记录当前编辑的产品ID
    currentEditProduct = productId;
    // 打开编辑模态框
    openModal('editModal');
}

/**
 * 保存产品编辑
 * 将编辑模态框中修改的产品成本保存到产品数据中
 */
async function saveProductEdit() {
    const productId = document.getElementById('editProductId').value;
    const costStr = document.getElementById('editProductCost').value;
    const newCost = parseFloat(costStr);
    
    // 验证输入的成本是否有效
    if (!costStr || isNaN(newCost) || newCost < 0) {
        showToast('请输入有效的成本', 'error');
        return;
    }
    
    // 更新产品成本
    productData[productId] = newCost;
    
    // 更新表格
    updateProductTable();
    
    // 如果当前正在计算该产品，更新输入框
    const priceProductInput = document.getElementById('productInput');
    const rateProductInput = document.getElementById('productRateInput');
    const marginProductInput = document.getElementById('productMarginInput');
    
    // 更新"售价计算利润"标签页中的成本
    if (priceProductInput.value === productId) {
        document.getElementById('costInput').value = newCost.toFixed(2);
        calculateProfit();
    }
    
    // 更新"加成率计算售价"标签页中的成本
    if (rateProductInput.value === productId) {
        document.getElementById('rateCostInput').value = newCost.toFixed(2);
        calculatePrice();
    }
    
    // 更新"利润率计算售价"标签页中的成本
    if (marginProductInput.value === productId) {
        document.getElementById('marginCostInput').value = newCost.toFixed(2);
        calculatePriceFromMargin();
    }
    
    // 保存数据到服务器
    const success = await saveToServer();
    
    // 关闭对话框并显示提示
    closeModal('editModal');
    
    if (success) {
        showToast(`已更新产品 ${productId} 的成本`, 'success');
    } else {
        showToast(`产品 ${productId} 已在本地更新，但未保存到服务器`, 'error');
    }
}

/**
 * 打开模态框
 * @param {string} modalId - 要打开的模态框ID
 */
function openModal(modalId) {
    // 给模态框添加active类，使其显示
    document.getElementById(modalId).classList.add('active');
}

/**
 * 关闭模态框
 * @param {string} modalId - 要关闭的模态框ID
 */
function closeModal(modalId) {
    // 移除模态框的active类，使其隐藏
    document.getElementById(modalId).classList.remove('active');
}

/**
 * 显示提示消息
 * 在页面底部显示一个临时的提示信息
 * @param {string} message - 提示信息内容
 * @param {string} type - 提示类型('success'或'error')
 */
function showToast(message, type = 'success') {
    // 获取提示框和消息元素
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    // 设置提示信息内容
    toastMessage.textContent = message;
    
    // 根据提示类型设置样式
    if (type === 'success') {
        toast.className = 'toast success show';
        icon.className = 'fas fa-check-circle';
    } else {
        toast.className = 'toast error show';
        icon.className = 'fas fa-exclamation-circle';
    }
    
     // 3秒后自动隐藏提示框
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

// ============= 【8. 产品管理功能】=============
/**
 * 删除产品
 * @param {string} productId - 要删除的产品ID
 */
async function deleteProduct(productId) {
    console.log('删除产品:', productId);
    // 从产品数据中删除指定产品
    delete productData[productId];
    // 更新表格
    updateProductTable();
    
    // 如果当前正在使用该产品，清空输入框
    const priceProductInput = document.getElementById('productInput');
    const rateProductInput = document.getElementById('productRateInput');
    const marginProductInput = document.getElementById('productMarginInput');
    
    // 清空"售价计算利润"标签页中的产品
    if (priceProductInput.value === productId) {
        priceProductInput.value = '';
        document.getElementById('costInput').value = '';
        calculateProfit();
    }
    
    // 清空"加成率计算售价"标签页中的产品
    if (rateProductInput.value === productId) {
        rateProductInput.value = '';
        document.getElementById('rateCostInput').value = '';
        calculatePrice();
    }
    
    // 清空"利润率计算售价"标签页中的产品
    if (marginProductInput.value === productId) {
        marginProductInput.value = '';
        document.getElementById('marginCostInput').value = '';
        calculatePriceFromMargin();
    }
    
    // 保存到服务器
    const success = await saveToServer();
    
    if (success) {
        showToast(`已删除产品 ${productId}`, 'success');
    } else {
        showToast(`产品 ${productId} 已在本地删除，但未同步到服务器`, 'error');
    }
}

/**
 * 添加新产品
 * 将用户输入的新产品信息添加到产品数据中
 */
async function addProduct() {
    const productId = document.getElementById('newProductId').value.trim();
    const costStr = document.getElementById('newProductCost').value;
    const cost = parseFloat(costStr);
    
    // 验证产品ID不为空
    if (!productId) {
        showToast('请输入产品型号', 'error');
        return;
    }
    
    // 验证成本是否有效
    if (!costStr || isNaN(cost) || cost < 0) {
        showToast('请输入有效的成本', 'error');
        return;
    }
    
    // 检查产品是否已存在，如果已存在则询问是否更新
    if (productData[productId] !== undefined) {
        if (!confirm(`产品 "${productId}" 已存在，是否更新成本？`)) {
            return;
        }
    }
    
    console.log('添加/更新产品:', productId, '成本:', cost);
    
    // 添加/更新产品
    productData[productId] = cost;
    
    // 清空输入框
    document.getElementById('newProductId').value = '';
    document.getElementById('newProductCost').value = '';
    
    // 更新表格
    updateProductTable();
    
    // 保存数据到服务器
    const success = await saveToServer();
    
    if (success) {
        showToast(`已${productData[productId] !== undefined ? '更新' : '添加'}产品 ${productId}`, 'success');
    } else {
        showToast(`产品 ${productId} 已在本地添加，但未同步到服务器`, 'error');
    }
}

/**
 * 导入数据
 * 将用户在导入模态框中输入的JSON数据解析并合并到产品数据中
 */
async function importData() {
    // 获取用户输入的JSON字符串
    const jsonStr = document.getElementById('importData').value;
    
    try {
        console.log('开始导入数据...');
        // 尝试解析JSON数据
        const data = JSON.parse(jsonStr);
        
        // 验证数据是否为对象
        if (typeof data !== 'object' || data === null) {
            throw new Error('无效的数据格式');
        }
        
        // 验证数据有效性，只接受格式为 {产品ID: 成本} 的数据
        let validCount = 0;
        let importData = {};
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof key === 'string' && !isNaN(parseFloat(value))) {
                importData[key] = parseFloat(value);
                validCount++;
            }
        }
        
        // 如果没有有效数据，显示错误
        if (validCount === 0) {
            throw new Error('没有找到有效的产品数据');
        }
        
        console.log(`发现 ${validCount} 个有效产品数据`);
        
        // 如果当前已有产品数据，询问用户是合并还是替换
        const action = Object.keys(productData).length > 0 ?
            confirm('是否将导入的数据合并到现有数据中？选择"确定"合并，选择"取消"则替换全部数据。') : true;
        
        if (action) {
            // 合并数据：将导入的产品添加到现有产品集合中
            console.log('合并数据到现有产品库');
            for (const [key, value] of Object.entries(importData)) {
                productData[key] = value;
            }
        } else {
            // 替换数据：用导入的产品完全替换现有产品
            console.log('替换现有产品库');
            productData = importData;
        }
        
        // 更新产品表格显示
        updateProductTable();
        
        // 保存数据到服务器
        const success = await saveToServer();
        
        // 关闭导入模态框并显示提示
        closeModal('importModal');
        
        if (success) {
            showToast(`成功导入 ${validCount} 个产品`, 'success');
        } else {
            showToast(`已在本地导入 ${validCount} 个产品，但未同步到服务器`, 'error');
        }
    } catch (error) {
        // 如果导入过程中出错，显示错误提示
        console.error('导入失败:', error);
        showToast('导入失败: ' + error.message, 'error');
    }
}

/**
 * 搜索产品（自动完成功能）
 * 在计算器输入框中输入产品名称时，显示匹配的产品列表
 * @param {string} query - 搜索查询字符串
 * @param {string} tab - 当前标签页('price'、'rate'或'margin')
 */
function searchProduct(query, tab) {
    // 确定要操作的搜索结果容器
    const resultsId = tab === 'price' ? 'priceSearchResults' : (tab === 'rate' ? 'rateSearchResults' : 'marginSearchResults');
    const resultsEl = document.getElementById(resultsId);
    
    // 清空搜索结果
    resultsEl.innerHTML = '';
    
    // 如果搜索查询为空，隐藏搜索结果
    if (!query.trim()) {
        resultsEl.classList.remove('active');
        return;
    }
    
    // 查找匹配的产品
    const matchedProducts = [];
    const queryLower = query.toLowerCase();
    
    // 遍历所有产品，找出名称包含查询字符串的产品
    for (const id in productData) {
        if (id.toLowerCase().includes(queryLower)) {
            matchedProducts.push({
                id: id,
                cost: productData[id]
            });
        }
    }
    
    // 如果没有匹配产品，隐藏搜索结果
    if (matchedProducts.length === 0) {
        resultsEl.classList.remove('active');
        return;
    }
    
    // 显示搜索结果
    matchedProducts.forEach(product => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.innerHTML = `
            <span>${product.id}</span>
            <span>¥${product.cost.toFixed(2)}</span>
        `;
        
        // 点击搜索结果项选择产品
        item.addEventListener('click', function() {
            if (tab === 'price') {
                selectProduct(product.id, product.cost);
            } else if (tab === 'rate') {
                selectRateProduct(product.id, product.cost);
            } else if (tab === 'margin') {
                selectMarginProduct(product.id, product.cost);
            }
            resultsEl.classList.remove('active');
        });
        
        resultsEl.appendChild(item);
    });
    
    // 显示搜索结果容器
    resultsEl.classList.add('active');
    
    // 如果只有一个匹配结果，自动填充
    if (matchedProducts.length === 1) {
        if (tab === 'price') {
            selectProduct(matchedProducts[0].id, matchedProducts[0].cost);
        } else if (tab === 'rate') {
            selectRateProduct(matchedProducts[0].id, matchedProducts[0].cost);
        } else if (tab === 'margin') {
            selectMarginProduct(matchedProducts[0].id, matchedProducts[0].cost);
        }
    }
}

// ============= 【9. 计算器功能】=============
/**
 * 选择产品（售价计算利润）
 * 在"售价计算利润"标签页中填充选择的产品信息
 * @param {string} productId - 产品ID
 * @param {number} cost - 产品成本
 */
function selectProduct(productId, cost) {
    document.getElementById('productInput').value = productId;
    document.getElementById('costInput').value = cost.toFixed(2);
    calculateProfit();
}

/**
 * 选择产品（加成率计算售价）
 * 在"加成率计算售价"标签页中填充选择的产品信息
 * @param {string} productId - 产品ID
 * @param {number} cost - 产品成本
 */
function selectRateProduct(productId, cost) {
    document.getElementById('productRateInput').value = productId;
    document.getElementById('rateCostInput').value = cost.toFixed(2);
    calculatePrice();
}

/**
 * 选择产品（利润率计算售价）
 * 在"利润率计算售价"标签页中填充选择的产品信息
 * @param {string} productId - 产品ID
 * @param {number} cost - 产品成本
 */
function selectMarginProduct(productId, cost) {
    // 将产品ID填入输入框
    document.getElementById('productMarginInput').value = productId;
    // 将产品成本填入成本输入框，并格式化为两位小数
    document.getElementById('marginCostInput').value = cost.toFixed(2);
    // 计算利润率对应的售价
    calculatePriceFromMargin();
}

/**
 * 计算利润和利润率
 * 根据"售价计算利润"标签页中输入的成本和售价计算利润金额和利润率
 */
function calculateProfit() {
    // 获取成本和售价输入框
    const costInput = document.getElementById('costInput');
    const priceInput = document.getElementById('priceInput');
    // 获取结果显示元素
    const profitValue = document.getElementById('profitValue');
    const profitRateValue = document.getElementById('profitRateValue');
    const profitMarginValue = document.getElementById('profitMarginValue');
    
    // 解析成本和售价为数字
    const cost = parseFloat(costInput.value);
    const price = parseFloat(priceInput.value);
    
    // 如果输入无效，显示默认值并返回
    if (isNaN(cost) || isNaN(price)) {
        profitValue.textContent = '0.00';
        profitRateValue.textContent = '0.00%';
        profitMarginValue.textContent = '0.00%';
        profitValue.style.color = '';
        profitRateValue.style.color = '';
        profitMarginValue.style.color = '';
        return;
    }
    
    // 计算利润金额 = 售价 - 成本
    const profit = price - cost;
    // 计算加成率 = 利润/成本 * 100%（如果成本为0，则结果为0）
    const profitRate = cost > 0 ? (profit / cost) * 100 : 0; 
    // 计算利润率 = 利润/售价 * 100%（如果售价为0，则结果为0）
    const profitMargin = price > 0 ? (profit / price) * 100 : 0; 
    
    // 显示计算结果，格式化为两位小数
    profitValue.textContent = profit.toFixed(2);
    profitRateValue.textContent = profitRate.toFixed(2) + '%';
    profitMarginValue.textContent = profitMargin.toFixed(2) + '%';
    
    // 根据利润正负设置颜色，正数为绿色，负数为红色
    if (profit > 0) {
        profitValue.style.color = '#4CAF50';
        profitRateValue.style.color = '#4CAF50';
        profitMarginValue.style.color = '#4CAF50';
    } else if (profit < 0) {
        profitValue.style.color = '#F44336';
        profitRateValue.style.color = '#F44336';
        profitMarginValue.style.color = '#F44336';
    } else {
        profitValue.style.color = '';
        profitRateValue.style.color = '';
        profitMarginValue.style.color = '';
    }
}

/**
 * 根据加成率计算售价
 * 在"加成率计算售价"标签页中，根据成本和目标加成率计算推荐售价
 */
function calculatePrice() {
    // 获取成本和目标加成率输入框
    const costInput = document.getElementById('rateCostInput');
    const rateInput = document.getElementById('targetRateInput');
    // 获取结果显示元素
    const priceValue = document.getElementById('suggestedPriceValue');
    const profitValue = document.getElementById('expectedProfitValue');
    const marginValue = document.getElementById('expectedMarginValue');
    
    // 解析成本和加成率为数字
    const cost = parseFloat(costInput.value);
    const rate = parseFloat(rateInput.value);
    
    // 如果输入无效，显示默认值并返回
    if (isNaN(cost) || isNaN(rate)) {
        priceValue.textContent = '0.00';
        profitValue.textContent = '0.00';
        marginValue.textContent = '0.00%';
        return;
    }
    
    // 计算售价 - 加成率公式: 加成率 = (售价-成本)/成本 * 100%
    // 转换得到: 售价 = 成本 * (1 + 加成率/100)
    const price = cost * (1 + rate / 100);
    // 计算预期利润 = 售价 - 成本
    const profit = price - cost;
    
    // 计算对应的利润率 = 利润/售价 * 100%
    const margin = price > 0 ? (profit / price) * 100 : 0;
    
    // 显示计算结果，格式化为两位小数
    priceValue.textContent = price.toFixed(2);
    profitValue.textContent = profit.toFixed(2);
    marginValue.textContent = margin.toFixed(2) + '%';
}

/**
 * 根据利润率计算售价
 * 在"利润率计算售价"标签页中，根据成本和目标利润率计算推荐售价
 */
function calculatePriceFromMargin() {
    // 获取成本和目标利润率输入框
    const costInput = document.getElementById('marginCostInput');
    const marginInput = document.getElementById('targetMarginInput');
    // 获取结果显示元素
    const priceValue = document.getElementById('marginPriceValue');
    const profitValue = document.getElementById('marginProfitValue');
    const rateValue = document.getElementById('correspondingRateValue');
    
    // 解析成本和利润率为数字
    const cost = parseFloat(costInput.value);
    const margin = parseFloat(marginInput.value);
    
    // 如果输入无效，显示默认值并返回
    if (isNaN(cost) || isNaN(margin)) {
        priceValue.textContent = '0.00';
        profitValue.textContent = '0.00';
        rateValue.textContent = '0.00%';
        return;
    }
    
    // 计算售价 - 利润率公式: 利润率 = (售价-成本)/售价 * 100%
    // 转换得到: 售价 = 成本 / (1 - 利润率/100)
    let price;
    if (margin >= 100) {
        // 如果利润率等于或超过100%，售价理论上无穷大，设置一个很大的值
        price = cost * 100; 
    } else {
        price = cost / (1 - margin / 100);
    }
    
    // 计算预期利润 = 售价 - 成本
    const profit = price - cost;
    
    // 计算对应的加成率 = 利润/成本 * 100%
    const rate = (profit / cost) * 100;
    
    // 显示计算结果，格式化为两位小数
    priceValue.textContent = price.toFixed(2);
    profitValue.textContent = profit.toFixed(2);
    rateValue.textContent = rate.toFixed(2) + '%';
}


