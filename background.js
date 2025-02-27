// 初始化统计数据和定时器
let timerStatus = true;
let dailyStats = {
	totalReminders: 0,
	completedBreaks: 0,
	skippedBreaks: 0,
	lastUpdate: Date.now()
};

// 从存储加载数据
chrome.storage.local.get('stats', (result) => {
	if (result.stats) {
		dailyStats = result.stats;
		checkDailyReset();
	}
});

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
		saveStats();
	}
}

// 创建定时器
function createAlarm() {
	chrome.alarms.create('eyeProtector', {
		delayInMinutes: 1,
		periodInMinutes: 20
	});
}

// 初始化
chrome.runtime.onInstalled.addListener(() => {
	createAlarm();
	chrome.storage.local.set({ stats: dailyStats });
});

// 定时器处理
chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === 'eyeProtector' && timerStatus) {
		dailyStats.totalReminders++;
		saveStats();

		// 发送提醒到内容脚本
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs[0]?.id) {
				chrome.tabs.sendMessage(tabs[0].id, { action: 'showReminder' });
			}
		});
	}
});

// 消息处理
chrome.runtime.onMessage.addListener((msg) => {
	if (msg.action === 'restartTimer') {
		dailyStats.completedBreaks++;
		saveStats();
		createAlarm();
	} else if (msg.action === 'toggleTimer') {
		timerStatus = msg.status;
	}
});

// 保存统计
function saveStats() {
	dailyStats.lastUpdate = Date.now();
	chrome.storage.local.set({ stats: dailyStats });
}