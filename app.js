/**
 * Toplu Yatırım - app.js
 * Frontend Logic & API Mocks
 */

// --- CONFIGURATION ---
const WEBHOOK_URLS = {
    AUTH: 'https://tamamdir.app.n8n.cloud/webhook-test/ea0312fd-369a-4787-a3ab-13bb9d3fe0e7',
    SUBMIT_ACTION: 'https://tamamdir.app.n8n.cloud/webhook-test/186520f5-af8f-41eb-a23b-add104802a0e',
    GET_ASSETS: 'https://tamamdir.app.n8n.cloud/webhook-test/get-assets'
};

// --- MOCK DATA ---
const MOCK_ASSETS = [];

// --- DOM ELEMENTS ---
const elements = {
    // Views
    authView: document.getElementById('auth-view'),
    dashboardView: document.getElementById('dashboard-view'),
    
    // Auth Forms
    loginFormContainer: document.getElementById('login-form-container'),
    registerFormContainer: document.getElementById('register-form-container'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    
    // Auth Buttons
    switchToRegisterBtn: document.getElementById('switch-to-register'),
    switchToLoginBtn: document.getElementById('switch-to-login'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Dashboard Elements
    userEmailDisplay: document.getElementById('user-email-display'),
    actionForm: document.getElementById('action-form'),
    fileUpload: document.getElementById('file-upload'),
    fileNameDisplay: document.getElementById('file-name-display'),
    dropzone: document.getElementById('dropzone'),
    submitActionBtn: document.getElementById('submit-action-btn'),
    assetTableBody: document.getElementById('asset-table-body'),
    totalPortfolioValue: document.getElementById('total-portfolio-value'),
    
    toastContainer: document.getElementById('toast-container')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
});

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Form Switchers
    elements.switchToRegisterBtn.addEventListener('click', () => {
        toggleAuthForms('register');
    });
    
    elements.switchToLoginBtn.addEventListener('click', () => {
        toggleAuthForms('login');
    });

    // Auth Submits
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.logoutBtn.addEventListener('click', handleLogout);

    // Dashboard Actions
    elements.actionForm.addEventListener('submit', handleActionSubmit);
    
    // File Upload Drag & Drop Styling
    elements.fileUpload.addEventListener('change', handleFileSelect);
    elements.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropzone.classList.add('dragover');
    });
    elements.dropzone.addEventListener('dragleave', () => {
        elements.dropzone.classList.remove('dragover');
    });
    elements.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            elements.fileUpload.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });
}

// --- AUTHENTICATION ---
function checkAuthStatus() {
    const userEmail = localStorage.getItem('toplu_yatirim_user');
    if (userEmail) {
        showDashboard(userEmail);
    } else {
        showAuthView();
    }
}

