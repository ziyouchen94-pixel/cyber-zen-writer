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

const rainValue = document.getElementById('rainValue');
const blurValue = document.getElementById('blurValue');
const noiseValue = document.getElementById('noiseValue');
const musicValue = document.getElementById('musicValue');
const debugEl = document.getElementById('debug');

// Background
const BACKGROUND = './bg.jpg';

// Audio
let audioCtx = null, noiseNode = null, noiseGain = null, musicSource = null, musicGain = null, musicBuffer = null;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
    }

    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;
    noiseGain = audioCtx.createGain();
    noiseGain.gain.value = parseFloat(noiseVolumeSlider.value);
    noiseNode.connect(noiseGain).connect(audioCtx.destination);
    noiseNode.start();
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
        if (noiseGain) noiseGain.gain.value = parseFloat(noiseVolumeSlider.value);
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
        if (confirm('Clear all text?')) { editor.value = ''; localStorage.removeItem('cyberzen-text'); }
    });
    exportBtn.addEventListener('click', () => {
        const blob = new Blob([editor.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `zen-${new Date().toISOString().slice(0,10)}.txt`;
        a.click(); URL.revokeObjectURL(url);
    });

    // Mixer toggle: click gear icon
    mixerToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        mixerContainer.classList.toggle('visible');
    });

    // Click outside to close mixer
    document.addEventListener('click', (e) => {
        if (mixerContainer.classList.contains('visible') && !mixerContainer.contains(e.target) && e.target !== mixerToggle) {
            mixerContainer.classList.remove('visible');
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
