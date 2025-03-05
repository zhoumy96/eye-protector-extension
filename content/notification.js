class EyeNotifier {
	constructor() {
		this.remainingTime = 20; // 当前计时时间
		this.breakDuration = 20; // 设置的breakDuration时间
		this.init();
	}
	async loadSettings() {
		return new Promise((resolve) => {
			chrome.storage.local.get('reminderSettings', (result) => {
				if (result.settings) {
					this.remainingTime = Math.max(5, result.settings.breakDuration || 20);
					this.breakDuration = Math.max(5, result.settings.breakDuration || 20);
				}
				resolve();
			});
		});
	}

	init() {
		this.loadSettings().then(() => {
			this.initUI();
			this.setupListeners();
			this.checkViewport();
		})
	}

	initUI() {
		this.container = document.createElement('div');
		this.container.className = 'eye-notification breathing-guide';

		const icon = document.createElement('div');
		icon.className = 'breath-icon';
		icon.innerHTML = '👁️';

		const content = document.createElement('div');
		content.className = 'notification-content';
		content.innerHTML = `
      <div class="title">护眼时间到！</div>
      <div class="tip">
        请眺望<span class="highlight">6米外</span>的物体<br>
        <span class="subtip">持续${this.breakDuration}秒眼部放松</span>
      </div>
    `;

		this.button = document.createElement('button');
		this.button.className = 'confirm-button';
		this.button.innerHTML = '✅ 已完成休息';

		this.countdown = document.createElement('div');
		this.countdown.className = 'countdown';

		this.container.append(icon, content, this.countdown, this.button);
		document.body.appendChild(this.container);
	}

	// 增加监听
	setupListeners() {
		this.button.addEventListener('click', () => this.handleConfirm());
		window.addEventListener('resize', () => this.checkViewport());

		// 增加消息监听器存在性检查
		if (chrome.runtime?.onMessage) {
			chrome.runtime.onMessage.addListener((msg) => {
				if (msg.action === 'showReminder') {
					console.log('this.show');
					this.show()
				}
				if (msg.action === 'contextInvalidated') {
					console.log('扩展上下文失效，正在重新加载...');
					// window.location.reload();
				}
			});
		}
		// 监听配置项修改
		chrome.storage.onChanged.addListener((changes) => {
			if (changes.reminderSettings) {
				this.remainingTime = changes.reminderSettings.newValue.breakDuration;
				this.breakDuration = changes.reminderSettings.newValue.breakDuration;
				this.updateNotificationContent();
			}
		});
	}

	// 更新提示内容和定时器
	updateNotificationContent() {
		const subtip = this.container.querySelector('.subtip');
		subtip.textContent = `持续${this.remainingTime}秒眼部放松`;
		this.updateCountdown();
	}

	// 适配窗口
	checkViewport() {
		const isMobile = window.matchMedia('(max-width: 600px)').matches;
		this.container.classList.toggle('mobile-view', isMobile);
	}

	show() {
		console.log('show');
		this.remainingTime = this.breakDuration;
		this.container.classList.add('visible');
		this.startCountdown();
	}

	startCountdown() {
		this.updateCountdown();

		this.autoCloseTimer = setInterval(() => {
			this.remainingTime--;
			this.updateCountdown();

			if (this.remainingTime <= 0) {
				console.log('自动关闭');
				chrome.runtime.sendMessage({ action: 'skipTimer' });
				this.handleConfirm();
			}
		}, 1000);
	}

	updateCountdown() {
		this.countdown.innerHTML = `自动关闭剩余：${this.remainingTime}s`;
	}

	handleConfirm() {
		clearInterval(this.autoCloseTimer);
		this.autoCloseTimer = null;
		this.container.classList.remove('visible');
		chrome.runtime.sendMessage({ action: 'restartTimer' });
	}
}

new EyeNotifier();