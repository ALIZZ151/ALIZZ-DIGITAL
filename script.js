// script.js - Sistem Order Manual + Chatbot AI + Telegram Notification

// ==============================
// CHATBOT FUNCTIONS
// ==============================
let chatHistory = [];

// Chatbot Configuration
const CHATBOT_CONFIG = {
    apiEndpoint: 'https://api.kyuuimut.my.id/ai/ai4chat?question=',

    systemPrompt: `
Kamu adalah chatbot resmi untuk website ALIZZ Digital Store.

Aturan utama:
- Jawab HANYA pertanyaan yang berkaitan dengan produk dan layanan di website ini.
- Jangan mengarang atau memberikan informasi di luar konteks.
- Jika pertanyaan tidak berhubungan dengan produk atau layanan yang tersedia,
  jawab dengan kalimat berikut (tanpa tambahan apa pun):
  "Maaf, saya hanya bisa membantu seputar layanan di ALIZZ Digital Store."

Produk yang tersedia:
- Panel PTERODACTYL
- Sewa Bot WhatsApp
- Paket Role

Alur pemesanan:
- Sistem order manual
- Pembayaran melalui DANA atau GoPay

Pertanyaan pengguna:
`
};

// Initialize Chatbot
function initChatbot() {
    // DOM Elements untuk Chatbot
    const chatbotBtn = document.getElementById('chatbotBtn');
    const chatbotModal = document.getElementById('chatbotModal');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    
    console.log('Chatbot elements:', { 
        chatbotBtn: !!chatbotBtn, 
        chatbotModal: !!chatbotModal,
        chatbotClose: !!chatbotClose,
        chatMessages: !!chatMessages,
        chatInput: !!chatInput,
        chatSend: !!chatSend 
    });
    
    // Event Listeners hanya jika elemen ada
    if (chatbotBtn) {
        chatbotBtn.addEventListener('click', openChatbot);
    } else {
        console.error('Chatbot button not found!');
    }
    
    if (chatbotClose) {
        chatbotClose.addEventListener('click', closeChatbot);
    }
    
    // Send message on Enter key
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Send message on button click
    if (chatSend) {
        chatSend.addEventListener('click', sendMessage);
    }
    
    // Close modal on ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && chatbotModal && chatbotModal.classList.contains('active')) {
            closeChatbot();
        }
    });
    
    // Close modal when clicking outside
    if (chatbotModal) {
        chatbotModal.addEventListener('click', function(e) {
            if (e.target === chatbotModal) {
                closeChatbot();
            }
        });
    }
    
    // Auto focus input when modal opens
    if (chatbotModal) {
        chatbotModal.addEventListener('transitionend', function() {
            if (chatbotModal.classList.contains('active') && chatInput) {
                setTimeout(() => {
                    chatInput.focus();
                }, 100);
            }
        });
    }
    
    // Open Chatbot Modal
    function openChatbot() {
        console.log('Opening chatbot...');
        if (chatbotModal) {
            chatbotModal.classList.add('active');
            chatbotModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            
            if (chatInput) {
                setTimeout(() => {
                    chatInput.focus();
                }, 300);
            }
        }
    }
    
    // Close Chatbot Modal
    function closeChatbot() {
        console.log('Closing chatbot...');
        if (chatbotModal) {
            chatbotModal.classList.remove('active');
            chatbotModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = 'auto';
        }
    }
    
    // Add message to chat
    function addMessage(content, type = 'user') {
        if (!chatMessages) return null;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (typeof content === 'string') {
            // Sanitize HTML dan buat aman
            const tempDiv = document.createElement('div');
            tempDiv.textContent = content;
            messageContent.innerHTML = `<p>${tempDiv.innerHTML}</p>`;
        } else {
            messageContent.appendChild(content);
        }
        
        const timeSpan = document.createElement('p');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageContent.appendChild(timeSpan);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Add to history
        if (type !== 'loading') {
            chatHistory.push({
                type: type,
                content: content,
                timestamp: new Date().toISOString()
            });
        }
        
        return messageDiv;
    }
    
    // Show loading indicator
    function showLoading() {
        if (!chatMessages) return null;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot loading';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'loading-dots';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'loading-dot';
            loadingContainer.appendChild(dot);
        }
        
        contentDiv.appendChild(loadingContainer);
        loadingDiv.appendChild(contentDiv);
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return loadingDiv;
    }
    
    // Remove loading indicator
    function removeLoading(loadingElement) {
        if (loadingElement && loadingElement.parentNode) {
            loadingElement.remove();
        }
    }
    
    // Send message to API
    async function sendToAI(userMessage) {
        try {
            // Combine system prompt with user message
            const fullPrompt = `${CHATBOT_CONFIG.systemPrompt}\n\n${userMessage}`;
            const encodedPrompt = encodeURIComponent(fullPrompt);
            
            console.log('Sending to AI:', userMessage);
            
            // Send request to API
            const response = await fetch(`${CHATBOT_CONFIG.apiEndpoint}${encodedPrompt}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Extract response from API
            let aiResponse = '';
            if (data.answer) {
                aiResponse = data.answer;
            } else if (data.response) {
                aiResponse = data.response;
            } else if (data.text) {
                aiResponse = data.text;
            } else if (data.result) {
                aiResponse = data.result;
            } else {
                aiResponse = JSON.stringify(data);
            }
            
            // Clean response
            aiResponse = aiResponse.trim();
            if (aiResponse.length > 1000) {
                aiResponse = aiResponse.substring(0, 1000) + '...';
            }
            
            console.log('AI Response:', aiResponse);
            return aiResponse;
            
        } catch (error) {
            console.error('Chatbot API Error:', error);
            return `Maaf, terjadi kesalahan saat menghubungi AI Assistant. Silakan coba lagi nanti.\n\nError: ${error.message}`;
        }
    }
    
    // Send message
    async function sendMessage() {
        if (!chatInput) return;
        
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        // Clear input
        chatInput.value = '';
        
        // Add user message
        addMessage(message, 'user');
        
        // Show loading
        const loadingElement = showLoading();
        
        // Disable send button during request
        if (chatSend) {
            chatSend.disabled = true;
        }
        
        try {
            // Get AI response
            const aiResponse = await sendToAI(message);
            
            // Remove loading
            removeLoading(loadingElement);
            
            // Add AI response
            addMessage(aiResponse, 'bot');
            
        } catch (error) {
            // Remove loading
            removeLoading(loadingElement);
            
            // Show error message
            addMessage(`Terjadi kesalahan: ${error.message}`, 'error');
            
            console.error('Send message error:', error);
        } finally {
            // Re-enable send button
            if (chatSend) {
                chatSend.disabled = false;
            }
            
            if (chatInput) {
                chatInput.focus();
            }
        }
    }
    
    // Ekspos fungsi untuk debugging
    window.openChatbot = openChatbot;
    window.closeChatbot = closeChatbot;
    
    console.log('Chatbot initialized successfully');
}

// ==============================
// TELEGRAM ORDER NOTIFICATION
// ==============================

// Function untuk mengirim order ke Telegram
async function sendOrderToTelegram(orderData) {
    try {
        console.log('Sending order to Telegram:', orderData);
        
        // Tambah timestamp
        orderData.orderTime = new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta'
        });
        
        // Kirim ke backend Vercel
        const response = await fetch('/api/send-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Telegram notification sent:', result);
            // Tampilkan notifikasi sukses
            showNotification('Notifikasi order dikirim ke admin!', 'success');
        } else {
            console.warn('Telegram notification failed:', result.message);
            // Tetap lanjut meski gagal (sistem fallback)
            showNotification('Order berhasil, notifikasi admin mungkin delay', 'warning');
        }
        
        return result;
        
    } catch (error) {
        console.error('Failed to send to Telegram:', error);
        // Jangan ganggu user flow utama
        return { success: false, error: error.message };
    }
}

// ==============================
// MAIN ORDER SYSTEM
// ==============================
function initMainSystem() {
    // Elements
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const buyButtons = document.querySelectorAll('.btn-buy');
    const formModal = document.getElementById('form-modal');
    const modalClose = document.querySelector('.modal-close');
    const cancelBtn = document.querySelector('.btn-cancel');
    const prevBtn = document.querySelector('.btn-prev');
    const nextBtn = document.querySelector('.btn-next');
    const orderForm = document.getElementById('order-form');
    const dynamicFormFields = document.getElementById('dynamic-form-fields');
    const productNameInput = document.getElementById('product-name');
    const steps = document.querySelectorAll('.step');
    const formSteps = document.querySelectorAll('.form-step');
    const paymentMethods = document.querySelectorAll('.payment-method');
    const paymentDetails = document.querySelectorAll('.payment-detail');
    const finalProductName = document.getElementById('final-product-name');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    const telegramBtn = document.getElementById('telegram-btn');
    const customerEmailInput = document.getElementById('customer-email');
    
    let currentStep = 1;
    let currentProduct = '';
    let currentFormType = '';
    let selectedPayment = 'dana';
    let orderData = {};
    
    const formConfigs = {
        panel: {
            title: "Panel PTERODACTYL",
            fields: [
                {
                    type: 'text',
                    name: 'username',
                    label: 'Username Panel',
                    placeholder: 'Masukkan username untuk panel',
                    required: true
                },
                {
                    type: 'password',
                    name: 'password',
                    label: 'Password Panel',
                    placeholder: 'Masukkan password untuk panel',
                    required: true
                },
                {
                    type: 'email',
                    name: 'panel_email',
                    label: 'Email Panel',
                    placeholder: 'email@panel.com',
                    required: true
                },
                {
                    type: 'select',
                    name: 'ram_variant',
                    label: 'Varian RAM',
                    options: ['1GB RAM', '2GB RAM', '3GB RAM', '4GB RAM', '5GB RAM', '6GB RAM', '7GB RAM', '8GB RAM', '9GB RAM', '10GB RAM', 'Unlimited RAM'],
                    required: true
                },
                {
                    type: 'select',
                    name: 'duration',
                    label: 'Durasi',
                    options: ['1 Bulan', '3 Bulan', '6 Bulan', '1 Tahun'],
                    required: true
                }
            ]
        },
        bot: {
            title: "Sewa Bot WhatsApp",
            fields: [
                {
                    type: 'select',
                    name: 'bot_type',
                    label: 'Jenis Layanan Bot',
                    options: ['Jaga Grup', 'Push Kontak', 'JPM', 'Auto Reply', 'Broadcast', 'Paket Lengkap'],
                    required: true
                },
                {
                    type: 'select',
                    name: 'duration',
                    label: 'Durasi',
                    options: ['1 Minggu', '2 Minggu', '1 Bulan', '3 Bulan'],
                    required: true
                },
                {
                    type: 'tel',
                    name: 'target_number',
                    label: 'Nomor WhatsApp Target',
                    placeholder: '081234567890',
                    required: true,
                    pattern: '[0-9]{10,15}'
                },
                {
                    type: 'textarea',
                    name: 'additional_info',
                    label: 'Info Tambahan (Opsional)',
                    placeholder: 'Fitur khusus yang dibutuhkan...',
                    rows: 3
                }
            ]
        },
        role: {
            title: "Paket Role",
            fields: [
                {
                    type: 'select',
                    name: 'role_type',
                    label: 'Pilih Role',
                    options: ['Admin', 'Reseller', 'Admin Panel', 'Partner', 'Owner'],
                    required: true
                },
                {
                    type: 'textarea',
                    name: 'business_info',
                    label: 'Info Bisnis/Background',
                    placeholder: 'Ceritakan sedikit tentang bisnis/aktivitas Anda...',
                    rows: 4
                },
                {
                    type: 'select',
                    name: 'experience_level',
                    label: 'Pengalaman di Bidang Digital',
                    options: ['Pemula', 'Menengah', 'Expert', 'Agen Besar']
                }
            ]
        }
    };
    
    // Mobile Menu Toggle
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            const isActive = navMenu.classList.toggle('active');
            mobileMenuBtn.innerHTML = isActive 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
            mobileMenuBtn.setAttribute('aria-expanded', isActive.toString());
        });
    }
    
    // Smooth scroll for nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            if (navMenu) {
                navMenu.classList.remove('active');
                if (mobileMenuBtn) {
                    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                }
            }
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Generate form fields based on product type
    function generateFormFields(formType) {
        const config = formConfigs[formType];
        if (!config) return '';
        
        let html = '';
        
        config.fields.forEach(field => {
            const requiredAttr = field.required ? 'required' : '';
            const patternAttr = field.pattern ? `pattern="${field.pattern}"` : '';
            const minAttr = field.min ? `min="${field.min}"` : '';
            const maxAttr = field.max ? `max="${field.max}"` : '';
            const rowsAttr = field.rows ? `rows="${field.rows}"` : '';
            
            if (field.type === 'select') {
                html += `
                    <div class="form-group">
                        <label for="${field.name}">${field.label}</label>
                        <select id="${field.name}" name="${field.name}" ${requiredAttr}>
                            <option value="">Pilih ${field.label}</option>
                            ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                        </select>
                    </div>
                `;
            } else if (field.type === 'textarea') {
                html += `
                    <div class="form-group">
                        <label for="${field.name}">${field.label}</label>
                        <textarea id="${field.name}" name="${field.name}" 
                                  placeholder="${field.placeholder || ''}" 
                                  ${rowsAttr} ${requiredAttr}></textarea>
                    </div>
                `;
            } else {
                html += `
                    <div class="form-group">
                        <label for="${field.name}">${field.label}</label>
                        <input type="${field.type}" id="${field.name}" name="${field.name}" 
                               placeholder="${field.placeholder || ''}" 
                               ${requiredAttr} ${patternAttr} ${minAttr} ${maxAttr}>
                    </div>
                `;
            }
        });
        
        return html;
    }
    
    // Buy button click - Open form modal
    buyButtons.forEach(button => {
        button.addEventListener('click', function() {
            currentProduct = this.getAttribute('data-product');
            currentFormType = this.getAttribute('data-form');
            
            // Reset to step 1
            currentStep = 1;
            updateStepIndicator();
            
            // Set product name
            if (productNameInput) {
                productNameInput.value = currentProduct;
            }
            if (finalProductName) {
                finalProductName.textContent = currentProduct;
            }
            
            // Generate form fields
            if (dynamicFormFields) {
                dynamicFormFields.innerHTML = generateFormFields(currentFormType);
            }
            
            // Reset order data
            orderData = {
                product: currentProduct,
                formType: currentFormType,
                timestamp: new Date().toISOString()
            };
            
            // Show modal
            if (formModal) {
                formModal.classList.add('active');
                formModal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            }
            
            // Update button text
            updateButtonText();
        });
    });
    
    // Close modal function
    function closeModal() {
        if (formModal) {
            formModal.classList.remove('active');
            formModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = 'auto';
        }
        
        // Reset form
        if (orderForm && orderForm.reset) {
            orderForm.reset();
        }
        
        // Reset step indicator
        currentStep = 1;
        updateStepIndicator();
        selectedPayment = 'dana';
        updatePaymentDisplay();
    }
    
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    // Click outside modal to close
    if (formModal) {
        formModal.addEventListener('click', function(e) {
            if (e.target === formModal) {
                closeModal();
            }
        });
    }
    
    // ESC key untuk menutup modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && formModal && formModal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // Step navigation
    function updateStepIndicator() {
        // Update step indicators
        steps.forEach(step => {
            step.classList.remove('active');
            const stepNumber = parseInt(step.getAttribute('data-step'));
            if (stepNumber === currentStep) {
                step.classList.add('active');
            }
        });
        
        // Update form steps
        formSteps.forEach(step => {
            step.classList.remove('active');
            const stepNumber = parseInt(step.getAttribute('data-step'));
            if (stepNumber === currentStep) {
                step.classList.add('active');
            }
        });
        
        // Update button states
        if (prevBtn) {
            prevBtn.disabled = currentStep === 1;
        }
        
        // Update WhatsApp/Telegram links on step 3
        if (currentStep === 3) {
            const message = `Bang, saya sudah transfer untuk ${currentProduct}.`;
            const encodedMessage = encodeURIComponent(message);
            if (whatsappBtn) whatsappBtn.href = `https://wa.me/6285943502869?text=${encodedMessage}`;
            if (telegramBtn) telegramBtn.href = `https://t.me/Lizz12087?text=${encodedMessage}`;
        }
    }
    
    function updateButtonText() {
        if (!nextBtn) return;
        
        if (currentStep === 1) {
            nextBtn.textContent = 'Lanjut ke Pembayaran';
            nextBtn.style.display = 'block';
        } else if (currentStep === 2) {
            nextBtn.textContent = 'Lanjut ke Konfirmasi';
            nextBtn.style.display = 'block';
        } else {
            nextBtn.textContent = 'Selesai';
            nextBtn.style.display = 'none';
        }
    }
    
    // Form validation function
    function validateStep(step) {
        if (step === 1) {
            // Validate email
            if (customerEmailInput) {
                const email = customerEmailInput.value.trim();
                
                if (!email || !validateEmail(email)) {
                    showNotification('Email tidak valid!', 'error');
                    customerEmailInput.focus();
                    return false;
                }
                
                // Collect form data
                orderData.email = email;
            }
            
            // Collect dynamic form data
            if (dynamicFormFields) {
                const formFields = dynamicFormFields.querySelectorAll('input, select, textarea');
                formFields.forEach(field => {
                    if (field.name && field.value) {
                        orderData[field.name] = field.value;
                    }
                });
            }
            
            return true;
        }
        
        if (step === 2) {
            if (!selectedPayment) {
                showNotification('Pilih metode pembayaran!', 'error');
                return false;
            }
            
            orderData.paymentMethod = selectedPayment;
            orderData.paymentNumber = '085943502869';
            
            // KIRIM ORDER KE TELEGRAM SAAT LANJUT KE STEP 2
            // Jalankan di background, jangan block user
            setTimeout(() => {
                sendOrderToTelegram(orderData);
            }, 500);
            
            return true;
        }
        
        return true;
    }
    
    // Email validation function
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Next button click handler
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (!validateStep(currentStep)) {
                return;
            }
            
            if (currentStep < 3) {
                currentStep++;
                updateStepIndicator();
                updateButtonText();
                
                // Scroll to top of modal on step change
                const modalBody = document.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.scrollTop = 0;
                }
            }
        });
    }
    
    // Previous button click handler
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentStep > 1) {
                currentStep--;
                updateStepIndicator();
                updateButtonText();
                
                // Scroll to top of modal on step change
                const modalBody = document.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.scrollTop = 0;
                }
            }
        });
    }
    
    // Payment method selection
    function updatePaymentDisplay() {
        paymentMethods.forEach(method => {
            method.classList.remove('active');
            if (method.getAttribute('data-method') === selectedPayment) {
                method.classList.add('active');
            }
        });
        
        paymentDetails.forEach(detail => {
            detail.classList.remove('active');
            if (detail.getAttribute('data-method') === selectedPayment) {
                detail.classList.add('active');
            }
        });
    }
    
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            selectedPayment = this.getAttribute('data-method');
            updatePaymentDisplay();
        });
    });
    
    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.querySelector('.notification');
        const notificationText = document.querySelector('.notification-text');
        const icon = notification?.querySelector('i');
        
        if (!notification || !notificationText || !icon) return;
        
        notificationText.textContent = message;
        
        if (type === 'error') {
            notification.style.borderColor = '#ff4444';
            notification.style.borderLeftColor = '#ff4444';
            icon.className = 'fas fa-exclamation-circle';
            icon.style.color = '#ff4444';
        } else {
            notification.style.borderColor = '#00ff88';
            notification.style.borderLeftColor = '#00ff88';
            icon.className = 'fas fa-check-circle';
            icon.style.color = '#00ff88';
        }
        
        notification.classList.add('active');
        
        setTimeout(() => {
            notification.classList.remove('active');
        }, 3000);
    }
    
    // Debugging & utility functions
    window.logOrderData = function() {
        console.log('Order Data:', orderData);
    };
    
    // Initialization
    function initialize() {
        updatePaymentDisplay();
        console.log('Order system initialized successfully');
    }
    
    // Run initialization
    initialize();
}

// ==============================
// MAIN INITIALIZATION
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Initialize main order system
    initMainSystem();
    
    // Initialize chatbot
    setTimeout(() => {
        initChatbot();
    }, 500);
    
    // Debug: test chatbot button
    console.log('Chatbot button exists:', !!document.getElementById('chatbotBtn'));
    console.log('Chatbot modal exists:', !!document.getElementById('chatbotModal'));
});