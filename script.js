/**
 * BACKTOBACK GAME HUB
 * VERSION 3.10 - DEFINITIVE STABLE VERSION
 * Changes: Removed approach circles, Fixed Right-Middle position, Max Persistence.
 */

class GameHub {
    constructor() {
        this.activeGame = null;
        this.activeGameName = '';
        this.config = {
            themeColor: '#00ff88',
            osu: { count: 30, speed: 2.5, timeLimit: 60000 },
            path: { width: 140, speed: 0.003 },
            lock: { slots: 10, speed: 2.5 }
        };

        // Initialize state from LocalStorage for persistence across sessions
        this.persistence = {
            osu: localStorage.getItem('btb_configured_osu') === 'true',
            path: localStorage.getItem('btb_configured_path') === 'true'
        };

        this.bindElements();
        this.addEventListeners();
        this.initAudio();
        
        this.cursorX = window.innerWidth / 2;
        this.cursorY = window.innerHeight / 2;
    }

    initAudio() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) { console.warn("Audio Context blocked."); }
    }

    playSound(freq, type = 'sine', dur = 0.1, sweep = false) {
        if (!this.audioCtx || this.audioCtx.state === 'suspended') return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        
        if (sweep) {
            // Frequency sweep for "ndut/thump" sound - starts high, drops fast
            osc.frequency.setValueAtTime(freq * 1.5, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.1, this.audioCtx.currentTime + dur);
        } else {
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        }
        
        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + dur);
    }

    bindElements() {
        this.hud = document.getElementById('game-hud');
        this.timerNumeric = document.getElementById('timer-numeric');
        this.startScreen = document.getElementById('start-screen');
        this.resultScreen = document.getElementById('result-screen');
        this.prepModal = document.getElementById('preparation-modal');
        this.countdownOverlay = document.getElementById('countdown-overlay');
        this.countdownText = document.getElementById('countdown-text');
        this.interactionLayer = document.getElementById('game-interaction-layer');
        this.container = document.getElementById('game-container');
        
        this.prepOsu = document.getElementById('prep-settings-osu');
        this.prepPath = document.getElementById('prep-settings-path');
        this.prepLock = document.getElementById('prep-settings-lock');
        
        this.inOsuCount = document.getElementById('osu-circle-count');
        this.inOsuSpeed = document.getElementById('osu-speed');
        this.inOsuTime = document.getElementById('osu-time-limit');
        this.inPathWidth = document.getElementById('path-width');
        this.inPathSpeed = document.getElementById('path-speed');
        this.inLockSlots = document.getElementById('lock-slots');
        this.inLockSpeed = document.getElementById('lock-speed');
    }

    addEventListeners() {
        // SELECTORS: Always show modal
        document.getElementById('select-osu').onclick = (e) => { 
            e.stopPropagation(); 
            this.activeGameName = 'osu';
            this.prepareGame('osu');
        };
        document.getElementById('select-path').onclick = (e) => { 
            e.stopPropagation(); 
            this.activeGameName = 'path';
            this.prepareGame('path'); 
        };
        document.getElementById('select-lock').onclick = (e) => { 
            e.stopPropagation(); 
            this.activeGameName = 'lock';
            this.prepareGame('lock'); 
        };
        
        document.getElementById('back-to-hub-btn').onclick = () => this.showHub();
        document.getElementById('start-mission-btn').onclick = () => {
            this.launchGame();
        };

        document.getElementById('retry-btn').onclick = () => this.launchGame();
        document.getElementById('home-btn').onclick = () => this.showHub();

        window.onmousemove = (e) => { this.cursorX = e.clientX; this.cursorY = e.clientY; };
        window.ontouchmove = (e) => { 
            if(e.touches.length > 0) {
                this.cursorX = e.touches[0].clientX; 
                this.cursorY = e.touches[0].clientY; 
            }
        };
    }

    prepareGame(name) {
        if(this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
        this.activeGameName = name;
        this.hideAllScreens();
        this.prepOsu.style.display = name === 'osu' ? 'block' : 'none';
        this.prepPath.style.display = name === 'path' ? 'block' : 'none';
        this.prepLock.style.display = name === 'lock' ? 'block' : 'none';
        
        const hintText = document.getElementById('prep-hint-text');
        if (name === 'osu') {
            document.getElementById('prep-game-title').textContent = "MISSION: BACK TO BACK";
            hintText.textContent = "PRO TIP: Precision is key. One miss and it's over.";
        } else if (name === 'path') {
            document.getElementById('prep-game-title').textContent = "MISSION: SIGNAL SCRAMBLER";
            hintText.textContent = "TUTORIAL: Jaga posisi kursor (box angka) agar tetap di dalam pita hitam pekat. Kursor terkunci secara horizontal, gerakkan mouse ke ATAS/BAWAH untuk mengikuti gelombang.";
        } else {
            document.getElementById('prep-game-title').textContent = "MISSION: PRECISION LOCK";
            hintText.textContent = "TUTORIAL: Tekan SPACE atau KLIK saat indikator biru berada tepat di atas kotak hitam untuk membuka kunci.";
        }
        
        this.prepModal.classList.add('visible');
    }

    saveCurrentSettings() {
        if (this.activeGameName === 'osu') {
            this.config.osu.count = parseInt(this.inOsuCount?.value) || 30;
            this.config.osu.speed = parseFloat(this.inOsuSpeed?.value) || 2.5;
            this.config.osu.timeLimit = parseInt(this.inOsuTime?.value) || 60000;
        } else if (this.activeGameName === 'path') {
            this.config.path.width = parseInt(this.inPathWidth?.value) || 140;
            this.config.path.speed = parseFloat(this.inPathSpeed?.value) || 0.003;
        } else {
            this.config.lock.slots = parseInt(this.inLockSlots?.value) || 5;
            this.config.lock.speed = parseFloat(this.inLockSpeed?.value) || 2.5;
        }
    }

    launchGame() {
        if (this.activeGame) this.activeGame.stop(); 
        this.saveCurrentSettings();
        this.hideAllScreens();
        
        if (this.activeGameName === 'path') {
            this.activeGame = new SignalScramblerGame(this);
            this.activeGame.start();
        } else if (this.activeGameName === 'lock') {
            this.activeGame = new PrecisionLockGame(this);
            this.activeGame.start();
        } else if (this.activeGameName === 'osu') {
            // Osu has its own high-fidelity cinematic countdown, so skip the hub one
            this.activeGame = new BackToBackGame(this);
            this.activeGame.start();
        } else {
            this.startCountdown(() => {
                this.activeGame = new BackToBackGame(this);
                this.activeGame.start();
            });
        }
    }

    startCountdown(callback) {
        this.countdownOverlay.classList.add('visible');
        let count = 3;
        const tick = () => {
            if (count > 0) {
                this.countdownText.textContent = count;
                this.playSound(800, 'square');
                count--;
                setTimeout(tick, 800);
            } else {
                this.countdownText.textContent = "GO!";
                this.playSound(1000, 'sine', 0.3);
                setTimeout(() => {
                    this.countdownOverlay.classList.remove('visible');
                    callback();
                }, 600);
            }
        };
        tick();
    }

    showHub() {
        if (this.activeGame) this.activeGame.stop();
        this.hideAllScreens();
        this.hud.style.display = 'none';
        this.interactionLayer.style.display = 'none';
        this.timerNumeric.classList.remove('visible');
        this.startScreen.classList.add('visible');
    }

    hideAllScreens() {
        this.startScreen.classList.remove('visible');
        this.resultScreen.classList.remove('visible');
        this.countdownOverlay.classList.remove('visible');
        this.prepModal.classList.remove('visible');
    }

    showResult(success, time, accuracy = "100%", reason = "TIME LOST SYNC") {
        if (this.activeGame) this.activeGame.stop();
        this.hideAllScreens();
        this.hud.style.display = 'none';
        this.interactionLayer.style.display = 'none';
        this.timerNumeric.classList.remove('visible');
        if (this.hackingCursor) this.hackingCursor.style.display = 'none';
        
        const title = document.getElementById('result-title');
        title.textContent = success ? "MISSION SUCCESS" : "MISSION FAILED";
        title.style.color = success ? this.config.themeColor : "#ff3e3e";
        
        if (success) {
            const timeEl = document.getElementById('result-time');
            const labelEl = document.getElementById('result-label-time');
            if (timeEl) timeEl.textContent = `${time}s`;
            if (labelEl) labelEl.textContent = 'TIME';
        } else {
            const timeEl = document.getElementById('result-time');
            const labelEl = document.getElementById('result-label-time');
            if (labelEl) labelEl.textContent = 'FAILED';
            if (timeEl) timeEl.textContent = reason;
        }
        
        const accEl = document.getElementById('result-accuracy');
        if (accEl) {
            accEl.textContent = accuracy;
            // EXE Style: Always show accuracy, even on failure, to show how close the player was
            accEl.parentElement.style.opacity = '1';
        }
        
        this.resultScreen.classList.add('visible');
    }
}

