document.addEventListener('DOMContentLoaded', () => {
	const statsDiv = document.getElementById('stats');
	const toggleSwitch = document.getElementById('toggleSwitch');
	const statusText = document.getElementById('statusText');

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
      <div class="stat-item">
        ⏰ 今日跳过次数：${stats.skippedBreaks || 0}次
      </div>
    `;
	});

	// switch获取初始状态
	chrome.storage.local.get('isEnabled', (result) => {
		const status = result.isEnabled ?? true;
		toggleSwitch.checked = status;
		updateStatusText(status);
	});
	// switch切换事件
	toggleSwitch.addEventListener('change', (e) => {
		const isEnabled = e.target.checked;
		chrome.runtime.sendMessage({
			action: 'toggleEnable',
			status: isEnabled
		});
		updateStatusText(isEnabled);
	});
	// switch更新文案
	function updateStatusText(enabled) {
		statusText.textContent = enabled ? '已启用' : '已禁用';
		statusText.style.color = enabled ? '#389e0d' : '#ff4d4f';
	}

	// 提醒设置
	chrome.storage.local.get(['settings'], (result) => {
		const defaultSettings = {
			interval: 20,
			breakDuration: 20
		};
		const settings = result.settings || defaultSettings;

		document.getElementById('intervalInput').value = settings.interval;
		document.getElementById('breakInput').value = settings.breakDuration;
	});
	// 保存设置
	document.getElementById('saveInterval').addEventListener('click', () => {
		const newSettings = {
			interval: Math.max(1, Math.min(180,
				parseInt(document.getElementById('intervalInput').value) || 20)),
			breakDuration: Math.max(5, Math.min(300,
				parseInt(document.getElementById('breakInput').value) || 20))
		};

		chrome.storage.local.set({ settings: newSettings }, () => {
			chrome.runtime.sendMessage({
				action: 'updateReminderSettings',
				reminderSettings: newSettings
			});
			alert('设置已保存！');
		});
	});
});