import { initRainShader } from './shader.js';

const canvas = document.getElementById('canvas');
const editor = document.getElementById('editor');
const rainSlider = document.getElementById('rainAmount');
const blurSlider = document.getElementById('blurAmount');
const noiseVolumeSlider = document.getElementById('noiseVolume');
const musicVolumeSlider = document.getElementById('musicVolume');
const musicFileInput = document.getElementById('musicFile');
const clearBtn = document.getElementById('clear-btn');
const exportBtn = document.getElementById('export-btn');
const mixerToggle = document.getElementById('mixer-toggle');
const mixerContainer = document.getElementById('mixer-container');
const fontToggle = document.getElementById('font-toggle');
const fontPanel = document.getElementById('font-panel');
const rainPlayBtn = document.getElementById('rain-play');
let isRainPlaying = false;
const fontBtns = document.querySelectorAll('.font-btn');
const sizeBtns = document.querySelectorAll('.size-btn');  // 18px, 26px, 36px

const rainValue = document.getElementById('rainValue');
const blurValue = document.getElementById('blurValue');
const noiseValue = document.getElementById('noiseValue');
const musicValue = document.getElementById('musicValue');
const debugEl = document.getElementById('debug');

// Background
const BACKGROUND = './bg.jpg';

// Font families (Chinese)
const FONTS = {
    hand: "'Ma Shan Zheng', cursive",
    serif: "'Noto Serif SC', serif",
    sans: "'Noto Sans SC', system-ui, sans-serif"
};

// Set defaults: hand + medium size (26px)
editor.style.fontFamily = FONTS.hand;
editor.style.fontSize = '26px';
fontBtns.forEach(btn => { if (btn.dataset.font === 'hand') btn.classList.add('active'); });
sizeBtns.forEach(btn => { if (btn.dataset.size === '26') btn.classList.add('active'); });

// Font switch
fontBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const font = btn.dataset.font;
        editor.style.fontFamily = FONTS[font];
        fontBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Font size (three presets)
sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const size = btn.dataset.size;
        editor.style.fontSize = size + 'px';
        sizeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        localStorage.setItem('cyberzen-fontSize', size);
    });
});

// Load saved font size
const savedSize = localStorage.getItem('cyberzen-fontSize');
if (savedSize) {
    editor.style.fontSize = savedSize + 'px';
    sizeBtns.forEach(btn => { if (btn.dataset.size === savedSize) btn.classList.add('active'); });
}

// Audio
let audioCtx = null, rainSource = null, rainGain = null, rainBuffer = null, musicSource = null, musicGain = null, musicBuffer = null;

async function startRain() {
    if (!audioCtx) initAudio();
    try {
        if (!rainBuffer) {
            const response = await fetch('./rain.mp3');
            if (!response.ok) throw new Error('rain.mp3 not found');
            const arrayBuffer = await response.arrayBuffer();
            rainBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        }
        if (rainSource) { rainSource.stop(); rainSource.disconnect(); }
        rainSource = audioCtx.createBufferSource();
        rainSource.buffer = rainBuffer;
        rainSource.loop = true;
        rainGain = audioCtx.createGain();
        rainGain.gain.value = parseFloat(noiseVolumeSlider.value);
        rainSource.connect(rainGain).connect(audioCtx.destination);
        rainSource.start();
        isRainPlaying = true;
        if (rainPlayBtn) rainPlayBtn.textContent = '🔊';
    } catch (err) {
        console.error('Failed to load rain.mp3:', err);
    }
}

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

try {
    const rain = initRainShader(canvas, BACKGROUND);

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize();

    // Sliders
    rainSlider.addEventListener('input', (e) => {
        rain.setRainAmount(parseFloat(e.target.value));
        rainValue.textContent = Math.round(parseFloat(e.target.value) * 100) + '%';
    });
    blurSlider.addEventListener('input', (e) => {
        rain.setBlurAmount(parseFloat(e.target.value));
        blurValue.textContent = Math.round(parseFloat(e.target.value) * 100) + '%';
    });
    noiseVolumeSlider.addEventListener('input', () => {
        if (!audioCtx) initAudio();
        if (rainGain) rainGain.gain.value = parseFloat(noiseVolumeSlider.value);
        noiseValue.textContent = Math.round(parseFloat(noiseVolumeSlider.value) * 100) + '%';
    });
    musicVolumeSlider.addEventListener('input', () => {
        if (!audioCtx) initAudio();
        if (musicGain) musicGain.gain.value = parseFloat(musicVolumeSlider.value);
        musicValue.textContent = Math.round(parseFloat(musicVolumeSlider.value) * 100) + '%';
    });

    // Music upload
    musicFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!audioCtx) initAudio();
        try {
            const arrayBuffer = await file.arrayBuffer();
            const decoded = await audioCtx.decodeAudioData(arrayBuffer);
            musicBuffer = decoded;
            if (musicSource) { musicSource.stop(); musicSource.disconnect(); }
            musicSource = audioCtx.createBufferSource();
            musicSource.buffer = musicBuffer;
            musicSource.loop = true;
            musicGain = audioCtx.createGain();
            musicGain.gain.value = parseFloat(musicVolumeSlider.value);
            musicSource.connect(musicGain).connect(audioCtx.destination);
            musicSource.start();
        } catch (err) { console.error('Music load failed:', err); }
    });

    // Text persistence
    const saved = localStorage.getItem('cyberzen-text');
    if (saved) editor.value = saved;
    editor.addEventListener('input', () => localStorage.setItem('cyberzen-text', editor.value));

    // Buttons
    clearBtn.addEventListener('click', () => {
        editor.classList.add('smoke-out');
        setTimeout(() => {
            editor.value = '';
            localStorage.removeItem('cyberzen-text');
            editor.classList.remove('smoke-out');
        }, 1500); // match animation duration (1.5s)
    });
    exportBtn.addEventListener('click', () => {
        const blob = new Blob([editor.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `zen-${new Date().toISOString().slice(0,10)}.txt`;
        a.click(); URL.revokeObjectURL(url);
    });

    // Mixer toggle
    mixerToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        mixerContainer.classList.toggle('visible');
    });

    // Font panel toggle
    fontToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        fontPanel.classList.toggle('visible');
    });

    // Rain play/pause toggle
    rainPlayBtn.addEventListener('click', async () => {
        if (isRainPlaying) {
            rainSource.stop();
            isRainPlaying = false;
            rainPlayBtn.textContent = '🔇';
        } else {
            await startRain();
        }
    });

    document.addEventListener('click', (e) => {
        if (mixerContainer.classList.contains('visible') && !mixerContainer.contains(e.target) && e.target !== mixerToggle) {
            mixerContainer.classList.remove('visible');
        }
        if (fontPanel.classList.contains('visible') && !fontPanel.contains(e.target) && e.target !== fontToggle) {
            fontPanel.classList.remove('visible');
        }
    });

    // Animation loop
    const loop = (time) => {
        rain.render(time);
        if (debugEl) debugEl.textContent = `blur=${blurSlider.value} rain=${rainSlider.value}`;
        requestAnimationFrame(loop);
    };
    loop(performance.now());

} catch (e) {
    console.error('Init failed:', e);
    document.body.innerHTML = `<div style="padding:20px;color:white;font-family:sans-serif">${e.message}<br>Use Chrome/Edge with WebGL2.</div>`;
}