class BackToBackGame {
    constructor(hub) {
        this.hub = hub;
        this.playArea = document.getElementById('play-area');
        this.interactionLayer = document.getElementById('game-interaction-layer');
        this.line = document.getElementById('connection-line');
        this.state = { current: 1, spawned: 0, active: false, startTime: 0, timeouts: {}, lastPos: null, score: 0 };
    }

    start() {
        this.showCountdown(() => this.run());
    }

    showCountdown(callback) {
        const overlay = document.createElement('div');
        overlay.className = 'osu-countdown-ui';
        this.hub.container.appendChild(overlay);
        
        let count = 3;
        const tick = () => {
            if (count > 0) {
                overlay.textContent = count;
                overlay.classList.remove('countdown-pop');
                void overlay.offsetWidth; // trigger reflow
                overlay.classList.add('countdown-pop');
                this.hub.playSound(800, 'square', 0.15); // Countdown tick
                count--;
                setTimeout(tick, 1000);
            } else {
                overlay.remove();
                callback();
            }
        };
        tick();
    }

    run() {
        this.state.active = true;
        this.state.score = 0;
        this.state.startTime = Date.now();
        
        // Add score UI dynamically
        this.scoreUI = document.createElement('div');
        this.scoreUI.className = 'osu-score-ui';
        this.scoreUI.innerHTML = `<span class="score-label">SCORE</span><span id="osu-score-value">0</span>`;
        this.hub.container.appendChild(this.scoreUI);
        this.scoreValueEl = document.getElementById('osu-score-value');

        this.hub.hud.style.display = 'flex';
        this.hub.timerNumeric.classList.add('visible');
        this.interactionLayer.style.display = 'block';
        
        this.interactionLayer.onclick = null;
        setTimeout(() => {
            if (this.state.active) {
                this.interactionLayer.onclick = () => this.handleFail("MISSED TARGET");
            }
        }, 100);

        this.updateHUD();
        this.spawn();
        this.spawn();
        this.updateTarget();
        this.startTimer(this.hub.config.osu.timeLimit);
    }

