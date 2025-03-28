/**
 * 菠萝电商计算器脚本
 * 包含基本计算器、重量转换、尺寸转换功能
 * 版本: 1.0.0
 * 作者: 菠萝开发团队
 * 最后更新: 2025-03-27
 */

// ===================================================
// 基本计算器功能
// ===================================================
let screenValue = '0';
const calculatorScreen = document.getElementById('calculatorScreen');

/**
 * 更新计算器屏幕显示
 */
function updateScreen() {
    calculatorScreen.textContent = screenValue;
}

/**
 * 向计算器屏幕添加数字或运算符
 * @param {string} value - 要添加的数字或运算符
 */
function addToScreen(value) {
    if (screenValue === '0' && value !== '.') {
        screenValue = value;
    } else {
        screenValue += value;
    }
    updateScreen();
}

/**
 * 清除计算器屏幕
 */
function clearScreen() {
    screenValue = '0';
    updateScreen();
}

/**
 * 删除计算器屏幕上的最后一个字符
 */
function deleteLastChar() {
    if (screenValue.length === 1) {
        screenValue = '0';
    } else {
        screenValue = screenValue.slice(0, -1);
    }
    updateScreen();
}

/**
 * 执行计算
 */
function calculate() {
    try {
        // 处理百分比
        let expression = screenValue.replace(/%/g, '*0.01');
        // 使用eval计算表达式结果
        screenValue = eval(expression).toString();
        updateScreen();
    } catch (error) {
        screenValue = 'Error';
        updateScreen();
        // 1.5秒后清除错误信息
        setTimeout(clearScreen, 1500);
    }
}

// ===================================================
// 重量转换功能
// ===================================================

/**
 * 从克转换到其他重量单位
 * @param {string} grams - 克数值
 */
function convertFromGrams(grams) {
    if (grams === '') {
        document.getElementById('pounds').value = '';
        document.getElementById('ounces').value = '';
        return;
    }
    
    const g = parseFloat(grams);
    document.getElementById('pounds').value = (g / 453.592).toFixed(4);
    document.getElementById('ounces').value = (g / 28.3495).toFixed(4);
}

/**
 * 从磅转换到其他重量单位
 * @param {string} pounds - 磅数值
 */
function convertFromPounds(pounds) {
    if (pounds === '') {
        document.getElementById('grams').value = '';
        document.getElementById('ounces').value = '';
        return;
    }
    
    const lb = parseFloat(pounds);
    document.getElementById('grams').value = (lb * 453.592).toFixed(2);
    document.getElementById('ounces').value = (lb * 16).toFixed(4);
}

/**
 * 从盎司转换到其他重量单位
 * @param {string} ounces - 盎司数值
 */
function convertFromOunces(ounces) {
    if (ounces === '') {
        document.getElementById('grams').value = '';
        document.getElementById('pounds').value = '';
        return;
    }
    
    const oz = parseFloat(ounces);
    document.getElementById('grams').value = (oz * 28.3495).toFixed(2);
    document.getElementById('pounds').value = (oz / 16).toFixed(4);
}

/**
 * 清除重量转换部分的输入值
 */
function clearWeightConversion() {
    document.getElementById('grams').value = '';
    document.getElementById('pounds').value = '';
    document.getElementById('ounces').value = '';
}

// ===================================================
// 尺寸转换功能
// ===================================================

/**
 * 长度单位转换
 * @param {string} unit - 转换方向（'cm'或'inch'）
 */
function convertLength(unit) {
    if (unit === 'cm') {
        const cm = parseFloat(document.getElementById('lengthCm').value) || 0;
        document.getElementById('lengthInch').value = (cm * 0.3937).toFixed(4);
    } else {
        const inch = parseFloat(document.getElementById('lengthInch').value) || 0;
        document.getElementById('lengthCm').value = (inch * 2.54).toFixed(4);
    }
}

/**
 * 宽度单位转换
 * @param {string} unit - 转换方向（'cm'或'inch'）
 */
function convertWidth(unit) {
    if (unit === 'cm') {
        const cm = parseFloat(document.getElementById('widthCm').value) || 0;
        document.getElementById('widthInch').value = (cm * 0.3937).toFixed(4);
    } else {
        const inch = parseFloat(document.getElementById('widthInch').value) || 0;
        document.getElementById('widthCm').value = (inch * 2.54).toFixed(4);
    }
}

/**
 * 高度单位转换
 * @param {string} unit - 转换方向（'cm'或'inch'）
 */
function convertHeight(unit) {
    if (unit === 'cm') {
        const cm = parseFloat(document.getElementById('heightCm').value) || 0;
        document.getElementById('heightInch').value = (cm * 0.3937).toFixed(4);
    } else {
        const inch = parseFloat(document.getElementById('heightInch').value) || 0;
        document.getElementById('heightCm').value = (inch * 2.54).toFixed(4);
    }
}

/**
 * 清除尺寸转换部分的输入值
 */
function clearDimensionConversion() {
    document.getElementById('lengthCm').value = '';
    document.getElementById('lengthInch').value = '';
    document.getElementById('widthCm').value = '';
    document.getElementById('widthInch').value = '';
    document.getElementById('heightCm').value = '';
    document.getElementById('heightInch').value = '';
}

// ===================================================
// 键盘输入支持
// ===================================================
document.addEventListener('keydown', function(event) {
    // 计算器键盘输入，仅当鼠标不在输入框中时才响应键盘操作
    if (document.activeElement.tagName !== 'INPUT') {
        const key = event.key;
        
        // 数字、操作符和小数点
        if (/[0-9]/.test(key) || ['+', '-', '*', '/', '%', '.'].includes(key)) {
            addToScreen(key);
            event.preventDefault();
        }
        
        // 回车键计算结果
        if (key === 'Enter') {
            calculate();
            event.preventDefault();
        }
        
        // 退格键删除
        if (key === 'Backspace') {
            deleteLastChar();
            event.preventDefault();
        }
        
        // Escape键清除
        if (key === 'Escape') {
            clearScreen();
            event.preventDefault();
        }
    }
});

// ===================================================
// 页脚和布局调整
// ===================================================

/**
 * 确保页脚始终在底部的函数
 */
function adjustFooter() {
    const body = document.body;
    const html = document.documentElement;
    const footer = document.querySelector('.footer-container');
    
    // 获取页面内容高度
    const contentHeight = Math.max(
        body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight
    ) - footer.offsetHeight;
    
    // 获取视口高度
    const viewportHeight = window.innerHeight;
    
    // 如果内容不够填满视口，将footer固定在底部
    if (contentHeight < viewportHeight) {
        footer.style.position = 'fixed';
        footer.style.bottom = '0';
    } else {
        // 否则使用sticky定位，让footer跟随页面流动
        footer.style.position = 'sticky';
    }
}

// ===================================================
// 页面加载和调整事件
// ===================================================

// 页面加载和窗口大小变化时调整footer
window.addEventListener('load', adjustFooter);
window.addEventListener('resize', adjustFooter);

// 如果在iframe中，通知父窗口调整高度
window.addEventListener('load', function() {
    if (window.parent && window.parent !== window) {
        // 检测是否在iframe中
        const height = document.body.scrollHeight;
        try {
            // 尝试与父窗口通信
            window.parent.postMessage({ type: 'resize', height: height }, '*');
        } catch (e) {
            console.log('无法与父窗口通信');
        }
    }
    
    // 初始化计算器显示
    updateScreen();
});
