// ============= 全局错误处理 =============
/**
 * ErrorHandler对象用于全局错误处理
 */
const ErrorHandler = {
	/**
	 * 初始化错误处理器，监听未捕获的异常和未处理的promise拒绝
	 */
	init() {
		self.addEventListener('unhandledrejection', event =>
			this.logError('UNHANDLED_REJECTION', event.reason));
		self.addEventListener('error', event =>
			this.logError('UNCAUGHT_EXCEPTION', event.error));
	},

	/**
	 * 记录错误信息并保存到本地存储
	 * @param {string} type 错误类型
	 * @param {Error} error 错误对象
	 */
	async logError(type, error) {
		const errorData = {
			type,
			message: error.message,
			stack: error.stack,
			timestamp: Date.now()
		};

		console.error(`[${type}]`, error);
		await this.saveError(errorData);
	},

	/**
	 * 将错误数据保存到本地存储的'errors'键下
	 * @param {object} data 错误数据
	 */
	async saveError(data) {
		try {
			const { errors = [] } = await chrome.storage.local.get('errors');
			errors.push(data);
			await chrome.storage.local.set({ errors: errors.slice(-50) });
		} catch (e) {
			console.error('保存错误失败:', e);
		}
	}
};
ErrorHandler.init();

// ============= 状态管理 =============
/**
 * 定义应用的初始状态
 */
const initialState = {
	// 表示功能是否启用的标志
	isEnabled: true,
	// 功能的配置选项
	settings: {
		// 间隔时间，单位为分钟
		interval: 20,
		// 休息持续时间，单位为秒
		// breakDuration: 20
	},
	// 功能的统计信息
	stats: {
		// 总提醒次数
		totalReminders: 0,
		// 完成的休息次数
		completedBreaks: 0,
		// 跳过的休息次数
		skippedBreaks: 0,
		// 成功发送的消息次数
		messageSuccess: 0,
		// 发送失败的消息次数
		messageFailures: 0,
		// 统计信息最后更新的时间戳
		lastUpdated: Date.now()
	}
};

/**
 * StateManager类用于管理应用的状态
 */
class StateManager {
	static instance = null; // 单例实例
	constructor() {
		if (StateManager.instance) {
			return StateManager.instance;
		}
		this.state = { ...initialState };
		StateManager.instance = this;
	}

	// 获取单例实例
	static getInstance() {
		if (!this.instance) {
			this.instance = new StateManager();
		}
		return this.instance;
	}

	/**
	 * 加载本地存储中的状态数据
	 */
	async load() {
		try {
			const data = await chrome.storage.local.get([
				'isEnabled',
				'settings',
				'stats'
			]);

			this.state = {
				...initialState,
				...(data || {}),
				stats: this.checkDailyReset(data?.stats || initialState.stats)
			};

			if (this.state.isEnabled) {
				await AlarmService.initialize();
			}
		} catch (error) {
			await ErrorHandler.logError('STATE_LOAD_FAILED', error);
		}
	}

	/**
	 * 检查统计信息是否需要每日重置
	 * @param {object} stats 当前的统计信息
	 * @returns {object} 重置后的统计信息
	 */
	checkDailyReset(stats) {
		const lastDate = new Date(stats.lastUpdated).getDate();
		const currentDate = new Date().getDate();
		return currentDate !== lastDate ? {
			...initialState.stats,
			lastUpdated: Date.now()
		} : stats;
	}

	/**
	 * 更新设置并重启定时器
	 * @param {object} settings 新的设置对象
	 */
	async updateSettings(settings) {
		this.state.settings = { ...this.state.settings, ...settings };
		await chrome.storage.local.set({ settings: this.state.settings });
		await AlarmService.restart();
	}

	/**
	 * 启用或禁用功能，并相应地启动或停止定时器
	 * @param {boolean} status 功能的新状态
	 */
	async toggleEnabled(status) {
		this.state.isEnabled = status;
		await chrome.storage.local.set({ isEnabled: status });
		status ? await AlarmService.start() : await AlarmService.stop();
	}
}

// ============= 定时器服务 =============
/**
 * AlarmService类用于管理定时器相关的操作
 */
class AlarmService {
	static ALARM_NAME = 'eyeProtector';

