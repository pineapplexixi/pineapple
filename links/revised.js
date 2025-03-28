/**
 * 菠萝链接收藏脚本 (PHP服务器版)
 * 包含卡片筛选、搜索、添加新链接等功能
 * 版本: 1.0.0
 * 作者: 菠萝开发团队
 * 最后更新: 2025-03-27
 */

// ===================================================
// 配置
// ===================================================

// 服务器API地址 (根据实际情况调整)
const API_BASE_URL = './'; // 当前目录
const SAVE_LINKS_URL = API_BASE_URL + 'php-backend.php';
const GET_LINKS_URL = API_BASE_URL + 'php-get-links.php';

// 用户ID (可以改为使用登录系统生成)
const USER_ID = generateUserId();

// ===================================================
// DOM 元素获取
// ===================================================
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const linksContainer = document.getElementById('linksContainer');
const categoryBtns = document.querySelectorAll('.category-btn');
const addLinkBtn = document.getElementById('addLinkBtn');
const addLinkModal = document.getElementById('addLinkModal');
const closeBtn = document.querySelector('.close-btn');
const addLinkForm = document.getElementById('addLinkForm');
const syncStatusIndicator = document.getElementById('syncStatus');

// 当前选中的分类
let currentCategory = 'all';
// 用于跟踪上次同步时间
let lastSyncTime = null;
// 存储链接的本地存储键名 (作为服务器故障时的备份)
const STORAGE_KEY = 'pineapple_link_collection';

// ===================================================
// 初始化函数
// ===================================================
function init() {
    console.log('初始化菠萝链接收藏...');
    
    // 绑定事件监听器
    bindEvents();
    
    // 从服务器加载链接数据
    loadLinksFromServer();
    
    // 初始显示所有链接
    filterLinks('all');
    
    // 调整页脚位置
    adjustFooter();
}

// ===================================================
// 事件绑定函数
// ===================================================
function bindEvents() {
    // 分类按钮点击事件
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除其他按钮的激活状态
            categoryBtns.forEach(item => item.classList.remove('active'));
            // 设置当前按钮为激活状态
            this.classList.add('active');
            // 更新当前分类
            currentCategory = this.getAttribute('data-category');
            // 过滤显示对应分类的链接
            filterLinks(currentCategory);
        });
    });
    
    // 搜索功能
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 添加链接按钮点击事件
    addLinkBtn.addEventListener('click', function() {
        openAddLinkModal();
    });
    
    // 关闭弹窗按钮点击事件
    closeBtn.addEventListener('click', function() {
        closeAddLinkModal();
    });
    
    // 点击弹窗外部区域关闭弹窗
    window.addEventListener('click', function(e) {
        if (e.target === addLinkModal) {
            closeAddLinkModal();
        }
    });
    
    // 添加链接表单提交事件
    addLinkForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addNewLink();
    });
    
    // 窗口调整大小时重新调整页脚
    window.addEventListener('resize', adjustFooter);
    
    // 同步状态指示器点击事件 (手动触发同步)
    if (syncStatusIndicator) {
        syncStatusIndicator.addEventListener('click', function() {
            saveLinksToServer();
        });
    }
    
    // 导出/导入事件(如果页面中有这些元素)
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportLinks);
    }
    
    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                importLinks(e.target.files[0]);
                e.target.value = ''; // 重置使其可被再次选择
            }
        });
    }
}

// ===================================================
// 服务器通信功能
// ===================================================

/**
 * 从服务器加载链接
 */
