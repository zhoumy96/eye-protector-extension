document.addEventListener('DOMContentLoaded', () => {
	const statsDiv = document.getElementById('stats');
	const toggle = document.getElementById('timerToggle');

	// 获取统计数据
	chrome.storage.local.get('stats', (result) => {
		const stats = result.stats || {};
		statsDiv.innerHTML = `
      <div class="stat-item">
        ✅ 已完成休息：${stats.completedBreaks || 0}次
      </div>
      <div class="stat-item">
        ⏰ 今日提醒次数：${stats.totalReminders || 0}次
      </div>
    `;
	});

	// 开关状态同步
	chrome.runtime.sendMessage({ action: 'getTimerStatus' }, (res) => {
		toggle.checked = res.status;
	});

	// 切换定时器状态
	toggle.addEventListener('change', (e) => {
		chrome.runtime.sendMessage({
			action: 'toggleTimer',
			status: e.target.checked
		});
	});
});