	/**
	 * 初始化定时器，清除现有的并重新启动
	 */
	static async initialize() {
		await this.clear();
		return this.start();
	}

	/**
	 * 启动定时器，根据设置的间隔时间创建报警
	 */
	static async start() {
		const { interval } = StateManager.getInstance().state.settings;
		return chrome.alarms.create(this.ALARM_NAME, {
			// delayInMinutes: interval,
			// 延迟时间（以分钟为单位），用于设置某些操作或事件的延迟执行时间
			delayInMinutes: 1,
			// 执行周期（以分钟为单位），用于定义重复执行任务或操作的时间间隔
			// periodInMinutes: 1,
		});
	}

	/**
	 * 停止定时器
	 */
	static async stop() {
		return this.clear();
	}

	/**
	 * 清除定时器
	 */
	static async clear() {
		return chrome.alarms.clear(this.ALARM_NAME);
	}

	/**
	 * 重启定时器
	 */
	static async restart() {
		try {
			await this.clear();
			await this.start();
		} catch (error) {
			console.error('定时器重启失败:', error);
		}
	}
}

// ============= 统计服务 =============
/**
 * StatsService类用于管理统计信息
 */
class StatsService {
	/**
	 * 增加指定统计字段的值
	 * @param {string} field 要增加的字段名
	 */
	static async increment(field) {
		const manager = StateManager.getInstance();
		manager.state.stats[field] = (manager.state.stats[field] || 0) + 1;
		await this.#save();
	}

	/**
	 * 保存统计信息到本地存储
	 */
	static async #save() {
		const manager = StateManager.getInstance();
		manager.state.stats.lastUpdated = Date.now();
		await chrome.storage.local.set({
			stats: manager.state.stats
		});
	}
}

// ============= 消息通信 =============
/**
 * MessageService类用于处理消息通信
 */
class MessageService {
	/**
	 * 初始化消息服务，监听消息事件
	 */
	static init() {
		chrome.runtime.onMessage.addListener(this.#messageHandler);
	}

	/**
	 * 消息处理函数
	 * @param {object} message 收到的消息对象
	 * @param {object} sender 消息发送者的信息
	 * @param {function} sendResponse 发送响应的函数
	 */
	static #messageHandler = async (message, sender, sendResponse) => {
		if (!chrome.runtime.id || sender.id !== chrome.runtime.id) {
			return sendResponse({ success: false, error: 'Invalid sender' });
		}
		try {
			const stateManager = StateManager.getInstance();
			switch (message.action) {
				case 'toggleEnable':
					await stateManager.toggleEnabled(message.status);
					break;
				case 'restartTimer':
					await StatsService.increment('completedBreaks');
					await AlarmService.restart();
					break;
				case 'skipTimer':
					await StatsService.increment('skippedBreaks');
					await AlarmService.restart();
					break;
				case 'updateSettings':
					await stateManager.updateSettings(message.settings);
					chrome.tabs.query({}, (tabs) => {
						tabs.forEach(tab => {
							if (tab.status === 'complete') {
								chrome.tabs.sendMessage(tab.id, {
									action: 'settingsUpdated',
									settings: message.settings
								})
							}
						});
					});
					break;
				case 'log':
					console.log('message.log::', message.log);
					break;
			}

			sendResponse({ success: true });
		} catch (error) {
			// 确保在捕获错误时更新 messageFailures
			await StatsService.increment('messageFailures');
			sendResponse({
				success: false,
				error: error.message
			});
		}
	}
}

// ============= 主初始化流程 =============
(async () => {
	const stateManager = new StateManager();
	await stateManager.load();
	MessageService.init();
	const notifyAllTabs = async () => {
		const windows = await chrome.windows.getAll({ populate: true });
		for (const window of windows) {
			for (const tab of window.tabs) {
				if (tab.active && tab.id) {
					try {
						await chrome.tabs.sendMessage(tab.id, { action: 'showReminder' });
						await StatsService.increment('messageSuccess');
					} catch (error) {
						await StatsService.increment('messageFailures');
					}
				}
			}
		}
	};

	chrome.alarms.onAlarm.addListener(async alarm => {
		if (alarm.name === AlarmService.ALARM_NAME) {
			await StatsService.increment('totalReminders');
			await notifyAllTabs();
		}
	});
})();