    stop() {
        this.state.active = false;
        clearInterval(this.timer);
        Object.values(this.state.timeouts).forEach(clearTimeout);
        this.playArea.innerHTML = '';
        if (this.scoreUI) this.scoreUI.remove();
        this.line.style.display = 'none';
        this.interactionLayer.style.display = 'none';
        this.interactionLayer.onclick = null;
    }

    spawn() {
        if (this.state.spawned >= this.hub.config.osu.count) return;
        this.state.spawned++;
        const num = this.state.spawned;
        const circle = document.createElement('div');
        circle.className = 'circle';
        circle.id = `osu-${num}`;
        circle.textContent = num;
        
        // PRECISE RIGHT-MIDDLE AREA (V3.10) - EXPANDED FOR BETTER SPACING
        // Expanded to allow "renggang" placement while staying on the right side
        const w = window.innerWidth, h = window.innerHeight;
        const minX = w * 0.72, maxX = w * 0.95;
        const minY = h * 0.30, maxY = h * 0.70;
        
        let x, y;
        if (!this.state.lastPos) {
            // First circle spawns exactly in the center of the zone
            x = (minX + maxX) / 2;
            y = (minY + maxY) / 2;
        } else {
            // Increased spacing for a less cramped feel (was 80/180)
            const minDist = 120;
            const maxDist = 220;
            
            // Try up to 20 times to find a valid position within bounds
            for (let tries = 0; tries < 20; tries++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = minDist + Math.random() * (maxDist - minDist);
                x = this.state.lastPos.x + Math.cos(angle) * dist;
                y = this.state.lastPos.y + Math.sin(angle) * dist;
                
                // If it's within bounds, break early and use this position
                if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                    break;
                }
            }
            
            // Absolute clamp fallback if all tries failed
            x = Math.max(minX, Math.min(maxX, x));
            y = Math.max(minY, Math.min(maxY, y));
        }
        
