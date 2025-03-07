document.addEventListener('DOMContentLoaded', () => {
	const toggleSwitch = document.getElementById('toggleSwitch');
	const statCompleted = document.getElementById('stat-completed');
	const statSkipped = document.getElementById('stat-skipped');
	const intervalInput = document.getElementById('intervalInput');
	const breakInput = document.getElementById('breakInput');
	const saveIntervalButton = document.getElementById('saveInterval');

	const DEFAULT_SETTINGS = {
		interval: 20,
		breakDuration: 20
	};

	// 获取统计数据和设置
	chrome.storage.local.get(['stats', 'isEnabled', 'settings'], (result) => {
		const stats = result.stats || {};
		statCompleted.textContent = stats.completedBreaks || 0;
		statSkipped.textContent = stats.skippedBreaks || 0;

		toggleSwitch.checked = result.isEnabled ?? true;

		const settings = result.settings || DEFAULT_SETTINGS;
		intervalInput.value = settings.interval;
		breakInput.value = settings.breakDuration;
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
			console.error('切换状态失败:', error);
			alert('切换状态失败，请重试');
		}
	});

	// 保存设置
	saveIntervalButton.addEventListener('click', () => {
		const interval = parseInt(intervalInput.value) || DEFAULT_SETTINGS.interval;
		const breakDuration = parseInt(breakInput.value) || DEFAULT_SETTINGS.breakDuration;

		const newSettings = {
			interval,
			breakDuration
		};
		console.log('newSettings::', newSettings);

		chrome.storage.local.set({ settings: newSettings }, () => {
			chrome.runtime.sendMessage({
				action: 'updateSettings',
				settings: newSettings
			});
			alert('设置已保存！');
		});
	});
});
