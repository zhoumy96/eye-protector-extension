// 初始化定时器状态、提醒设置、统计数据
let isEnabled = true;
let reminderSettings = {
	interval: 20,
	breakDuration: 20
};
let dailyStats = {
	totalReminders: 0,
	completedBreaks: 0,
	skippedBreaks: 0,
	lastUpdate: Date.now()
};

// 创建定时器
function createAlarm() {
	console.log('创建定时器');
	chrome.alarms.create('eyeProtector', {
		delayInMinutes: 0.1,
		// delayInMinutes: currentSettings.interval,
	});
}
// 取消定时器
function cancelAlarm() {
	chrome.alarms.clear('eyeProtector');
}
// 重启定时器
function resetAlarm() {
	chrome.alarms.clear('eyeProtector', () => {
		if (isEnabled) {
			createAlarm();
		}
	});
}
// 保存统计
function saveStats() {
	dailyStats.lastUpdate = Date.now();
	chrome.storage.local.set({ stats: dailyStats });
}
// 每日数据重置
function checkDailyReset() {
	const lastDate = new Date(dailyStats.lastUpdate).getDate();
	const currentDate = new Date().getDate();
	if (currentDate !== lastDate) {
		dailyStats = {
			totalReminders: 0,
			completedBreaks: 0,
			skippedBreaks: 0,
			lastUpdate: Date.now()
		};
		console.log('每日数据重置');
		saveStats();
	}
}
// 获取持久化状态
function loadStorage () {
	chrome.storage.local.get(['isEnabled', 'stats', 'reminderSettings'], (result) => {
		// 状态加载
		if (result.isEnabled !== undefined) {
			isEnabled = result.isEnabled;
			updateIcon();
		}
		// 提醒设置加载
		if (result.reminderSettings) {
			reminderSettings = result.reminderSettings;
		}

		// 统计数据加载
		if (result.stats) {
			dailyStats = result.stats;
			checkDailyReset();
		}

		// 根据状态初始化定时器
		if (isEnabled) createAlarm();
	});
}
// 更新工具栏图标
function updateIcon() {
	// const iconPath = isEnabled ? "icons/enabled.png" : "icons/disabled.png";
	// chrome.action.setIcon({ path: {
	// 		"128": iconPath
	// 	}});
}
// 监听存储变化
chrome.storage.onChanged.addListener((changes) => {
	if (changes.isEnabled) {
		isEnabled = changes.isEnabled.newValue;
		updateIcon();
		isEnabled ? createAlarm() : cancelAlarm();
	}
});

// Service Worker 启动时加载
loadStorage();

// 定时器处理
chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === 'eyeProtector' && isEnabled) {
		dailyStats.totalReminders++;
		saveStats();

		// 窗口状态判断
		chrome.windows.getLastFocused({ populate: false }, (window) => {
			console.log('窗口状态判断::', window);
			// chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			chrome.tabs.query({ active: true, windowId: window.id }, (tabs) => {
				console.log('tabs::', tabs);
				if (tabs.length > 0 && tabs[0]?.id) {
					chrome.tabs.sendMessage(tabs[0].id, { action: 'showReminder' }, (response) => {
						console.log('showReminder');
						if (chrome.runtime.lastError) {
							// 静默处理连接错误
							console.debug('Message ignored:', chrome.runtime.lastError.message);
						}
					});
				}
			});
		});
	}
});

// 消息处理
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	switch(msg.action) {
		case 'toggleEnable':
			// 直接写入存储，由 storage.onChanged 处理后续逻辑
			chrome.storage.local.set({ isEnabled: msg.status });
			// sendResponse({ success: true });
			break;
		case 'restartTimer':
			dailyStats.completedBreaks++;
			saveStats();
			createAlarm();
			break;
		case 'skipTimer':
			dailyStats.skippedBreaks++;
			saveStats();
			break;
		case 'updateReminderSettings':
			reminderSettings = msg.reminderSettings;
			chrome.storage.local.set({ reminderSettings });
			resetAlarm();
			break;
	}
});