        this.state.lastPos = { x, y };

        circle.style.left = `${x - 50}px`;
        circle.style.top = `${y - 50}px`;
        circle.style.borderColor = this.hub.config.themeColor;
        circle.style.setProperty('--approach-time', `${this.hub.config.osu.speed}s`);
        if (num > this.state.current) circle.style.opacity = '0.3';
        
        circle.onclick = (e) => {
            e.stopPropagation();
            this.handleClick(num, circle, e);
        };
        this.playArea.appendChild(circle);

        this.state.timeouts[num] = setTimeout(() => {
            if (this.state.active && this.state.current === num) this.handleFail("TOO SLOW");
        }, this.hub.config.osu.speed * 1000);
    }

    updateTarget() {
        const cur = document.getElementById(`osu-${this.state.current}`);
        if (cur) { cur.style.opacity = '1'; cur.classList.add('active'); }
        const nxt = document.getElementById(`osu-${this.state.current + 1}`);
        if (cur && nxt) {
            this.line.setAttribute('x1', parseFloat(cur.style.left) + 50);
            this.line.setAttribute('y1', parseFloat(cur.style.top) + 50);
            this.line.setAttribute('x2', parseFloat(nxt.style.left) + 50);
            this.line.setAttribute('y2', parseFloat(nxt.style.top) + 50);
            this.line.style.display = 'block';
        } else this.line.style.display = 'none';
    }

    handleClick(num, el, e) {
        if (!this.state.active || num !== this.state.current) { this.handleFail("MISSED TARGET"); return; }
        
        // Thumpy "ndut" hit sound using freq sweep
        this.hub.playSound(600, 'sine', 0.15, true); 
        
        // Show Perfect! text at hit position
        if (e) this.showPerfect(e.clientX, e.clientY);
        this.addScore(750);

        clearTimeout(this.state.timeouts[num]);
        el.style.transform = 'scale(0)';
        setTimeout(() => el.remove(), 250);
        this.state.current++;
        this.updateHUD();
        if (this.state.current > this.hub.config.osu.count) {
            this.hub.showResult(true, ((Date.now() - this.state.startTime)/1000).toFixed(1), "100%", "TARGETS CLEARED");
        } else { this.updateTarget(); this.spawn(); }
    }

    showPerfect(x, y) {
        const text = document.createElement('div');
        text.className = 'perfect-text';
        text.textContent = 'Perfect!';
        text.style.left = `${x}px`;
        text.style.top = `${y}px`;
        this.hub.container.appendChild(text);
        setTimeout(() => text.remove(), 600);
    }

    addScore(points) {
        this.state.score += points;
        if (this.scoreValueEl) {
            this.scoreValueEl.textContent = this.state.score.toLocaleString();
            this.scoreValueEl.classList.remove('score-pop');
            void this.scoreValueEl.offsetWidth; // trigger reflow
            this.scoreValueEl.classList.add('score-pop');
        }
    }

    handleFail(reason = "LOST SYNC") {
        if (!this.state.active) return;
        this.hub.playSound(150, 'sawtooth');
        this.hub.showResult(false, "0.0", "", reason);
    }

    updateHUD() {
        document.getElementById('level-display').textContent = String(this.state.current).padStart(2, '0');
    }

    startTimer(limit) {
        let start = Date.now();
        this.timer = setInterval(() => {
            if (!this.state.active) return;
            let elapsed = Date.now() - start;
            let rem = Math.max(0, (limit - elapsed) / 1000);
            this.hub.timerNumeric.textContent = rem.toFixed(1) + "s";
            const bar = document.getElementById('timer-bar');
            if (bar) bar.style.width = `${((limit - elapsed) / limit) * 100}%`;
            if (rem <= 0) this.handleFail("TIME EXPIRED");
        }, 100);
    }
}

