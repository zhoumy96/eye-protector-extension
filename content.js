// 确保添加消息监听器
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // 处理消息
    console.log('收到消息:', request);
    // 发送响应
    sendResponse({status: 'success'});
    return true; // 如果需要异步发送响应，返回 true
}); 