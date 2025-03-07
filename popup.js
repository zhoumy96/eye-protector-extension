document.addEventListener('DOMContentLoaded', () => {
	const toggleSwitch = document.getElementById('toggleSwitch');
	const statCompleted = document.getElementById('stat-completed');
	const statSkipped = document.getElementById('stat-skipped');

	// 获取统计数据
	chrome.storage.local.get('stats', (result) => {
		const stats = result.stats || {};
		statCompleted.textContent = stats.completedBreaks || 0;
		statSkipped.textContent = stats.skippedBreaks || 0;
	});

	// switch获取初始状态
	chrome.storage.local.get('isEnabled', (result) => {
		toggleSwitch.checked = result.isEnabled ?? true;
	});
	// switch切换事件
	toggleSwitch.addEventListener('change', async (e) => {
		const isEnabled = e.target.checked;
		try {
			await chrome.runtime.sendMessage({
				action: 'toggleEnable',
				status: isEnabled
			});
		} catch (error) {
			alert('切换状态失败，请重试');
		}
	});

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