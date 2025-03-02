class EyeNotifier {
	constructor() {
		this.remainingTime = 20;
		this.initUI();
		this.setupListeners();
	}
	async loadSettings() {
		return new Promise((resolve) => {
			chrome.storage.local.get('settings', (result) => {
				if (result.settings) {
					this.remainingTime = Math.max(5, result.settings.breakDuration || 20)
				}
				resolve();
			});
		});
	}

	initUI() {
		// await this.loadSettings();
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
        <span class="subtip">持续${this.remainingTime}秒眼部放松</span>
      </div>
    `;

		this.button = document.createElement('button');
		this.button.className = 'confirm-button';
		this.button.innerHTML = '✅ 已完成休息';

		this.countdown = document.createElement('div');
		this.countdown.className = 'countdown';

		this.container.append(icon, content, this.countdown, this.button);
		document.body.appendChild(this.container);

		// 多显示器适配
		this.checkViewport();

	}

	setupListeners() {
		console.log('setupListeners');
		this.button.addEventListener('click', () => this.handleConfirm());
		window.addEventListener('resize', () => this.checkViewport());

		// 增加消息监听器存在性检查
		if (chrome.runtime?.onMessage) {
			chrome.runtime.onMessage.addListener((msg) => {
				if (msg.action === 'showReminder') this.show();
			});
		}
	}

	checkViewport() {
		const isMobile = window.matchMedia('(max-width: 600px)').matches;
		this.container.classList.toggle('mobile-view', isMobile);
	}

	show() {
		console.log('show');
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
		this.container.classList.remove('visible');
		chrome.runtime.sendMessage({ action: 'restartTimer' });
	}
}

new EyeNotifier();