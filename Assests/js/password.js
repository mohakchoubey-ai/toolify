const config = { 
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", 
    lower: "abcdefghijklmnopqrstuvwxyz", 
    nums: "0123456789", 
    syms: "!@#$%^&*()_+-=[]{}|;:,.<>?" 
};

function toggleTheme() {
    const body = document.body;
    const text = document.getElementById('themeText');
    const icon = document.getElementById('themeIcon');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.setAttribute('data-theme', 'light');
        text.innerText = "Dark Mode";
        icon.innerText = "🌙";
    } else {
        body.setAttribute('data-theme', 'dark');
        text.innerText = "Light Mode";
        icon.innerText = "☀️";
    }
}

function generate() {
    const slider = document.getElementById('lengthSlider');
    const L = slider.value;
    document.getElementById('lenDisplay').innerText = L;
    
    let pool = config.lower;
    if(document.getElementById('upCase').checked) pool += config.upper;
    if(document.getElementById('nums').checked) pool += config.nums;
    if(document.getElementById('syms').checked) pool += config.syms;
    
    let res = "";
    // Secure Random Generation
    const randomArray = new Uint32Array(L);
    window.crypto.getRandomValues(randomArray);
    
    for(let i=0; i<L; i++) {
        res += pool[randomArray[i] % pool.length];
    }
    
    document.getElementById('passwordResult').innerText = res;
    
    const bar = document.getElementById('strengthBar');
    bar.style.width = (L/50)*100 + "%";
    bar.style.background = L < 12 ? "#ef4444" : L < 20 ? "#f59e0b" : "#10b981";
}

function copy() {
    const txt = document.getElementById('passwordResult').innerText;
    if(txt === "Click Generate") return;
    navigator.clipboard.writeText(txt);
    const t = document.getElementById('toast');
    t.style.transform = "translateY(0)";
    setTimeout(() => t.style.transform = "translateY(100px)", 2000);
}

// Event Listeners
document.getElementById('lengthSlider').oninput = generate;
window.onload = generate;
