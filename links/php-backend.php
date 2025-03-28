<?php
/**
 * 菠萝链接收藏 - 保存链接数据接口
 * 版本: 1.0.0
 * 作者: 菠萝开发团队
 * 最后更新: 2025-03-27
 */

// 允许跨域请求
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// 数据存储目录
$dataDir = "data/";

// 确保数据目录存在
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// 获取用户ID (可以改为使用会话或其他身份验证方法)
$userId = isset($_GET['user_id']) ? $_GET['user_id'] : 'default_user';

// 数据文件路径
$dataFile = $dataDir . $userId . "_links.json";

// 检查请求方法
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 获取输入数据
    $inputData = file_get_contents("php://input");
    $links = json_decode($inputData, true);
    
    // 验证数据
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode([
            "success" => false,
            "message" => "无效的JSON数据",
            "error" => json_last_error_msg()
        ]);
        exit;
    }
    
    // 保存数据到文件
    $result = file_put_contents($dataFile, json_encode($links, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($result !== false) {
        echo json_encode([
            "success" => true,
            "message" => "链接已成功保存",
            "timestamp" => date("Y-m-d H:i:s")
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "保存链接失败",
            "error" => error_get_last()
        ]);
    }
} else {
    // 请求方法不正确
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "请求方法不允许，仅支持POST"
    ]);
}