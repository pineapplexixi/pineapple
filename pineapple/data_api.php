<?php
/**
 * 菠萝利润计算器 - 数据API
 * 
 * 这个PHP文件处理产品数据的保存和检索
 * 使用JSON文件作为简单的数据存储方式
 */

// 设置响应头
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // 允许跨域请求
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 数据文件路径
$dataFile = 'product_data.json';

// 处理OPTIONS请求（预检请求，用于CORS）
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 处理GET请求 - 读取数据
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // 检查文件是否存在
    if (file_exists($dataFile)) {
        // 读取文件内容并返回
        $data = file_get_contents($dataFile);
        echo $data;
    } else {
        // 如果文件不存在，返回空对象
        echo json_encode([]);
    }
}
// 处理POST请求 - 保存数据
else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // 获取原始POST数据
        $input = file_get_contents('php://input');
        
        // 验证JSON格式
        $data = json_decode($input);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('无效的JSON数据');
        }
        
        // 保存数据到文件
        if (file_put_contents($dataFile, $input)) {
            // 备份数据（每10次保存操作备份一次）
            $backupCounter = 0;
            if (file_exists('backup_counter.txt')) {
                $backupCounter = (int)file_get_contents('backup_counter.txt');
            }
            $backupCounter++;
            
            if ($backupCounter >= 10) {
                // 创建备份
                $backupFile = 'product_data_backup_' . date('Y-m-d_H-i-s') . '.json';
                copy($dataFile, $backupFile);
                $backupCounter = 0;
            }
            
            // 更新备份计数器
            file_put_contents('backup_counter.txt', $backupCounter);
            
            // 返回成功消息
            echo json_encode([
                'status' => 'success',
                'message' => '数据已成功保存'
            ]);
        } else {
            throw new Exception('无法写入数据文件');
        }
    } catch (Exception $e) {
        // 返回错误消息
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
} else {
    // 如果不是GET或POST请求，返回405 Method Not Allowed
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => '不支持的请求方法'
    ]);
}
?>