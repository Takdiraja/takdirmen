/**
 * BACKTOBACK GAME
 * VERSION 1.0 (Final Release)
 */

class OsuGame {
    constructor() {
        this.config = {
            circleCount: 3, 
            timeLimit: 60000,
            circleSize: 100,
            themeColor: '#00ff88',
            lives: 3,
            secondsPerCircle: 2.5 
        };

        this.state = {
            currentNumber: 1,
            gameActive: false,
            startTime: 0,
            timerInterval: null,
            level: 1,
            remainingLives: 3,
            spawnedCount: 0,
            circleTimeouts: {},
            lastCirclePos: null,
            countdownInterval: null,
            countdownActive: false
        };

        this.initAudio();
        this.bindElements();
        this.addEventListeners();
    }

    initAudio() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playSound(frequency, type = 'sine', duration = 0.1) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }

    playClickSound() { this.playSound(800, 'square', 0.1); }
    playFailSound() { this.playSound(150, 'sawtooth', 0.5); }
    playWinSound() { 
        this.playSound(600, 'sine', 0.2);
        setTimeout(() => this.playSound(800, 'sine', 0.3), 100);
    }

    bindElements() {
        this.playArea = document.getElementById('play-area');
        this.timerBar = document.getElementById('timer-bar');
        this.levelDisplay = document.getElementById('level-display');
        this.livesDisplay = document.getElementById('lives-display');
        this.startScreen = document.getElementById('start-screen');
        this.resultScreen = document.getElementById('result-screen');
        this.settingsModal = document.getElementById('settings-modal');
        this.resultTitle = document.getElementById('result-title');
        this.resultTime = document.getElementById('result-time');
        this.connectionLine = document.getElementById('connection-line');
        
        this.configDifficulty = document.getElementById('config-difficulty');
        this.configTimeLimit = document.getElementById('config-time-limit');
        this.configColor = document.getElementById('config-color');
        this.configTimePerCircle = document.getElementById('config-time-per-circle');
        
        this.countdownOverlay = document.getElementById('countdown-overlay');
        this.countdownText = document.getElementById('countdown-text');
    }

    addEventListeners() {
        document.getElementById('start-btn').onclick = () => this.startGame();
        document.getElementById('settings-btn').onclick = () => this.toggleSettings(true);
        document.getElementById('retry-btn').onclick = () => this.startGame();
        document.getElementById('home-btn').onclick = () => this.showStartScreen();
        document.getElementById('close-settings').onclick = () => this.toggleSettings(false);
        document.getElementById('save-settings').onclick = () => this.saveSettings();
    }

    startGame() {
        if (this.state.countdownActive) return;
        this.resetState();
        this.hideAllScreens();
        
        this.state.countdownActive = true;
        this.startCountdown(() => {
            this.state.countdownActive = false;
            this.state.gameActive = true;
            console.log("GAME START: BackToBack Game");
            
            // Spawn Two Initial Circles (Current + Next)
            this.spawnNextCircle();
            this.spawnNextCircle();
            this.updateTarget();
            this.startTimer();
        });
    }

    startCountdown(callback) {
        this.countdownOverlay.classList.add('visible');
        let count = 3;
        this.countdownText.textContent = count;
        this.playClickSound();

        this.state.countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                this.countdownText.textContent = count;
                this.playClickSound();
            } else if (count === 0) {
                this.countdownText.textContent = "GO!";
                this.playWinSound();
            } else {
                clearInterval(this.state.countdownInterval);
                this.countdownOverlay.classList.remove('visible');
                this.countdownText.textContent = ''; 
                callback();
            }
        }, 800);
    }

    resetState() {
        this.hideAllScreens(); 
        this.state.currentNumber = 1;
        this.state.remainingLives = this.config.lives;
        this.state.startTime = Date.now();
        this.state.spawnedCount = 0;
        this.state.lastCirclePos = null;
        this.state.gameActive = false; 
        this.state.countdownActive = false;
        
        this.connectionLine.style.display = 'none';
        this.countdownText.textContent = '';

        if (this.state.circleTimeouts) {
            Object.values(this.state.circleTimeouts).forEach(t => clearTimeout(t));
        }
        this.state.circleTimeouts = {};
        
        clearInterval(this.state.timerInterval);
        clearInterval(this.state.countdownInterval);
        this.state.timerInterval = null;
        this.state.countdownInterval = null;

        this.playArea.innerHTML = '';
        this.timerBar.style.width = '100%';
        this.livesDisplay.textContent = this.state.remainingLives;
        this.levelDisplay.textContent = String(this.state.level).padStart(2, '0');
    }

    spawnNextCircle() {
        if (this.state.spawnedCount >= this.config.circleCount) return;

        this.state.spawnedCount++;
        const num = this.state.spawnedCount;
        
        const circle = document.createElement('div');
        circle.className = 'circle';
        circle.id = `circle-${num}`;
        circle.textContent = num;
        
        const margin = 80;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const minX = (w * 0.5) + margin; 
        const maxX = w - margin;
        const minY = (h * 0.3) + margin; 
        const maxY = h - margin;

        let x, y;
        let attempts = 0;
        if (this.state.lastCirclePos) {
            let found = false;
            while (!found && attempts < 20) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 220 + Math.random() * 80; // Compact: 220-300px
                const tx = this.state.lastCirclePos.x + Math.cos(angle) * dist;
                const ty = this.state.lastCirclePos.y + Math.sin(angle) * dist;
                if (tx >= minX && tx <= maxX && ty >= minY && ty <= maxY) {
                    x = tx; y = ty; found = true;
                }
                attempts++;
            }
            if (!found) {
                x = Math.max(minX, Math.min(maxX, this.state.lastCirclePos.x + (Math.random()-0.5)*400));
                y = Math.max(minY, Math.min(maxY, this.state.lastCirclePos.y + (Math.random()-0.5)*400));
            }
        } else {
            x = (Math.random()*(maxX-minX)) + minX;
            y = (Math.random()*(maxY-minY)) + minY;
        }
        
        this.state.lastCirclePos = { x, y };
        circle.style.left = `${x - 50}px`; 
        circle.style.top = `${y - 50}px`;
        circle.style.borderColor = this.config.themeColor;
        circle.style.setProperty('--approach-time', `${this.config.secondsPerCircle}s`);
        
        // Initial visibility for next circle
        if (num > this.state.currentNumber) {
            circle.style.opacity = '0.3';
        }

        circle.onclick = (e) => this.handleCircleClick(num, circle);
        this.playArea.appendChild(circle);

        this.state.circleTimeouts[num] = setTimeout(() => {
            if (this.state.gameActive && this.state.currentNumber === num) {
                this.handleFail();
                circle.remove();
                this.state.currentNumber++;
                this.updateTarget();
                this.spawnNextCircle();
                if (this.state.currentNumber > this.config.circleCount) this.endGame(false);
            }
        }, this.config.secondsPerCircle * 1000);
    }

    updateTarget() {
        // High visibility for current target
        const current = document.getElementById(`circle-${this.state.currentNumber}`);
        if (current) {
            current.style.opacity = '1';
            current.style.boxShadow = `0 0 30px ${this.config.themeColor}`;
            current.classList.add('active'); // Trigger approach ring animation
        }
        
        // Semi-visibility for next target
        const next = document.getElementById(`circle-${this.state.currentNumber + 1}`);
        if (next) {
            next.style.opacity = '0.3';
            
            // Connect current to next
            const x1 = parseFloat(current.style.left) + 50;
            const y1 = parseFloat(current.style.top) + 50;
            const x2 = parseFloat(next.style.left) + 50;
            const y2 = parseFloat(next.style.top) + 50;
            this.updateLine(x1, y1, x2, y2);
        } else {
            this.connectionLine.style.display = 'none';
        }
    }

    updateLine(x1, y1, x2, y2) {
        this.connectionLine.setAttribute('x1', x1);
        this.connectionLine.setAttribute('y1', y1);
        this.connectionLine.setAttribute('x2', x2);
        this.connectionLine.setAttribute('y2', y2);
        this.connectionLine.style.display = 'block';
        this.connectionLine.style.stroke = this.config.themeColor;
        this.connectionLine.style.opacity = '0.3';
    }

    handleCircleClick(num, element) {
        if (!this.state.gameActive) return;

        if (num === this.state.currentNumber) {
            this.playClickSound();
            clearTimeout(this.state.circleTimeouts[num]);
            
            element.style.transform = 'scale(0)';
            element.style.opacity = '0';
            setTimeout(() => element.remove(), 300);
            
            this.state.currentNumber++;
            this.updateTarget();
            this.spawnNextCircle(); 
            
            if (this.state.currentNumber > this.config.circleCount) {
                this.endGame(true);
            }
        } else {
            this.handleFail();
        }
    }

    handleFail() {
        this.playFailSound();
        this.state.remainingLives--;
        this.livesDisplay.textContent = this.state.remainingLives;
        this.playArea.classList.add('shake');
        setTimeout(() => this.playArea.classList.remove('shake'), 400);
        if (this.state.remainingLives <= 0) this.endGame(false);
    }

    startTimer() {
        const duration = this.config.timeLimit;
        let elapsed = 0;
        this.state.timerInterval = setInterval(() => {
            elapsed += 100;
            const percentage = 100 - (elapsed / duration) * 100;
            this.timerBar.style.width = `${Math.max(0, percentage)}%`;
            if (percentage <= 0) this.endGame(false);
        }, 100);
    }

    endGame(success) {
        this.state.gameActive = false;
        clearInterval(this.state.timerInterval);
        this.connectionLine.style.display = 'none';
        
        if (success) {
            this.playWinSound();
            this.resultTitle.textContent = "SUCCESS";
            this.resultTitle.style.color = this.config.themeColor;
        } else {
            this.playFailSound();
            this.resultTitle.textContent = "FAILED";
            this.resultTitle.style.color = "#ff3e3e";
        }
        
        const timeTaken = ((Date.now() - this.state.startTime) / 1000).toFixed(2);
        this.resultTime.textContent = `${timeTaken}s`;
        setTimeout(() => { this.resultScreen.classList.add('visible'); }, 500);
    }

    showStartScreen() {
        this.resetState();
        this.startScreen.classList.add('visible');
    }

    hideAllScreens() {
        this.startScreen.classList.remove('visible');
        this.resultScreen.classList.remove('visible');
        this.countdownOverlay.classList.remove('visible');
        this.settingsModal.classList.remove('visible');
    }

    toggleSettings(show) {
        if (show) this.settingsModal.classList.add('visible');
        else this.settingsModal.classList.remove('visible');
    }

    saveSettings() {
        const timeVal = this.configTimePerCircle.value.replace(',', '.');
        this.config.secondsPerCircle = parseFloat(timeVal) || 2.5;
        this.config.timeLimit = parseInt(this.configTimeLimit.value) || 60000;
        this.config.themeColor = this.configColor.value || '#00ff88';
        const difficulty = this.configDifficulty.value;
        const counts = { easy: 3, medium: 30, hard: 80, insane: 150 };
        this.config.circleCount = counts[difficulty] || 3;
        document.documentElement.style.setProperty('--primary-color', this.config.themeColor);
        this.toggleSettings(false);
        this.playClickSound();
    }
}

window.onload = () => { window.game = new OsuGame(); };