class SignalScramblerGame {
    constructor(hub) {
        this.hub = hub;
        this.container = document.getElementById('square-path-container');
        this.pathTarget = document.getElementById('scrambler-target-path');
        this.cursor = document.getElementById('scrambler-cursor');
        this.statusText = document.getElementById('scrambler-status');
        
        this.active = false;
        this.globalOffset = 0;
        this.points = [];
        this.scanX = window.innerWidth / 2; // Start center
        this.entropy = 0;
        this.isTransiting = false;
        this.transitTime = 0;
        this.accuracyPoints = [];
        this.integrity = 1.0;
    }

    start() {
        this.container.style.display = 'block';
        this.hub.hud.style.display = 'flex';
        this.hub.timerNumeric.classList.remove('visible'); // Hidden initially
        this.hub.timerNumeric.textContent = "45.0s";
        
        // Hide global cursor to prevent overlap
        if (this.hub.hackingCursor) this.hub.hackingCursor.style.display = 'none';
        
        this.active = true;
        this.entropy = 0;
        this.globalOffset = 0;
        this.isTransiting = true; 
        this.transitTime = 0;
        this.startTime = Date.now();
        this.accuracyPoints = [];
        this.integrity = 1.0; 
        
        // SAFE START: Start visual cursor in middle of screen
        this.hub.cursorY = window.innerHeight / 2;
        this.scanX = window.innerWidth / 2;
        
        this.cursor.classList.remove('danger');
        this.container.classList.remove('shake', 'shake-severe');
        
        // Match high-fidelity countdown style
        if (this.statusText) {
            this.statusText.style.opacity = '1';
            this.statusText.textContent = "3";
            this.statusText.style.fontSize = "10rem"; // Massive countdown
            this.statusText.style.top = "50%";
            this.statusText.style.left = "50%";
            this.statusText.style.transform = "translate(-50%, -50%)";
        }

        this.startTime = Date.now(); // Start countdown timer
        this.lastFrameTime = this.startTime;
        this.waveTime = 0; // Deterministic static wave start
        this.animate();
    }

    stop() {
        this.active = false;
        this.container.style.display = 'none';
        cancelAnimationFrame(this.anim);
        this.container.classList.remove('shake-severe');
        if (this.statusText) this.statusText.style.opacity = '0';
        
        // Restore global cursor visibility
        if (this.hub.hackingCursor) this.hub.hackingCursor.style.display = 'block';
    }



    getYForX(x) {
        const h = window.innerHeight, cy = h / 2;
        
        // JAGGED TRIANGLE WAVE (Flecca 2 Aesthetic)
        // High frequency sharp bends as seen in game2.mp4
        const period = 400; 
        const amplitude1 = 150;
        const wave1 = Math.abs((x % period) - (period / 2)) * (amplitude1 / (period / 4)) - (amplitude1 / 2);
        
        // Secondary jagged mechanical noise
        const period2 = 180;
        const wave2 = (Math.abs((x % period2) - (period2 / 2)) < period2 / 4) ? 40 : -40;
        
        // Final jagged touch for that "glitchy" feel
        const wave3 = (x % 80 < 40) ? 20 : -20;

        return cy + wave1 + wave2 + wave3;
    }

    updateWavePath() {
        const resolution = 15;
        const count = Math.ceil(window.innerWidth / resolution) + 5;
        this.points = [];
        let d = `M 0 `;
        for (let i = 0; i < count; i++) {
            const absoluteX = (i * resolution) + this.globalOffset;
            const y = this.getYForX(absoluteX);
            this.points.push(y);
            if (i === 0) d += `${y}`;
            else d += ` L ${i * resolution} ${y}`;
        }
        this.pathTarget.setAttribute('d', d);
    }