function loadLinksFromServer() {
    updateSyncStatus('syncing');
    
    // 构建带有用户ID的URL
    const url = `${GET_LINKS_URL}?user_id=${USER_ID}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                // 清除现有的自定义链接
                clearCustomLinks();
                
                // 添加从服务器加载的链接
                const addBtn = document.getElementById('addLinkBtn');
                data.forEach(linkData => {
                    const card = createLinkCard(linkData);
                    card.classList.add('custom-link');
                    linksContainer.insertBefore(card, addBtn);
                });
                
                // 更新本地存储作为备份
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                
                // 更新同步状态
                lastSyncTime = new Date();
                updateSyncStatus('synced');
                
                console.log('已从服务器加载', data.length, '个链接');
            } else {
                // 服务器没有返回有效数据，尝试从本地存储加载
                loadLinksFromStorage();
                updateSyncStatus('error');
                console.warn('服务器未返回有效数据，已从本地加载');
            }
        })
        .catch(error => {
            console.error('从服务器加载链接失败:', error);
            // 失败时从本地存储加载
            loadLinksFromStorage();
            updateSyncStatus('error');
        })
        .finally(() => {
            // 重新应用过滤
            filterLinks(currentCategory);
        });
}

/**
 * 保存链接到服务器
 */
function saveLinksToServer() {
    updateSyncStatus('syncing');
    
    // 获取所有链接数据
    const linksData = getAllLinksData();
    
    // 准备请求选项
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(linksData)
    };
    
    // 发送数据到服务器
    fetch(`${SAVE_LINKS_URL}?user_id=${USER_ID}`, requestOptions)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('链接成功保存到服务器');
                lastSyncTime = new Date();
                updateSyncStatus('synced');
                
                // 同时更新本地存储作为备份
                localStorage.setItem(STORAGE_KEY, JSON.stringify(linksData));
            } else {
                console.error('保存到服务器失败:', data.message);
                updateSyncStatus('error');
            }
        })
        .catch(error => {
            console.error('保存到服务器时出错:', error);
            updateSyncStatus('error');
            
            // 服务器保存失败时，至少保存到本地存储
            localStorage.setItem(STORAGE_KEY, JSON.stringify(linksData));
        });
}

/**
 * 更新同步状态指示器
 * @param {string} status - 同步状态 ('syncing', 'synced', 'error')
 */
function updateSyncStatus(status) {
    if (!syncStatusIndicator) return;
    
    syncStatusIndicator.className = 'sync-status ' + status;
    
    switch (status) {
        case 'syncing':
            syncStatusIndicator.innerHTML = '<i class="fas fa-sync fa-spin"></i> 同步中...';
            break;
        case 'synced':
            const timeStr = lastSyncTime ? formatTime(lastSyncTime) : '刚刚';
            syncStatusIndicator.innerHTML = '<i class="fas fa-check"></i> 已同步 (' + timeStr + ')';
            break;
        case 'error':
            syncStatusIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 同步失败，点击重试';
            break;
    }
}

/**
 * 格式化时间为可读形式
 * @param {Date} date - 日期对象
 * @returns {string} - 格式化后的时间字符串
 */
function formatTime(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // 差异秒数
    
    if (diff < 60) {
        return '刚刚';
    } else if (diff < 3600) {
        return Math.floor(diff / 60) + '分钟前';
    } else if (diff < 86400) {
        return Math.floor(diff / 3600) + '小时前';
    } else {
        const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('zh-CN', options);
    }
}

/**
 * 生成用户ID (基于设备信息和时间戳)
 * 用于匿名用户 - 生产环境应使用登录系统
 * @returns {string} - 用户ID
 */
function generateUserId() {
    // 尝试从本地存储获取现有ID
    const existingId = localStorage.getItem('pineapple_user_id');
    if (existingId) {
        return existingId;
    }
    
    // 生成新ID
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const userAgent = navigator.userAgent;
    const hashBase = timestamp + randomStr + userAgent;
    
    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < hashBase.length; i++) {
        const char = hashBase.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // 转换为32位整数
    }
    
    // 转换为十六进制并取绝对值
    const userId = Math.abs(hash).toString(16);
    
    // 保存到本地存储
    localStorage.setItem('pineapple_user_id', userId);
    
    return userId;
}

// ===================================================
// 链接过滤与搜索功能
// ===================================================

/**
 * 根据分类过滤链接
 * @param {string} category - 要显示的分类
 */
function filterLinks(category) {
    const allCards = document.querySelectorAll('.link-card');
    
    allCards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
    
    // 添加链接按钮始终显示
    document.getElementById('addLinkBtn').style.display = 'flex';
    
    // 调整页脚位置
    adjustFooter();
}

/**
 * 执行搜索功能
 */
function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    const allCards = document.querySelectorAll('.link-card');
    
    if (query === '') {
        // 如果搜索框为空，恢复到当前分类的过滤
        filterLinks(currentCategory);
        return;
    }
    
    allCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const desc = card.querySelector('p').textContent.toLowerCase();
        const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
        
        // 如果标题、描述或标签包含搜索词，则显示该卡片
        if (title.includes(query) || desc.includes(query) || tags.some(tag => tag.includes(query))) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
    
    // 添加链接按钮始终显示
    document.getElementById('addLinkBtn').style.display = 'flex';
    
    // 调整页脚位置
    adjustFooter();
}

// ===================================================
// 添加链接功能
// ===================================================

/**
 * 打开添加链接弹窗
 */
function openAddLinkModal() {
    addLinkModal.style.display = 'flex';
    // 重置表单
    addLinkForm.reset();
}

/**
 * 关闭添加链接弹窗
 */
function closeAddLinkModal() {
    addLinkModal.style.display = 'none';
}

/**
 * 添加新的链接
 */
function addNewLink() {
    // 获取表单输入值
    const siteName = document.getElementById('siteName').value.trim();
    const siteUrl = document.getElementById('siteUrl').value.trim();
    const siteDesc = document.getElementById('siteDesc').value.trim();
    const siteCategory = document.getElementById('siteCategory').value;
    const siteIcon = document.getElementById('siteIcon').value.trim() || 'fa-globe'; // 默认图标
    const siteTags = document.getElementById('siteTags').value.trim();
    
    // 创建链接数据对象
    const linkData = {
        name: siteName,
        url: siteUrl,
        description: siteDesc,
        category: siteCategory,
        icon: siteIcon,
        tags: siteTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    };
    
    // 创建新的链接卡片
    const newCard = createLinkCard(linkData);
    newCard.classList.add('custom-link');
    
    // 将新卡片添加到容器中
    const addBtn = document.getElementById('addLinkBtn');
    linksContainer.insertBefore(newCard, addBtn);
    
    // 保存到服务器
    saveLinksToServer();
    
    // 关闭弹窗
    closeAddLinkModal();
    
    // 如果当前有分类选择，重新应用过滤
    filterLinks(currentCategory);
}

/**
 * 创建链接卡片元素
 * @param {Object} linkData - 链接数据
 * @returns {HTMLElement} - 创建的卡片元素
 */
function createLinkCard(linkData) {
    const card = document.createElement('div');
    card.className = 'link-card';
    card.setAttribute('data-category', linkData.category);
    
    // 创建卡片内容
    card.innerHTML = `
        <div class="card-icon"><i class="fas ${linkData.icon}"></i></div>
        <div class="card-content">
            <h3>${linkData.name}</h3>
            <p>${linkData.description}</p>
            <div class="card-tags">
                ${linkData.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
        <a href="${linkData.url}" class="card-link" target="_blank"></a>
        <div class="corner-pineapple">🍍</div>
    `;
    
    return card;
}

// ===================================================
// 数据处理功能
// ===================================================

/**
 * 获取所有自定义链接数据
 * @returns {Array} - 所有链接数据的数组
 */
function getAllLinksData() {
    const customLinks = document.querySelectorAll('.custom-link');
    return Array.from(customLinks).map(link => {
        return {
            name: link.querySelector('h3').textContent,
            url: link.querySelector('.card-link').getAttribute('href'),
            description: link.querySelector('p').textContent,
            category: link.getAttribute('data-category'),
            icon: link.querySelector('.card-icon i').className.replace('fas ', ''),
            tags: Array.from(link.querySelectorAll('.tag')).map(tag => tag.textContent)
        };
    });
}

/**
 * 清除所有自定义链接
 */
function clearCustomLinks() {
    const customLinks = document.querySelectorAll('.custom-link');
    customLinks.forEach(link => link.remove());
}

/**
 * 从本地存储加载链接 (当服务器不可用时的备用方法)
 */
function loadLinksFromStorage() {
    try {
        const storedLinks = localStorage.getItem(STORAGE_KEY);
        if (storedLinks) {
            const linkDataArray = JSON.parse(storedLinks);
            
            // 清除已有的自定义链接
            clearCustomLinks();
            
            // 添加存储的链接
            const addBtn = document.getElementById('addLinkBtn');
            linkDataArray.forEach(linkData => {
                const card = createLinkCard(linkData);
                card.classList.add('custom-link');
                linksContainer.insertBefore(card, addBtn);
            });
        }
    } catch (error) {
        console.error('从本地存储加载链接失败:', error);
    }
}

// ===================================================
// 页面布局调整
// ===================================================

/**
 * 调整页脚位置
 */
function adjustFooter() {
    const footer = document.querySelector('.footer-container');
    const body = document.body;
    const html = document.documentElement;
    
    // 计算内容高度
    const contentHeight = Math.max(
        body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight
    ) - footer.offsetHeight;
    
    // 获取视口高度
    const viewportHeight = window.innerHeight;
    
    // 如果内容不够填满视口，将页脚固定在底部
    if (contentHeight < viewportHeight) {
        footer.style.position = 'fixed';
        footer.style.bottom = '0';
        footer.style.left = '0';
        footer.style.right = '0';
    } else {
        footer.style.position = 'static';
    }
}

// ===================================================
// 导入/导出功能 (备用方法)
// ===================================================

/**
 * 导出链接数据到文件
 */
function exportLinks() {
    const linksData = getAllLinksData();
    const jsonData = JSON.stringify(linksData, null, 2);
    
    // 创建下载链接
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `pineapple-links-${USER_ID}.json`;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

/**
 * 从文件导入链接数据
 * @param {File} file - 要导入的JSON文件
 */
function importLinks(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const linksData = JSON.parse(event.target.result);
            
            // 验证数据格式
            if (!Array.isArray(linksData)) {
                throw new Error('无效的链接数据格式');
            }
            
            // 清除现有链接
            clearCustomLinks();
            
            // 添加导入的链接
            const addBtn = document.getElementById('addLinkBtn');
            linksData.forEach(linkData => {
                const card = createLinkCard(linkData);
                card.classList.add('custom-link');
                linksContainer.insertBefore(card, addBtn);
            });
            
            // 保存到服务器
            saveLinksToServer();
            
            alert('链接已成功导入！');
        } catch (error) {
            console.error('导入失败:', error);
            alert('导入失败，文件格式可能不正确');
        }
    };
    reader.readAsText(file);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);