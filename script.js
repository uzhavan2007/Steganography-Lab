// Handle Interactive Mouse background movement
document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    const orb1 = document.querySelector('.orb-1');
    const orb2 = document.querySelector('.orb-2');
    const orb3 = document.querySelector('.orb-3');
    
    // Subtle parallax effect for background orbs
    orb1.style.transform = `translate(${x * 50}px, ${y * 50}px)`;
    orb2.style.transform = `translate(${x * -40}px, ${y * -40}px)`;
    orb3.style.transform = `translate(${x * 30}px, ${y * -30}px) translateX(-50%)`;
});

// UI Interactions
function showTab(event, tabId) {
    // Determine which tab is active (0 for left, 1 for right)
    const isRightTab = tabId === 'decodeTab';
    const indicator = document.querySelector('.tab-indicator');
    
    if (isRightTab) {
        indicator.style.transform = 'translateX(100%)';
    } else {
        indicator.style.transform = 'translateX(0)';
    }

    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// File Upload Display Handlers
function handleFileDisplay(inputId, displayId) {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    
    input.addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
            display.textContent = e.target.files[0].name;
            display.style.color = 'var(--text-main)';
        } else {
            display.textContent = 'Choose an image (PNG/JPG)...';
            display.style.color = 'var(--text-muted)';
        }
    });

    // Drag and drop effects
    const wrapper = input.closest('.file-upload-wrapper');
    wrapper.addEventListener('dragover', (e) => {
        wrapper.classList.add('dragover');
    });
    wrapper.addEventListener('dragleave', (e) => {
        wrapper.classList.remove('dragover');
    });
    wrapper.addEventListener('drop', (e) => {
        wrapper.classList.remove('dragover');
    });
}

handleFileDisplay('encodeImage', 'encodeFileName');
handleFileDisplay('decodeImage', 'decodeFileName');


// Form Submissions
document.getElementById('encodeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('encodeImage');
    const messageInput = document.getElementById('secretMessage');
    const resultDiv = document.getElementById('encodeResult');
    
    if (!fileInput.files[0] || !messageInput.value) return;

    const btn = e.target.querySelector('button');
    const originalText = btn.querySelector('span').textContent;
    btn.querySelector('span').innerHTML = '<div class="loading-spinner"></div> Encoding...';
    btn.disabled = true;
    resultDiv.innerHTML = '';
    resultDiv.classList.add('hidden');

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    formData.append('message', messageInput.value);

    try {
        const response = await fetch('http://localhost:5000/encode', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Encoding failed');
        }

        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stego_image.png';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        resultDiv.innerHTML = '<div class="success-text"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Successfully encoded and downloaded!</div>';
        resultDiv.classList.remove('hidden');
        
        // Reset form
        e.target.reset();
        document.getElementById('encodeFileName').textContent = 'Choose an image (PNG/JPG)...';
        
    } catch (error) {
        resultDiv.innerHTML = `<div class="error-text"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> ${error.message}</div>`;
        resultDiv.classList.remove('hidden');
    } finally {
        btn.querySelector('span').textContent = originalText;
        btn.disabled = false;
    }
});

document.getElementById('decodeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('decodeImage');
    const resultDiv = document.getElementById('decodeResult');
    const messageBox = document.getElementById('extractedMessage');
    
    if (!fileInput.files[0]) return;

    const btn = e.target.querySelector('button');
    const originalText = btn.querySelector('span').textContent;
    btn.querySelector('span').innerHTML = '<div class="loading-spinner"></div> Extracting...';
    btn.disabled = true;
    resultDiv.classList.add('hidden');

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    try {
        const response = await fetch('http://localhost:5000/decode', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Decoding failed');
        }

        const data = await response.json();
        messageBox.textContent = data.message;
        messageBox.style.color = '#e9d5ff';
        resultDiv.classList.remove('hidden');
    } catch (error) {
        messageBox.textContent = `Error: ${error.message}`;
        messageBox.style.color = '#fb7185';
        resultDiv.classList.remove('hidden');
    } finally {
        btn.querySelector('span').textContent = originalText;
        btn.disabled = false;
    }
});