    animate() {
        if (!this.active) return;
        const now = Date.now();
        const dt = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;
        
        if (!this.isTransiting) {
            this.waveTime += dt;
        }
        
        if (this.isTransiting) {
            const elapsedIntro = (now - this.startTime) / 1000;
            const introDuration = 3.0; // 3 seconds total
            const remTransit = introDuration - elapsedIntro;
            
            if (this.statusText) {
                const prevText = this.statusText.textContent;
                if (remTransit > 2.0) this.statusText.textContent = "3";
                else if (remTransit > 1.0) this.statusText.textContent = "2";
                else if (remTransit > 0.0) this.statusText.textContent = "1";
                
                if (prevText !== this.statusText.textContent) {
                    this.hub.playSound(800, 'square', 0.15); // Beep on 3-2-1
                    this.statusText.classList.remove('countdown-pop');
                    void this.statusText.offsetWidth;
                    this.statusText.classList.add('countdown-pop');
                }
            }

            const scale = Math.max(1, 1 + (remTransit / introDuration) * 3); 
            const currentWidth = this.hub.config.path.width * scale;
            this.pathTarget.setAttribute('stroke-width', currentWidth);
            // Ensure path starts dark immediately to avoid white flash
            this.pathTarget.setAttribute('stroke', 'rgba(0, 0, 0, 0.6)'); 
            
            // Cursor follows mouse X smoothly even while paused
            const targetX = Math.max(window.innerWidth * 0.15, Math.min(window.innerWidth * 0.85, this.hub.cursorX));
            this.scanX += (targetX - this.scanX) * 0.15; 
            this.cursor.style.left = `${this.scanX}px`;
            this.cursor.style.top = `${this.hub.cursorY}px`;
            
            this.updateWavePath(); // Draw statically

            if (remTransit <= 0.0) {
                this.isTransiting = false;
                this.startTime = Date.now(); // Reset start time for actual gameplay
                this.pathTarget.setAttribute('stroke-width', this.hub.config.path.width);
                this.hub.timerNumeric.classList.add('visible');
                
                if (this.statusText) {
                    this.statusText.textContent = "GO!";
                    setTimeout(() => { if (this.active && this.statusText) this.statusText.style.opacity = '0'; }, 600);
                }
            }
            
            this.anim = requestAnimationFrame(() => this.animate());
            return;
        }

        const elapsed = (now - this.startTime) / 1000;
        this.entropy = Math.max(0, elapsed - 1.5);
        
        // Flexible Cursor X follows mouse horizontally (with bounds)
        const targetX = Math.max(window.innerWidth * 0.15, Math.min(window.innerWidth * 0.85, this.hub.cursorX));
        this.scanX += (targetX - this.scanX) * 0.15; 

        const speedMultiplier = 1 + (this.entropy * 0.04);
        this.globalOffset += (window.innerWidth * this.hub.config.path.speed * speedMultiplier);

        this.updateWavePath();
        
        const limitMs = 45000;
        const rem = Math.max(0, (limitMs - (now - this.startTime))/1000);
        this.hub.timerNumeric.textContent = rem.toFixed(1) + "s";
        

        this.cursor.style.left = `${this.scanX}px`;
        this.cursor.style.top = `${this.hub.cursorY}px`;
        
        const resolution = 15;
        const indexAtScanner = Math.floor(this.scanX / resolution);
        const waveY1 = this.points[indexAtScanner];
        const waveY2 = this.points[indexAtScanner + 1] || waveY1;
        
        // Linear Interpolation for true center line distance
        const t = (this.scanX % resolution) / resolution;
        const exactWaveY = waveY1 + (waveY2 - waveY1) * t;
        // PURE VERTICAL DISTANCE: Rock solid for jagged/sharp angles
        const dist = Math.abs(this.hub.cursorY - exactWaveY);
        
        // Dynamic narrowing: The path gets narrower as you progress (min 80px)
        const currentWidth = Math.max(80, this.hub.config.path.width - (this.entropy * 1.5));
        
        // EXTREME ACCURACY FIX: Buffer reduced to 5% only.
        // Player must stay perfectly within the lines.
        const maxDist = (currentWidth / 2) * 1.05; 
        
        // Update visual width
        this.pathTarget.setAttribute('stroke-width', currentWidth);

        // Track accuracy
        const accuracyPercent = Math.max(0, 100 - (dist / maxDist) * 100);
        this.accuracyPoints.push(accuracyPercent);

        // Lethal Collision Logic
        if (dist > maxDist) {
            // Calculate real-time accuracy before stopping
            const sum = this.accuracyPoints.reduce((a, b) => a + b, 0);
            const avgAcc = this.accuracyPoints.length > 0 ? (sum / this.accuracyPoints.length).toFixed(0) + "%" : "0%";

            this.hub.playSound(150, 'sawtooth', 0.3);
            this.container.classList.add('shake-severe');
            this.active = false;
            this.hub.showResult(false, "0.0", avgAcc, "CONNECTION LOST");
            setTimeout(() => {
                if (this.container) {
                    this.container.classList.remove('shake-severe');
                    this.container.style.background = 'rgba(0, 0, 0, 0.4)';
                }
            }, 500);
            return;
        } else {
            this.cursor.classList.remove('danger');
            this.container.classList.remove('shake');
        }
        
        if (rem <= 0) { 
            const avgAcc = this.accuracyPoints.length ? (this.accuracyPoints.reduce((a,b)=>a+b,0) / this.accuracyPoints.length).toFixed(1) : 100;
            this.hub.showResult(true, "45.0", `${avgAcc}%`, "DATA SECURED"); 
            return; 
        }
        this.anim = requestAnimationFrame(() => this.animate());
    }
}

