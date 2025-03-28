<?php
/**
 * 菠萝链接收藏 - 获取链接数据接口
 * 版本: 1.0.0
 * 作者: 菠萝开发团队
 * 最后更新: 2025-03-27
 */

// 允许跨域请求
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// 数据存储目录
$dataDir = "data/";

// 获取用户ID (可以改为使用会话或其他身份验证方法)
$userId = isset($_GET['user_id']) ? $_GET['user_id'] : 'default_user';

// 数据文件路径
$dataFile = $dataDir . $userId . "_links.json";

// 检查请求方法
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // 检查文件是否存在
    if (file_exists($dataFile)) {
        // 读取文件内容
        $fileContent = file_get_contents($dataFile);
        
        // 直接返回文件内容
        echo $fileContent;
    } else {
        // 文件不存在，返回空数组
        echo json_encode([]);
    }
} else {
    // 请求方法不正确
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "请求方法不允许，仅支持GET"
    ]);
}