// Array penampung untuk fitur Unduh Semua
let currentMediaUrls = [];

// Jalanin fitur riwayat saat web dibuka
document.addEventListener("DOMContentLoaded", () => {
    loadHistory();
});

// Fitur Tombol Paste (Ambil dari Clipboard HP/PC)
async function pasteLink() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('urlInput').value = text;
    } catch (err) {
        alert('Gagal menyalin. Tolong izinkan akses clipboard pada browser Anda.');
    }
}

// Fitur Tombol Bersihkan (Silang)
function clearLink() {
    document.getElementById('urlInput').value = '';
    document.getElementById('urlInput').focus();
}

// Fungsi Fetch Data Media
async function fetchMedia() {
    const input = document.getElementById('urlInput');
    const btn = document.getElementById('downloadBtn');
    const loading = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    const errorCard = document.getElementById('error-msg');
    const errorText = document.getElementById('error-text');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const url = input.value.trim();

    if (!url) return;

    // Reset Tampilan
    btn.disabled = true;
    loading.classList.remove('hidden');
    resultDiv.innerHTML = '';
    errorCard.classList.add('hidden');
    downloadAllBtn.classList.add('hidden');
    currentMediaUrls = [];

    try {
        const response = await fetch('/api/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
            throw new Error(json.error || 'Media tidak ditemukan atau URL tidak valid.');
        }

        saveToHistory(url); // Simpan ke riwayat
        renderResult(json.data);

        // Jika hasilnya banyak (misal Slide IG), munculin tombol Unduh Semua
        if (json.data.length > 1) {
            downloadAllBtn.classList.remove('hidden');
        }

    } catch (err) {
        errorText.textContent = err.message;
        errorCard.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        loading.classList.add('hidden');
    }
}

function renderResult(medias) {
    const resultDiv = document.getElementById('result');

    medias.forEach((media, index) => {
        currentMediaUrls.push({ url: media.url, ext: media.extension || 'mp4' });

        const card = document.createElement('div');
        card.className = 'cyber-card result-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.4s ease';
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);

        let typeTitle = 'FILE_MEDIA';
        let mediaPreview = '';
        const ext = media.extension || 'mp4';
        const filename = `JHON_DOWNLOAD_${Date.now()}_${index}.${ext}`;

        if (media.type === 'video') {
            typeTitle = `DATA_VIDEO [${media.quality || 'HD'}]`;
            mediaPreview = `
                <div style="background:#000; padding:5px; border:2px solid #000;">
                    <video controls poster="${media.thumbnail || ''}" playsinline style="border:none; margin:0;">
                        <source src="${media.url}" type="video/mp4">
                    </video>
                </div>`;
        } else if (media.type === 'image') {
            typeTitle = 'DATA_GAMBAR';
            mediaPreview = `<img src="${media.url}" alt="Hasil JHON DOWNLOAD">`;
        } else if (media.type === 'audio') {
            typeTitle = 'DATA_AUDIO';
            mediaPreview = `<audio controls style="width:100%;"><source src="${media.url}" type="audio/mpeg"></audio>`;
        }

        card.innerHTML = `
            <div class="result-header">
                <span>${typeTitle}</span>
                <span class="result-badge">SUKSES</span>
            </div>
            <div class="result-body">
                ${mediaPreview}
                <div style="margin: 15px 0; font-family: 'JetBrains Mono'; font-size: 0.8rem; border-top: 2px dashed #ccc; padding-top: 10px;">
                    > NAMA FILE: ${filename} <br>
                    > UKURAN: TIDAK DIKETAHUI
                </div>
                <button class="cyber-button" style="background: var(--accent-tertiary); color:white; border-color:black;"
                    onclick="forceDownload('${media.url}', '${filename}', this)">
                    UNDUH SEKARANG
                </button>
            </div>
        `;

        resultDiv.appendChild(card);
    });
}

// Paksa browser untuk download langsung (Bukan buka tab baru)
async function forceDownload(url, filename, btnElement) {
    const originalText = btnElement.innerText;
    btnElement.innerText = "MENGUNDUH...";
    btnElement.disabled = true;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Kesalahan Jaringan");
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        
        a.click();
        
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);

    } catch (e) {
        console.error("Unduhan langsung gagal, sistem membuka di tab baru", e);
        window.location.href = url; 
    } finally {
        btnElement.innerText = "SELESAI";
        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.disabled = false;
        }, 2000);
    }
}

// Fitur Baru: Proses Semua Unduhan Bersamaan
function downloadAll() {
    const btn = document.getElementById('downloadAllBtn');
    btn.innerText = 'MEMPROSES SEMUA...';
    
    currentMediaUrls.forEach((media, i) => {
        setTimeout(() => {
            const tempBtn = document.createElement('button');
            forceDownload(media.url, `JHON_DOWNLOAD_${Date.now()}_${i}.${media.ext}`, tempBtn);
        }, i * 1500); // Jeda 1.5 detik per file biar HP gak nge-lag
    });

    setTimeout(() => {
        btn.innerText = 'UNDUH SEMUA MEDIA';
    }, currentMediaUrls.length * 1500);
}

// Simpan Riwayat Unduhan ke Penyimpanan Browser
function saveToHistory(url) {
    let history = JSON.parse(localStorage.getItem('jhon_history')) || [];
    if (history[0] !== url) {
        history.unshift(url);
        if (history.length > 5) history.pop(); // Batasi hanya ingat 5 link terakhir
        localStorage.setItem('jhon_history', JSON.stringify(history));
    }
    loadHistory();
}

function loadHistory() {
    const historyList = document.getElementById('historyList');
    let history = JSON.parse(localStorage.getItem('jhon_history')) || [];
    
    if (history.length === 0) return;

    historyList.innerHTML = '';
    history.forEach(url => {
        historyList.innerHTML += `
            <div class="history-item">
                <a href="${url}" target="_blank" class="history-link">${url}</a>
                <span style="font-size: 0.7rem; opacity: 0.5;">TERUNDUH</span>
            </div>
        `;
    });
}