window.onload = () => { window.hub = new GameHub(); };

class PrecisionLockGame {
    constructor(hub) {
        this.hub = hub;
        this.container = document.getElementById('lock-game-container');
        this.indicator = document.getElementById('lock-indicator');
        this.slotsWrapper = document.getElementById('lock-slots-wrapper');
        this.statusText = document.getElementById('lock-status');
        
        this.active = false;
        this.pos = 0; // 0 to 100
        this.slots = [];
        this.completedCount = 0;
        this.fails = 0;
        this.maxFails = 1; // 1 strike and you're out
        this.speed = 1;
        this.lastTime = 0;
        this.isTransiting = true;
        this.isPaused = false; // "Hitstop" effect
        this.lastInputTime = 0; // Prevent spam
        
        this.boundHandleInput = (e) => this.handleInput(e);
    }

    start() {
        this.container.style.display = 'block';
        this.hub.hud.style.display = 'flex';
        this.hub.timerNumeric.classList.remove('visible');
        
        this.active = true;
        this.container.classList.remove('shake', 'shake-severe'); // Clean start
        this.pos = 0; // Force start at 0%
        this.indicator.style.left = '0%'; // Ensure visual start at 0
        this.isPaused = false;
        this.completedCount = 0;
        this.fails = 0;
        this.isTransiting = true;
        this.speed = (this.hub.config.lock.speed || 2.5) * 0.7; // Reduce base speed by 30%
        
        this.initSlots();
        
        if (this.statusText) {
            this.statusText.textContent = "GET READY";
            this.statusText.classList.add('visible');
            this.statusText.style.opacity = '1';
        }

        window.addEventListener('keydown', this.boundHandleInput);
        this.container.addEventListener('mousedown', this.boundHandleInput);
        
        this.startTime = Date.now();
        this.lastTime = this.startTime;
        
        setTimeout(() => {
            this.isTransiting = false;
            if (this.statusText) this.statusText.style.opacity = '0';
            this.hub.timerNumeric.classList.add('visible');
        }, 2000);

        this.animate();
    }

    stop() {
        this.active = false;
        this.container.style.display = 'none';
        cancelAnimationFrame(this.anim);
        window.removeEventListener('keydown', this.boundHandleInput);
        this.container.removeEventListener('mousedown', this.boundHandleInput);
        if (this.statusText) {
            this.statusText.classList.remove('visible');
            this.statusText.style.opacity = '0';
        }
    }

