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
	toggleSwitch.addEventListener('change', async (e) => {
		const isEnabled = e.target.checked;
		try {
			await chrome.runtime.sendMessage({
				action: 'toggleEnable',
				status: isEnabled
			});
			updateStatusText(isEnabled);
		} catch (error) {
			alert('切换状态失败，请重试');
		}
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
		const intervalInput = parseInt(document.getElementById('intervalInput').value, 10) || 20;
		const breakInput = parseInt(document.getElementById('breakInput').value, 10) || 20;

		// 增加更严格的输入验证
		if (isNaN(intervalInput) || intervalInput < 1 || intervalInput > 180) {
			alert('间隔时间必须在1到180分钟之间');
			return;
		}

		if (isNaN(breakInput) || breakInput < 5 || breakInput > 300) {
			alert('休息时长必须在5到300秒之间');
			return;
		}

		const newSettings = {
			interval: intervalInput,
			breakDuration: breakInput
		};

		document.getElementById('intervalInput').value = newSettings.interval;
		document.getElementById('breakInput').value = newSettings.breakDuration;

		chrome.storage.local.set({ settings: newSettings }, () => {
			chrome.runtime.sendMessage({
				action: 'updateSettings',
				settings: newSettings
			});
			alert('设置已保存！');
		});
	});
});