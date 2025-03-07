/**
 * EyeNotifier 类用于创建和管理护眼提醒通知
 * 它提供了配置提醒、创建UI元素、响应用户交互和自动关闭提醒的功能
 */
class EyeNotifier {
	#defaultDuration = 20; // 默认的休息时长（秒）
	#autoCloseTimer = null; // 自动关闭提醒的定时器
	#resizeObserver = null; // 监视视口大小变化的观察者

	/**
	 * 构造函数初始化EyeNotifier实例
	 * 它将加载设置、创建UI元素并设置事件监听器
	 */
	constructor() {
		this.settings = { breakDuration: this.#defaultDuration };
		this.#initialize();
		window.eyeNotifierInstance = this; // 保存实例
	}

	/**
	 * 初始化EyeNotifier实例的所有必要设置
	 * 包括加载设置、创建UI和设置各种监听器
	 */
	async #initialize() {
		await this.#loadSettings();
		this.#createUI();
		this.#setupEventListeners();
		this.#setupMessageListener();
	}

	/**
	 * 从Chrome存储中加载用户设置
	 * 如果没有找到设置或者设置中的休息时长小于5秒，则使用默认时长
	 */
	async #loadSettings() {
		try {
			const { settings } = await chrome.storage.local.get('settings');
			this.settings = settings || this.settings;
			this.settings.breakDuration = Math.max(
				5,
				this.settings.breakDuration || this.#defaultDuration
			);
		} catch (error) {
			console.error('加载设置失败:', error);
		}
	}

	/**
	 * 创建护眼提醒的UI元素
	 * 它将构建一个包含提醒信息、计时器和确认按钮的容器
	 */
	#createUI() {
		if (document.querySelector('.notification-card')) {
			return;
		}
		this.container = document.createElement('div');
		this.container.className = 'notification-card';
		this.container.innerHTML = `
			<div class="notification-header">
				<div class="animated-eye">
					<svg class="eye-icon" viewBox="0 0 64 64">
						<path d="M32 16C16 16 8 32 8 32s8 16 24 16 24-16 24-16-8-16-24-16zm0 28c-6.6 0-12-5.4-12-12s5.4-12 12-12 12 5.4 12 12-5.4 12-12 12z"/>
						<circle cx="32" cy="32" r="8"/>
					</svg>
				</div>
				<h2 class="notification-title">Eye Care Reminder</h2>
			</div>
			
			<div class="notification-body">
				<p class="instruction-text">
					Focus on an object 
					<span class="emphasis">6 meters away</span>
				</p>
				<p class="duration-text">
					Relax your eyes for 
					<span class="duration">${this.settings.breakDuration}s</span>
				</p>
				
				<div class="countdown-wrapper">
					<div class="circular-progress">
						<div class="progress-fill"></div>
						<span class="countdown-text">${this.settings.breakDuration}</span>
					</div>
				</div>
			</div>
			
			<div class="action-buttons">
				<button class="confirm-button">
					<svg class="check-icon" viewBox="0 0 24 24">
						<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
					</svg>
					Completed
				</button>
			</div>
		`;

		document.body.appendChild(this.container);
		this.#updateElementsRef();
	}

	/**
	 * 更新UI元素的引用
	 * 它将在创建UI后被调用，以保存对内部元素的引用
	 */
	#updateElementsRef() {
		this.countdownEl = this.container.querySelector('.countdown-text');
		this.duration = this.container.querySelector('.duration');
		this.confirmBtn = this.container.querySelector('.confirm-button');
	}

	/**
	 * 设置事件监听器
	 * 包括确认按钮的点击事件和视口大小变化的观察者
	 */
	#setupEventListeners() {
		this.confirmBtn.addEventListener('click', () => this.#handleConfirm());
		this.#resizeObserver = new ResizeObserver(() => this.#adaptLayout());
		this.#resizeObserver.observe(document.documentElement);
	}

	/**
	 * 设置消息监听器
	 * 它将响应来自其他脚本的提醒显示和设置更新消息
	 */
	#setupMessageListener() {
		this.messageListener = (msg, sender, sendResponse) => {
			if (msg.action === 'showReminder') this.show();
			if (msg.action === 'settingsUpdated') this.#updateSettings(msg.settings);
			// 这个监听不到
			// if (msg.action === 'updateSettings') this.#updateSettings(msg.settings);
			return true; // 保持长连接
		};

		chrome.runtime.onMessage.addListener(this.messageListener);
	}

	/**
	 * 更新设置并调整提醒UI
	 * @param {Object} settings - 新的设置对象
	 */
	#updateSettings(settings) {
		chrome.runtime.sendMessage({ action: 'log', log: settings });
		this.settings = settings;
		this.duration.textContent = `${settings.breakDuration || 20}`;
	}

	/**
	 * 显示护眼提醒
	 * 它将使通知容器可见，并启动倒计时
	 */
	show() {
		chrome.runtime.sendMessage({ action: 'log', log: 'show' });
		this.container.classList.add('visible');
		this.#startCountdown(this.settings.breakDuration);
	}

	/**
	 * 启动倒计时
	 * @param {number} duration - 倒计时的初始时长（秒）
	 */
	#startCountdown(duration) {
		let remaining = duration;
		this.#updateCountdown(remaining);

		this.#autoCloseTimer = setInterval(() => {
			remaining--;
			this.#updateCountdown(remaining);

			if (remaining <= 0) {
				this.#handleTimeout();
			}
		}, 1000);
	}

	/**
	 * 更新倒计时显示
	 * @param {number} seconds - 剩余时间（秒）
	 */
	#updateCountdown(seconds) {
		this.countdownEl.textContent = `${seconds}`;
	}

	/**
	 * 处理用户点击确认按钮的事件
	 * 它将清理定时器、隐藏通知并通知其他脚本休息已完成
	 */
	#handleConfirm() {
		this.#cleanupTimer();
		this.container.classList.remove('visible');
		chrome.runtime.sendMessage({ action: 'restartTimer' });
	}

	/**
	 * 处理倒计时结束的事件
	 * 它将清理定时器、隐藏通知并通知其他脚本跳过计时器
	 */
	#handleTimeout() {
		this.#cleanupTimer();
		this.container.classList.remove('visible');
		chrome.runtime.sendMessage({ action: 'skipTimer' });
	}

	/**
	 * 清理倒计时定时器
	 * 它将清除现有的定时器并将其设置为null
	 */
	#cleanupTimer() {
		clearInterval(this.#autoCloseTimer);
		this.#autoCloseTimer = null;
	}

	/**
	 * 根据视口大小调整UI布局
	 * 如果视口宽度小于400像素，则应用'compact'类名
	 */
	#adaptLayout() {
		const isNarrow = this.container.offsetWidth < 400;
		this.container.classList.toggle('compact', isNarrow);
	}

	/**
	 * 销毁EyeNotifier实例
	 * 它将断开resize观察者的连接并移除UI容器
	 */
	destroy() {
		// 断开所有观察者
		this.#resizeObserver?.disconnect();
		// 移除媒体查询监听器
		const mediaQuery = window.matchMedia('(max-width: 600px)');
		const handler = e => this.container.classList.toggle('mobile', e.matches);
		mediaQuery.removeEventListener('change', handler);
		// 移除 DOM 元素
		this.container?.remove();
		// 清理定时器
		this.#cleanupTimer();
	}
}

// 创建 EyeNotifier 实例
const eyeNotifierInstance = new EyeNotifier();

// 注册 beforeunload 事件监听器
window.addEventListener('beforeunload', () => {
	if (eyeNotifierInstance) {
		eyeNotifierInstance.destroy();
	}
});