    initSlots() {
        this.slotsWrapper.innerHTML = '';
        this.slots = [];
        const count = this.hub.config.lock.slots || 5;
        
        // Distribute slots with tighter spacing to allow for "double" targets
        const positions = [];
        const minGap = 4; // percent - allows clusters
        const margin = 10; // percent
        
        for (let i = 0; i < count; i++) {
            let p;
            let attempts = 0;
            do {
                p = margin + Math.random() * (100 - 2 * margin);
                attempts++;
            } while (positions.some(pos => Math.abs(pos - p) < minGap) && attempts < 50);
            
            positions.push(p);
            
            const el = document.createElement('div');
            el.className = 'lock-slot';
            el.style.left = `${p}%`;
            this.slotsWrapper.appendChild(el);
            
            this.slots.push({
                pos: p,
                el: el,
                completed: false
            });
        }
        
        // CRITICAL: Sort slots left-to-right to enforce sequence
        this.slots.sort((a, b) => a.pos - b.pos);
        this.updateActiveSlot();
    }

    updateActiveSlot() {
        this.slots.forEach(s => s.el.classList.remove('active'));
        const next = this.slots.find(s => !s.completed);
        if (next) next.el.classList.add('active');
    }

    handleInput(e) {
        if (!this.active || this.isTransiting) return;
        if (e.type === 'keydown' && e.code !== 'KeyE') return;
        if (e.type === 'mousedown') e.preventDefault();
        
        // Anti-spam debounce (200ms)
        const now = Date.now();
        if (now - this.lastInputTime < 200) return;
        this.lastInputTime = now;

        this.checkHit();
    }

    checkHit() {
        // Tolerance margin in percent
        const tolerance = 4; 
        const nextSlot = this.slots.find(s => !s.completed);

        if (nextSlot && Math.abs(this.pos - nextSlot.pos) < tolerance) {
            nextSlot.completed = true;
            nextSlot.el.classList.add('completed');
            nextSlot.el.classList.remove('active');
            this.completedCount++;
            this.hub.playSound(800, 'sine', 0.2);
            
            // Hitstop: Reduced to 200ms based on download.mp4 for snappier feel
            this.isPaused = true;
            setTimeout(() => { if (this.active) this.isPaused = false; }, 200);

            this.updateActiveSlot();
            // Much gentler difficulty scaling
            this.speed += 0.15;
        } else {
            // MISSED OR WRONG ORDER -> IMMEDIATE FAIL
            this.hub.playSound(150, 'sawtooth', 0.2);
            this.container.classList.add('shake');
            this.hub.showResult(false, "0.0", "", "MECHANISM JAMMED");
        }


        if (this.completedCount >= this.slots.length) {
            const time = ((Date.now() - this.startTime) / 1000 - 2).toFixed(1);
            this.hub.showResult(true, time, "100%", "LOCK BYPASSED");
        }
    }

    animate() {
        if (!this.active) return;
        
        const now = Date.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        if (!this.isTransiting && !this.isPaused) {
            // Speed is in "screens per second" roughly
            this.pos += this.speed * dt * 25; 
            if (this.pos > 100) this.pos = 0;
            
            this.indicator.style.left = `${this.pos}%`;
            
            // Sequential Check: Did we pass a target we should have hit?
            const tolerance = 4; 
            const nextSlot = this.slots.find(s => !s.completed);
            if (nextSlot && this.pos > nextSlot.pos + (tolerance * 0.8)) {
                this.hub.playSound(150, 'sawtooth', 0.2);
                this.container.classList.add('shake');
                this.hub.showResult(false, "0.0", "", "TARGET MISSED");
                return;
            }
            
            const elapsed = (now - this.startTime) / 1000 - 2;
            const limit = 15.0; // 15 second total limit
            const rem = Math.max(0, limit - elapsed);
            this.hub.timerNumeric.textContent = rem.toFixed(1) + "s";
            
            if (rem <= 0) {
                this.hub.showResult(false, "0.0", "", "TIME EXPIRED");
            }
        }

        this.anim = requestAnimationFrame(() => this.animate());
    }
}