function toggleAuthForms(target) {
    const loginForm = elements.loginFormContainer;
    const registerForm = elements.registerFormContainer;

    if (target === 'register') {
        loginForm.classList.add('hidden-section');
        loginForm.classList.remove('fade-in');
        registerForm.classList.remove('hidden-section');
        registerForm.classList.add('fade-in');
    } else {
        registerForm.classList.add('hidden-section');
        registerForm.classList.remove('fade-in');
        loginForm.classList.remove('hidden-section');
        loginForm.classList.add('fade-in');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Giriş Yapılıyor...';
    btn.disabled = true;

    try {
        const response = await fetch(WEBHOOK_URLS.AUTH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actionType: 'login', email, password })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('toplu_yatirim_user', email);
            showToast(data.message || 'Başarıyla giriş yapıldı!', 'success');
            showDashboard(email);
        } else {
            throw new Error(data.message || 'Giriş başarısız.');
        }
        
    } catch (error) {
        console.error('Login Error:', error);
        showToast(error.message || 'Giriş yapılırken bir hata oluştu.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';
    btn.disabled = true;

    try {
        const response = await fetch(WEBHOOK_URLS.AUTH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actionType: 'register', name, email, password })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message || 'Hesabınız oluşturuldu. Giriş yapabilirsiniz.', 'success');
            toggleAuthForms('login');
            document.getElementById('login-email').value = email;
        } else {
            throw new Error(data.message || 'Kayıt işlemi başarısız.');
        }
        
    } catch (error) {
        console.error('Register Error:', error);
        showToast(error.message || 'Kayıt olurken bir hata oluştu.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function handleLogout() {
    localStorage.removeItem('toplu_yatirim_user');
    elements.loginForm.reset();
    showAuthView();
    showToast('Çıkış yapıldı.', 'info');
}

// --- VIEW MANAGEMENT ---
function showDashboard(email) {
    elements.authView.classList.add('hidden-section');
    elements.dashboardView.classList.remove('hidden-section');
    elements.userEmailDisplay.textContent = email;
    
    // Load data when dashboard is shown
    loadAssetsData();
}

function showAuthView() {
    elements.dashboardView.classList.add('hidden-section');
    elements.authView.classList.remove('hidden-section');
}

// --- DASHBOARD ACTIONS ---
function handleFileSelect() {
    const file = elements.fileUpload.files[0];
    const varlikKoduInput = document.getElementById('varlik-kodu');
    const adetInput = document.getElementById('adet');

    if (file) {
        elements.fileNameDisplay.textContent = file.name;
        elements.fileNameDisplay.classList.remove('hidden');
        
        // Disable inputs if file is present
        varlikKoduInput.disabled = true;
        varlikKoduInput.value = '';
        varlikKoduInput.placeholder = 'Veriler dosyadan okunacak...';
        varlikKoduInput.classList.add('bg-slate-100', 'text-slate-400');
        
        adetInput.disabled = true;
        adetInput.value = '';
        adetInput.placeholder = 'Veriler dosyadan okunacak...';
        adetInput.classList.add('bg-slate-100', 'text-slate-400');
    } else {
        elements.fileNameDisplay.classList.add('hidden');
        
        // Enable inputs if no file
        varlikKoduInput.disabled = false;
        varlikKoduInput.placeholder = 'Örn: THYAO';
        varlikKoduInput.classList.remove('bg-slate-100', 'text-slate-400');
        
        adetInput.disabled = false;
        adetInput.placeholder = 'Örn: 100';
        adetInput.classList.remove('bg-slate-100', 'text-slate-400');
    }
}

async function handleActionSubmit(e) {
    e.preventDefault();
    
    const actionType = document.querySelector('input[name="action_type"]:checked').value;
    const file = elements.fileUpload.files[0];
    const userEmail = localStorage.getItem('toplu_yatirim_user');
    const varlikKodu = document.getElementById('varlik-kodu').value;
    const adet = document.getElementById('adet').value;

    if (!actionType) {
        showToast('Lütfen bir işlem tipi seçiniz.', 'warning');
        return;
    }

    if (!file && (!varlikKodu || !adet)) {
        showToast('Lütfen ya bir dosya yükleyin ya da bilgileri elle girin.', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('email', userEmail);
    formData.append('actionType', actionType);
    formData.append('varlik_kodu', varlikKodu);
    formData.append('adet', adet);
    
    if (file) {
        formData.append('file', file);
    }

    const btn = elements.submitActionBtn;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gönderiliyor...';
    btn.disabled = true;

    try {
        const response = await fetch(WEBHOOK_URLS.SUBMIT_ACTION, {
            method: 'POST',
            body: formData // multipart/form-data
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message || 'İşlem başarıyla n8n sistemine iletildi', 'success');
            elements.actionForm.reset();
            handleFileSelect(); // Reset UX states and hide file name display
            
            // Refresh table data
            loadAssetsData();
        } else {
            throw new Error(data.message || 'İşlem başarısız.');
        }
        
    } catch (error) {
        console.error('Submit Error:', error);
        showToast(error.message || 'İşlem gönderilirken hata oluştu.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- TABLE DATA MANAGEMENT ---
async function loadAssetsData() {
    const userEmail = localStorage.getItem('toplu_yatirim_user');
    
    if (!userEmail) {
        showToast('Oturum bilgisi bulunamadı. Lütfen giriş yapın.', 'error');
        return;
    }

    let assets = [];

    try {
        const response = await fetch(WEBHOOK_URLS.GET_ASSETS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        // n8n'den dönen JSON dizisi doğrudan array olarak kabul ediliyor
        assets = await response.json();
        
        if (!Array.isArray(assets)) {
            assets = []; // Gelen veri bir dizi değilse boş diziye çevir
        }
        
    } catch (error) {
        console.error('Fetch Assets Error:', error);
        showToast('Varlıklar yüklenirken bir hata oluştu', 'error');
        return;
    }

    renderAssetTable(assets);
}

function renderAssetTable(assets) {
    elements.assetTableBody.innerHTML = '';
    let grandTotal = 0;

    if (assets.length === 0) {
        elements.assetTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-12 py-16 text-center">
                    <div class="flex flex-col items-center justify-center space-y-2">
                        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2 shadow-sm">
                            <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-slate-700">Varlıklarınız Burada Görünür</h3>
                        <p class="text-sm text-slate-400">Henüz Varlık Eklemediniz</p>
                    </div>
                </td>
            </tr>
        `;
        elements.totalPortfolioValue.textContent = '0,00 ₺';
        return;
    }

    assets.forEach((asset, index) => {
        grandTotal += asset.toplamDeger;
        
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors group';
        tr.style.animation = `fadeIn 0.3s ease-out ${index * 0.1}s forwards`;
        tr.style.opacity = '0';
        
        // Format numbers
        const formattedAdet = new Intl.NumberFormat('tr-TR').format(asset.adet);
        const formattedFiyat = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(asset.guncelFiyat);
        const formattedToplam = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(asset.toplamDeger);
        
        // Format date
        const dateObj = new Date(asset.guncellemeTarihi);
        const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

        // Badge color based on type
        let badgeColor = 'bg-slate-100 text-slate-800';
        if (asset.tur.includes('Hisse')) badgeColor = 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
        if (asset.tur.includes('Emtia') || asset.tur.includes('Altın')) badgeColor = 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
        if (asset.tur.includes('Kripto')) badgeColor = 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20';

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs mr-3 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                        ${asset.varlik.substring(0, 2).toUpperCase()}
                    </div>
                    <div class="text-sm font-semibold text-slate-900">${asset.varlik}</div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${badgeColor}">
                    ${asset.tur}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">${formattedAdet}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">${formattedFiyat}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900">${formattedToplam}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">${formattedDate}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="handleDirectSell('${asset.varlik}')" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors border border-red-200 shadow-sm font-semibold">
                    Sat
                </button>
            </td>
        `;
        
        elements.assetTableBody.appendChild(tr);
    });

    elements.totalPortfolioValue.textContent = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(grandTotal);
}

// --- DIRECT SELL LOGIC ---
window.handleDirectSell = async function(varlikKodu) {
    const miktar = prompt(`Kaç adet ${varlikKodu} satmak istiyorsunuz?`);
    if (!miktar || isNaN(miktar) || Number(miktar) <= 0) {
        if (miktar !== null) {
            showToast('Geçerli bir miktar girmediniz.', 'warning');
        }
        return;
    }

    const userEmail = localStorage.getItem('toplu_yatirim_user');
    
    const formData = new FormData();
    formData.append('email', userEmail);
    formData.append('actionType', 'sell');
    formData.append('varlik_kodu', varlikKodu);
    formData.append('adet', miktar);

    try {
        const response = await fetch(WEBHOOK_URLS.SUBMIT_ACTION, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message || `${miktar} adet ${varlikKodu} başarıyla n8n sistemine iletildi`, 'success');
            // Refresh table data
            loadAssetsData();
        } else {
            throw new Error(data.message || 'Satış işlemi başarısız.');
        }
        
    } catch (error) {
        console.error('Direct Sell Error:', error);
        showToast(error.message || 'Satış işlemi gönderilirken hata oluştu.', 'error');
    }
};

// --- UTILS ---
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    
    let icon = 'fa-info-circle';
    let colors = 'bg-blue-50 border-blue-200 text-blue-800';
    
    if (type === 'success') {
        icon = 'fa-check-circle';
        colors = 'bg-green-50 border-green-200 text-green-800';
    } else if (type === 'error') {
        icon = 'fa-circle-xmark';
        colors = 'bg-red-50 border-red-200 text-red-800';
    } else if (type === 'warning') {
        icon = 'fa-triangle-exclamation';
        colors = 'bg-amber-50 border-amber-200 text-amber-800';
    }

    toast.className = `flex items-center gap-3 px-4 py-3 border rounded-lg shadow-sm transform transition-all duration-300 translate-y-full opacity-0 ${colors}`;
    toast.innerHTML = `
        <i class="fa-solid ${icon} text-lg"></i>
        <p class="text-sm font-medium">${message}</p>
    `;

    elements.toastContainer.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-y-full', 'opacity-0');
    }, 10);

    // Remove after 3s
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
