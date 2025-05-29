// 订阅管理系统主要功能
class SubscriptionManager {
    constructor() {
        this.subscriptions = [];
        this.currentFilter = 'all';
        this.editingId = null;
        this.validationErrors = {};
        this.selectedSubscriptions = new Set(); // For batch operations
        this.init();
    }

    // 初始化应用
    init() {
        this.loadData();
        this.bindEvents();
        this.render();
        this.setupValidation();
    }

    // 加载数据
    async loadData() {
        // 优先尝试从本地存储加载
        const localData = localStorage.getItem('subscriptions');
        if (localData) {
            try {
                this.subscriptions = JSON.parse(localData);
                console.log('从本地存储加载数据');
                this.render(); // 确保加载后立即渲染
                return; // 如果加载成功则不再尝试fetch
            } catch (error) {
                console.error('解析本地存储数据失败:', error);
                // 如果本地存储数据损坏，则继续尝试从文件加载或使用默认
            }
        }

        // 如果本地存储无数据或加载失败，尝试从文件加载
        try {
            const response = await fetch('data.json');
            const data = await response.json();
            this.subscriptions = data.subscriptions || [];
            console.log('从 data.json 加载数据');
        } catch (error) {
            console.log('无法加载 data.json，使用默认数据');
            this.subscriptions = this.getDefaultData();
        }
        this.render(); // 加载文件或默认数据后渲染
    }

    // 获取默认数据
    getDefaultData() {
        return [
            {
                id: 1,
                productName: "Office 365 家庭版",
                accounts: ["user1@example.com", "user2@example.com"],
                expiryDate: "2024-12-25",
                status: "active",
                managementUrl: "https://account.microsoft.com/services/",
                intention: null
            },
            {
                id: 2,
                productName: "Adobe Creative Cloud",
                accounts: ["designer@company.com"],
                expiryDate: "2024-01-15",
                status: "expiring",
                managementUrl: "https://account.adobe.com/",
                intention: null
            },
            {
                id: 3,
                productName: "Netflix Premium",
                accounts: ["family@example.com"],
                expiryDate: "2024-01-01",
                status: "expired",
                managementUrl: "https://www.netflix.com/account",
                intention: null
            }
        ];
    }

    // 设置表单验证
    setupValidation() {
        const productNameInput = document.getElementById('productName');
        const expiryDateInput = document.getElementById('expiryDate');
        const managementUrlInput = document.getElementById('managementUrl');

        // 产品名称实时验证
        productNameInput.addEventListener('input', () => {
            this.validateField('productName', productNameInput.value.trim());
        });

        productNameInput.addEventListener('blur', () => {
            this.validateField('productName', productNameInput.value.trim());
        });

        // 到期日期实时验证
        expiryDateInput.addEventListener('change', () => {
            this.validateField('expiryDate', expiryDateInput.value);
        });

        expiryDateInput.addEventListener('blur', () => {
            this.validateField('expiryDate', expiryDateInput.value);
        });

        // URL实时验证
        managementUrlInput.addEventListener('input', () => {
            this.validateField('managementUrl', managementUrlInput.value.trim());
        });

        managementUrlInput.addEventListener('blur', () => {
            this.validateField('managementUrl', managementUrlInput.value.trim());
        });

        // 账户字段验证将在addAccountField方法中动态添加
        this.bindAccountValidation(); // 绑定初始账户字段的验证
    }

    // 字段验证
    validateField(fieldName, value) {
        let isValid = true;
        let errorMessage = '';
        const errorElement = document.getElementById(`${fieldName}Error`);
        const inputElement = document.getElementById(fieldName);
        const fieldGroup = inputElement?.closest('.form-field-group');

        // 清除之前的错误状态
        if (inputElement) {
            inputElement.classList.remove('border-red-500', 'animate-shake');
            inputElement.classList.add('border-brand-300');
        }
        if (errorElement) {
            errorElement.classList.add('hidden');
            const errorTextSpan = errorElement.querySelector('span');
            if (errorTextSpan) errorTextSpan.textContent = '';
        }
        if (fieldGroup) {
            fieldGroup.classList.remove('error');
        }

        switch (fieldName) {
            case 'productName':
                if (!value || value.length < 1) {
                    isValid = false;
                    errorMessage = '产品名称不能为空';
                } else if (value.length > 50) {
                    isValid = false;
                    errorMessage = '产品名称不能超过50个字符';
                }
                break;

            case 'expiryDate':
                if (!value) {
                    isValid = false;
                    errorMessage = '请选择到期日期';
                } else {
                    const selectedDate = new Date(value);
                    if (isNaN(selectedDate.getTime())) {
                        isValid = false;
                        errorMessage = '请输入有效的日期';
                    }
                }
                break;

            case 'managementUrl':
                if (!value) {
                    isValid = false;
                    errorMessage = '管理页面链接不能为空';
                } else {
                    try {
                        const url = new URL(value);
                        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                            isValid = false;
                            errorMessage = 'URL必须以 http:// 或 https:// 开头';
                        }
                    } catch {
                        isValid = false;
                        errorMessage = '请输入有效的URL格式 (例如：https://example.com)';
                    }
                }
                break;

            default:
                break;
        }

        // Update validation status and display feedback
        this.validationErrors[fieldName] = !isValid;

        if (errorElement && !isValid) {
            const errorTextSpan = errorElement.querySelector('span');
            if (errorTextSpan) errorTextSpan.textContent = errorMessage;
            errorElement.classList.remove('hidden');
            
            if (inputElement) {
                inputElement.classList.add('border-red-500', 'animate-shake');
                inputElement.classList.remove('border-brand-300');
                setTimeout(() => {
                    inputElement.classList.remove('animate-shake');
                }, 500);
            }
            
            if (fieldGroup) {
                fieldGroup.classList.add('error');
            }
        } else if (errorElement) {
            errorElement.classList.add('hidden');
            if (inputElement) {
                inputElement.classList.remove('border-red-500');
                inputElement.classList.add('border-brand-300');
            }
        }

        return isValid;
    }

    // 验证所有账户字段
    validateAllAccounts() {
        const accountInputs = document.querySelectorAll('.account-input');
        const accountsError = document.getElementById('accountsError');
        const fieldGroup = accountsError?.closest('.form-field-group');
        
        // Clear previous errors
        accountsError.classList.add('hidden');
        const errorTextSpan = accountsError.querySelector('span');
        if (errorTextSpan) errorTextSpan.textContent = '';
        
        accountInputs.forEach(input => {
            input.classList.remove('border-red-500', 'animate-shake');
            input.classList.add('border-brand-300');
        });

        if (fieldGroup) {
            fieldGroup.classList.remove('error');
        }

        // Check if at least one account is provided and valid
        const accounts = Array.from(accountInputs)
            .map(input => input.value.trim())
            .filter(value => value !== ''); // Only consider non-empty fields

        if (accounts.length === 0) {
            const errorMessage = '请至少添加一个邮箱账户';
            if (errorTextSpan) errorTextSpan.textContent = errorMessage;
            accountsError.classList.remove('hidden');
            
            // Mark the first empty field if any
            if (accountInputs.length > 0 && accountInputs[0].value.trim() === '') {
                accountInputs[0].classList.add('border-red-500');
            }
            
            if (fieldGroup) {
                fieldGroup.classList.add('error');
            }
            
            return false;
        }

        // Validate format of all non-empty accounts
        let allValidFormat = true;
        accounts.forEach((account, index) => {
            const input = Array.from(accountInputs).find(inputEl => inputEl.value.trim() === account);
            if (input) {
                const isValidFormat = this.validateAccountField(input, account);
                if (!isValidFormat) {
                    allValidFormat = false;
                }
            }
        });

        if (!allValidFormat) {
            const errorMessage = '请修正邮箱格式错误';
            if (errorTextSpan) errorTextSpan.textContent = errorMessage;
            accountsError.classList.remove('hidden');
            
            if (fieldGroup) {
                fieldGroup.classList.add('error');
            }
            
            return false;
        }

        return true;
    }

    // 验证单个账户字段
    validateAccountField(input, value) {
        if (!value) {
            input.classList.remove('border-red-500', 'animate-shake');
            input.classList.add('border-brand-300');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(value);

        if (!isValid) {
            input.classList.add('border-red-500', 'animate-shake');
            input.classList.remove('border-brand-300');
            setTimeout(() => {
                input.classList.remove('animate-shake');
            }, 500);
        } else {
            input.classList.remove('border-red-500');
            input.classList.add('border-brand-300');
        }

        return isValid;
    }

    // 显示成功通知
    showSuccessNotification(message) {
        const notification = document.getElementById('successNotification');
        const messageElement = document.getElementById('successMessage');

        messageElement.textContent = message;
        notification.classList.add('show');

        // Clear any existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        this.notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // 显示加载状态
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    }

    // 隐藏加载状态
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }

    // 绑定事件处理器
    bindEvents() {
        // 添加订阅按钮
        document.getElementById('addSubscriptionBtn').addEventListener('click', () => {
            this.openModal();
        });

        // 关闭模态框
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // 模态框外部点击关闭
        document.getElementById('subscriptionModal').addEventListener('click', (e) => {
            if (e.target.id === 'subscriptionModal') {
                this.closeModal();
            }
        });

        // 表单提交
        document.getElementById('subscriptionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // 添加账户按钮
        document.getElementById('addAccountBtn').addEventListener('click', () => {
            this.addAccountField();
        });

        // 筛选按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Batch operation event listeners
        document.getElementById('batchRenewBtn').addEventListener('click', () => {
            this.applyBatchIntention('renew');
        });

        document.getElementById('batchCancelBtn').addEventListener('click', () => {
            this.applyBatchIntention('cancel');
        });

        document.getElementById('clearBatchBtn').addEventListener('click', () => {
            this.clearBatchSelection();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC to close modal
            if (e.key === 'Escape') {
                const modal = document.getElementById('subscriptionModal');
                if (!modal.classList.contains('hidden')) {
                    this.closeModal();
                }
            }

            // Ctrl+A to select all visible subscriptions (when not in modal)
            if (e.ctrlKey && e.key === 'a') {
                const modal = document.getElementById('subscriptionModal');
                if (modal.classList.contains('hidden')) {
                    e.preventDefault();
                    this.selectAllVisibleSubscriptions();
                }
            }
        });
    }

    // 处理表单提交
    async handleFormSubmit() {
        // Trigger validation for all main fields
        const productNameValid = this.validateField('productName', document.getElementById('productName').value.trim());
        const expiryDateValid = this.validateField('expiryDate', document.getElementById('expiryDate').value);
        const managementUrlValid = this.validateField('managementUrl', document.getElementById('managementUrl').value.trim());
        const accountsValid = this.validateAllAccounts();

        // Check overall form validity
        const formIsValid = productNameValid && expiryDateValid && managementUrlValid && accountsValid;

        if (!formIsValid) {
            console.log('Form validation failed.');
            // Scroll to the first error
            const firstErrorElement = document.querySelector('[id$="Error"]:not(.hidden)');
            if (firstErrorElement) {
                firstErrorElement.closest('.form-field-group')?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
            return;
        }

        // Validation passed, proceed with saving
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const submitSpinner = document.getElementById('submitSpinner');

        submitBtn.disabled = true;
        submitText.textContent = '保存中...';
        submitSpinner.classList.remove('hidden');

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            await this.saveSubscription();
            this.showSuccessNotification(this.editingId ? '订阅信息已更新' : '订阅已添加成功');
            this.closeModal();
        } catch (error) {
            console.error('保存订阅失败:', error);
            alert('保存失败，请重试: ' + error.message);
        } finally {
            // Restore button state
            submitBtn.disabled = false;
            submitText.textContent = '保存';
            submitSpinner.classList.add('hidden');
        }
    }

    // 计算订阅状态
    calculateStatus(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        today.setHours(0, 0, 0, 0); // Compare dates without time
        expiry.setHours(0, 0, 0, 0);

        const timeDiff = expiry.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff < 0) {
            return 'expired';
        } else if (daysDiff <= 7) {
            return 'expiring';
        } else {
            return 'active';
        }
    }

    // 获取状态显示信息
    getStatusInfo(subscription) {
        let status = this.calculateStatus(subscription.expiryDate);

        // 如果有意向设置，优先显示意向状态
        if (subscription.intention === 'renew') {
            return {
                text: '计划续订',
                className: 'bg-blue-100 text-blue-800 border border-blue-200 status-indicator',
                icon: '🔄',
                isPlanned: true
            };
        } else if (subscription.intention === 'cancel') {
            return {
                text: '计划取消',
                className: 'bg-orange-100 text-orange-800 border border-orange-200 status-indicator',
                icon: '⏸️',
                isPlanned: true
            };
        }

        // 根据计算出的状态返回信息
        switch (status) {
            case 'active':
                return {
                    text: '有效',
                    className: 'bg-green-100 text-green-800 border border-green-200 status-indicator',
                    icon: '✅',
                    isPlanned: false
                };
            case 'expiring':
                return {
                    text: '即将到期',
                    className: 'bg-yellow-100 text-yellow-800 border border-yellow-200 status-indicator animate-pulse-slow',
                    icon: '⚠️',
                    isPlanned: false
                };
            case 'expired':
                return {
                    text: '已过期',
                    className: 'bg-red-100 text-red-800 border border-red-200 status-indicator',
                    icon: '❌',
                    isPlanned: false
                };
            default:
                return {
                    text: '未知',
                    className: 'bg-gray-100 text-gray-800 border border-gray-200 status-indicator',
                    icon: '❓',
                    isPlanned: false
                };
        }
    }

    // 获取订阅卡片的背景样式
    getCardBackgroundStyle(subscription) {
        const status = this.calculateStatus(subscription.expiryDate);
        const isExpiring = status === 'expiring';
        const hasIntention = subscription.intention;

        if (hasIntention === 'renew') {
            return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
        } else if (hasIntention === 'cancel') {
            return 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200';
        } else if (isExpiring) {
            return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 ring-2 ring-yellow-300';
        } else if (status === 'expired') {
            return 'bg-gradient-to-r from-red-50 to-gray-50 border-red-200';
        } else {
            return 'bg-white border-brand-200';
        }
    }

    // 生成账户详细显示的HTML（支持折叠展开）
    generateAccountsDisplay(accounts, subscriptionId) {
        if (!accounts || accounts.length === 0) {
            return `
                <div class="text-brand-800 font-medium">
                    无账户
                </div>
            `;
        } else if (accounts.length === 1) {
            return `
                <div class="text-brand-800 font-medium">
                    ${accounts[0]}
                </div>
            `;
        } else if (accounts.length <= 3) {
            return `
                <div class="space-y-1">
                    ${accounts.map(account => `
                        <div class="text-brand-800 font-medium text-sm">${account}</div>
                    `).join('')}
                </div>
            `;
        } else {
            return `
                <div class="accounts-container">
                    <div class="text-brand-800 font-medium cursor-pointer hover:text-primary-600 transition-colors duration-200 flex items-center"
                         onclick="subscriptionManager.toggleAccounts(${subscriptionId})">
                         <svg class="w-3 h-3 mr-2 text-brand-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
                        ${accounts[0]} 等 ${accounts.length} 个账户
                        <svg class="w-4 h-4 inline ml-1 transition-transform duration-200 text-brand-400" id="accounts-arrow-${subscriptionId}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                    <div id="accounts-detail-${subscriptionId}" class="hidden mt-2 pl-4 border-l-2 border-brand-200 space-y-1 animate-fade-in">
                        ${accounts.map((account, index) => `
                            <div class="text-sm text-brand-600 font-medium flex items-center">
                                <span class="w-2 h-2 bg-brand-300 rounded-full mr-2 flex-shrink-0"></span>
                                ${account}
                                ${index === 0 && accounts.length > 1 ? '<span class="ml-2 text-xs text-brand-400">(首个账户)</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    // 切换账户显示
    toggleAccounts(subscriptionId) {
        const detailElement = document.getElementById(`accounts-detail-${subscriptionId}`);
        const arrowElement = document.getElementById(`accounts-arrow-${subscriptionId}`);

        if (detailElement && arrowElement) {
            if (detailElement.classList.contains('hidden')) {
                detailElement.classList.remove('hidden');
                arrowElement.style.transform = 'rotate(180deg)';
            } else {
                detailElement.classList.add('hidden');
                arrowElement.style.transform = 'rotate(0deg)';
            }
        }
    }

    // 格式化日期显示
    formatDate(dateString) {
        if (!dateString) return '未知日期';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return '无效日期';
            }
            date.setDate(date.getDate() + 1);
            return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            console.error("Date formatting error:", e);
            return '格式错误';
        }
    }

    // 计算统计数据
    calculateStats() {
        let currentActive = 0;
        let currentExpiring = 0;
        let currentExpired = 0;

        this.subscriptions.forEach(sub => {
            const status = this.calculateStatus(sub.expiryDate);
            switch (status) {
                case 'active':
                    currentActive++;
                    break;
                case 'expiring':
                    currentExpiring++;
                    break;
                case 'expired':
                    currentExpired++;
                    break;
            }
        });

        return {
            active: currentActive,
            expiring: currentExpiring,
            expired: currentExpired,
            total: this.subscriptions.length
        };
    }

    // 更新统计显示
    updateStats() {
        const stats = this.calculateStats();

        // 添加数字变化动画
        this.animateCounter('activeCount', stats.active);
        this.animateCounter('expiringCount', stats.expiring);
        this.animateCounter('expiredCount', stats.expired);
        this.animateCounter('totalCount', stats.total);
    }

    // 数字动画
    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const currentValue = parseInt(element.textContent) || 0;

        if (currentValue === targetValue) return;

        const increment = targetValue > currentValue ? 1 : -1;
        const duration = 500; // milliseconds
        const frameDuration = 16; // ~60fps
        const totalFrames = duration / frameDuration;
        const step = (targetValue - currentValue) / totalFrames;

        let current = currentValue;
        let frame = 0;

        const timer = setInterval(() => {
            frame++;
            current += step;

            // Ensure we don't overshoot the target
            if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue) || frame >= totalFrames) {
                current = targetValue;
                clearInterval(timer);
                // Add bounce animation
                const cardElement = element.closest('.bg-white');
                if (cardElement) {
                    cardElement.classList.add('animate-bounce-subtle');
                    setTimeout(() => {
                        cardElement.classList.remove('animate-bounce-subtle');
                    }, 600);
                }
            }
            element.textContent = Math.round(current);
        }, frameDuration);
    }

    // 过滤订阅
    getFilteredSubscriptions() {
        if (this.currentFilter === 'all') {
            return this.subscriptions;
        }

        return this.subscriptions.filter(sub => {
            if (this.currentFilter === 'renew') {
                return sub.intention === 'renew';
            }
            if (this.currentFilter === 'cancel') {
                return sub.intention === 'cancel';
            }

            if (sub.intention) return false;

            const status = this.calculateStatus(sub.expiryDate);
            return status === this.currentFilter;
        });
    }

    // 设置筛选器
    setFilter(filter) {
        this.currentFilter = filter;

        // Clear batch selection when changing filters
        this.clearBatchSelection();

        // Update button status
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-brand-800', 'text-white', 'shadow-lg');
            btn.classList.add('bg-white', 'text-brand-700', 'shadow-sm', 'hover:bg-brand-50', 'hover:border-brand-400');
        });

        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-brand-800', 'text-white', 'shadow-lg');
            activeBtn.classList.remove('bg-white', 'text-brand-700', 'shadow-sm', 'hover:bg-brand-50', 'hover:border-brand-400');
        }

        this.renderSubscriptions();
    }

    // 渲染订阅列表
    renderSubscriptions() {
        const container = document.getElementById('subscriptionsList');
        const emptyState = document.getElementById('emptyState');
        const filteredSubscriptions = this.getFilteredSubscriptions();

        if (filteredSubscriptions.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        container.innerHTML = filteredSubscriptions.map(subscription => {
            const statusInfo = this.getStatusInfo(subscription);
            const cardBackgroundStyle = this.getCardBackgroundStyle(subscription);
            const isExpiring = this.calculateStatus(subscription.expiryDate) === 'expiring' && !subscription.intention;
            const isSelected = this.selectedSubscriptions.has(subscription.id);

            // Generate management link
            let managementLinkHtml = '';
            try {
                new URL(subscription.managementUrl);
                managementLinkHtml = `
                    <div class="tooltip-container relative">
                        <a href="${subscription.managementUrl}" target="_blank"
                           class="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl hover:from-primary-600 hover:to-primary-800 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl border-2 border-primary-500 hover:border-primary-600">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            跳转管理订阅
                            <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </a>
                        <span class="tooltip">点击访问官方管理页面</span>
                    </div>
                `;
            } catch (e) {
                managementLinkHtml = `
                    <div class="tooltip-container relative">
                        <span class="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-brand-400 bg-brand-100 rounded-xl cursor-not-allowed border border-brand-200">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 10.5h-6m6 0H21m0 0l-3 3m0-3l3-3"></path></svg>
                            管理链接无效
                        </span>
                        <span class="tooltip bg-red-700 text-white border border-red-800">无效的管理页面链接</span>
                    </div>
                `;
            }

            return `
                <div class="subscription-card rounded-2xl shadow-sm border p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${cardBackgroundStyle} ${isSelected ? 'batch-selected' : ''}">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex flex-wrap items-center gap-3 mb-4">
                                <h3 class="text-xl font-bold text-brand-800">${subscription.productName}</h3>
                                <span class="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-semibold ${statusInfo.className} ${statusInfo.isPlanned ? 'shimmer' : ''}">
                                    <span class="mr-1.5">${statusInfo.icon}</span>
                                    ${statusInfo.text}
                                </span>
                                ${isExpiring ? '<span class="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse"><span class="mr-1.5">🔔</span>提醒</span>' : ''}
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-brand-600">
                                <div>
                                    <span class="font-semibold block mb-2">关联账户：</span>
                                    ${this.generateAccountsDisplay(subscription.accounts, subscription.id)}
                                </div>
                                <div>
                                    <span class="font-semibold block mb-2">到期日期：</span>
                                    <span class="text-brand-800 font-semibold ${isExpiring ? 'text-yellow-700' : ''}">${this.formatDate(subscription.expiryDate)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Batch selection checkbox -->
                        <div class="flex-shrink-0 ml-4">
                            <input type="checkbox" 
                                   class="batch-checkbox w-5 h-5 text-primary-600 rounded border-brand-300 focus:ring-primary-500 cursor-pointer" 
                                   data-id="${subscription.id}"
                                   ${isSelected ? 'checked' : ''}
                                   onchange="subscriptionManager.toggleBatchSelection(${subscription.id})">
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-3 mt-6 pt-6 border-t border-brand-200">
                        ${!subscription.intention || subscription.intention !== 'renew' ? `
                            <button onclick="subscriptionManager.setIntention(${subscription.id}, 'renew')"
                                    class="action-btn inline-flex items-center px-4 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 border border-blue-200 transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md">
                                <span class="mr-2">🔄</span>
                                ${subscription.intention === 'renew' ? '已设置续订' : '设置续订意向'}
                            </button>
                        ` : ''}

                        ${!subscription.intention || subscription.intention !== 'cancel' ? `
                            <button onclick="subscriptionManager.setIntention(${subscription.id}, 'cancel')"
                                    class="action-btn inline-flex items-center px-4 py-2.5 text-sm font-semibold text-orange-700 bg-orange-50 rounded-xl hover:bg-orange-100 border border-orange-200 transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md">
                                <span class="mr-2">⏸️</span>
                                ${subscription.intention === 'cancel' ? '已设置取消' : '设置取消意向'}
                            </button>
                        ` : ''}

                        ${subscription.intention ? `
                            <button onclick="subscriptionManager.clearIntention(${subscription.id})"
                                    class="action-btn inline-flex items-center px-4 py-2.5 text-sm font-semibold text-brand-700 bg-brand-50 rounded-xl hover:bg-brand-100 border border-brand-200 transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md">
                                <span class="mr-2">↩️</span>
                                清除意向
                            </button>
                        ` : ''}

                        ${managementLinkHtml}

                        <button onclick="subscriptionManager.editSubscription(${subscription.id})"
                                class="action-btn inline-flex items-center px-4 py-2.5 text-sm font-semibold text-brand-700 bg-brand-50 rounded-xl hover:bg-brand-100 border border-brand-200 transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            编辑
                        </button>

                        <button onclick="subscriptionManager.deleteSubscription(${subscription.id})"
                                class="action-btn inline-flex items-center px-4 py-2.5 text-sm font-semibold text-red-700 bg-red-50 rounded-xl hover:bg-red-100 border border-red-200 transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            删除
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Update batch selection UI
        this.updateBatchSelectionUI();

        // For status indicators that represent a planned intention (renew/cancel), add shimmer effect
        requestAnimationFrame(() => {
            document.querySelectorAll('.status-indicator.shimmer').forEach(el => {
                el.classList.remove('shimmer');
                void el.offsetWidth; // Trigger reflow
                el.classList.add('shimmer');
            });
        });
    }

    // Batch Operations
    toggleBatchSelection(id) {
        if (this.selectedSubscriptions.has(id)) {
            this.selectedSubscriptions.delete(id);
        } else {
            this.selectedSubscriptions.add(id);
        }
        this.updateBatchSelectionUI();
        this.renderSubscriptions(); // Re-render to update checkbox states and card styles
    }

    clearBatchSelection() {
        this.selectedSubscriptions.clear();
        this.updateBatchSelectionUI();
        this.renderSubscriptions(); // Re-render to update visual states
    }

    selectAllVisibleSubscriptions() {
        const filteredSubscriptions = this.getFilteredSubscriptions();
        filteredSubscriptions.forEach(sub => {
            this.selectedSubscriptions.add(sub.id);
        });
        this.updateBatchSelectionUI();
        this.renderSubscriptions(); // Re-render to update visual states
    }

    updateBatchSelectionUI() {
        const batchActions = document.getElementById('batchActions');
        const selectedCount = document.getElementById('selectedCount');
        const count = this.selectedSubscriptions.size;

        if (count > 0) {
            batchActions.classList.add('show');
            selectedCount.textContent = `已选择 ${count} 项`;
        } else {
            batchActions.classList.remove('show');
        }
    }

    async applyBatchIntention(intention) {
        if (this.selectedSubscriptions.size === 0) {
            return;
        }

        const intentionText = intention === 'renew' ? '续订' : '取消';
        
        if (!confirm(`确认要将选中的 ${this.selectedSubscriptions.size} 个订阅设置为计划${intentionText}吗？`)) {
            return;
        }

        this.showLoading();

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 800));

        let updatedCount = 0;
        this.selectedSubscriptions.forEach(id => {
            const subscription = this.subscriptions.find(sub => sub.id === id);
            if (subscription) {
                subscription.intention = intention;
                updatedCount++;
            }
        });

        this.saveData();
        this.clearBatchSelection();
        this.render();

        this.showSuccessNotification(`已将 ${updatedCount} 个订阅设置为计划${intentionText}`);
        this.hideLoading();
    }

    // 渲染整个界面
    render() {
        this.updateStats();
        this.renderSubscriptions();
    }

    // 设置意向（增强版本，带视觉反馈）
    async setIntention(id, intention) {
        const subscription = this.subscriptions.find(sub => sub.id === id);
        if (!subscription) {
            console.error(`Subscription with ID ${id} not found.`);
            return;
        }

        this.showLoading();

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 300));

        subscription.intention = intention;
        this.saveData();
        this.render();

        const intentionText = intention === 'renew' ? '续订' : '取消';
        this.showSuccessNotification(`已设置 ${subscription.productName} 为计划${intentionText}`);

        this.hideLoading();
    }

    // 清除意向（增强版本，带视觉反馈）
    async clearIntention(id) {
        const subscription = this.subscriptions.find(sub => sub.id === id);
        if (!subscription) {
            console.error(`Subscription with ID ${id} not found.`);
            return;
        }

        this.showLoading();

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 300));

        subscription.intention = null;
        this.saveData();
        this.render();

        this.showSuccessNotification(`已清除 ${subscription.productName} 的意向设置`);

        this.hideLoading();
    }

    // 打开模态框
    openModal(subscription = null) {
        this.editingId = subscription ? subscription.id : null;
        this.validationErrors = {};

        const modal = document.getElementById('subscriptionModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('subscriptionForm');

        title.textContent = subscription ? '编辑订阅' : '添加订阅';

        // Clear previous validation error messages and styles
        document.querySelectorAll('[id$="Error"]').forEach(el => {
            el.classList.add('hidden');
            const errorTextSpan = el.querySelector('span');
            if (errorTextSpan) errorTextSpan.textContent = '';
        });

        document.querySelectorAll('#subscriptionForm input').forEach(input => {
            input.classList.remove('border-red-500', 'animate-shake');
            input.classList.add('border-brand-300');
        });

        document.querySelectorAll('.form-field-group').forEach(group => {
            group.classList.remove('error');
        });

        if (subscription) {
            document.getElementById('productName').value = subscription.productName || '';
            document.getElementById('expiryDate').value = subscription.expiryDate || '';
            document.getElementById('managementUrl').value = subscription.managementUrl || '';

            this.populateAccounts(Array.isArray(subscription.accounts) ? subscription.accounts : []);
        } else {
            form.reset();
            this.resetAccountFields();
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');

        requestAnimationFrame(() => {
            const firstInput = document.getElementById('productName');
            if (firstInput) {
                firstInput.focus();
            }
        });
    }

    // 关闭模态框
    closeModal() {
        const modal = document.getElementById('subscriptionModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        
        this.editingId = null;
        this.validationErrors = {};
        this.resetAccountFields();
        
        document.getElementById('subscriptionForm').reset();
        
        // Clear validation errors
        document.querySelectorAll('[id$="Error"]').forEach(el => {
            el.classList.add('hidden');
            const errorTextSpan = el.querySelector('span');
            if (errorTextSpan) errorTextSpan.textContent = '';
        });

        document.querySelectorAll('#subscriptionForm input').forEach(input => {
            input.classList.remove('border-red-500', 'animate-shake');
            input.classList.add('border-brand-300');
        });

        document.querySelectorAll('.form-field-group').forEach(group => {
            group.classList.remove('error');
        });
    }

    // 填充账户字段
    populateAccounts(accounts) {
        const container = document.getElementById('accountsContainer');
        container.innerHTML = '';

        if (accounts.length > 0) {
            accounts.forEach(account => {
                this.addAccountField(account);
            });
        } else {
            this.addAccountField('');
        }

        this.updateAccountFieldsRequired();
        this.bindAccountValidation();
    }

    // 重置账户字段
    resetAccountFields() {
        const container = document.getElementById('accountsContainer');
        container.innerHTML = '';
        this.addAccountField('');
        this.updateAccountFieldsRequired();
        this.bindAccountValidation();
    }

    // 添加账户字段
    addAccountField(value = '') {
        const container = document.getElementById('accountsContainer');
        const accountFields = container.querySelectorAll('.account-input');

        const div = document.createElement('div');
        div.className = 'flex gap-3 items-center';
        div.innerHTML = `
            <input type="email" 
                   class="account-input flex-1 px-4 py-3 border border-brand-300 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                   placeholder="请输入邮箱地址" 
                   value="${value.replace(/"/g, '&quot;')}" 
                   ${accountFields.length === 0 ? 'required' : ''}>
            <button type="button" 
                    class="remove-account-btn p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200 ${accountFields.length === 0 ? 'hidden' : ''}" 
                    title="移除账户">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

        container.appendChild(div);

        // Bind deletion event for this specific remove button
        const removeBtn = div.querySelector('.remove-account-btn');
        removeBtn.addEventListener('click', () => {
            if (container.children.length > 1) {
                div.remove();
                this.updateAccountFieldsRequired();
                this.validateAllAccounts();
            }
        });

        this.updateAccountFieldsRequired();
        this.bindAccountValidationForElement(div.querySelector('.account-input'));
    }

    // Bind account validation for a single element
    bindAccountValidationForElement(input) {
        input.addEventListener('blur', () => {
            this.validateAccountField(input, input.value.trim());
            this.validateAllAccounts();
        });

        input.addEventListener('input', () => {
            input.classList.remove('border-red-500', 'animate-shake');
            input.classList.add('border-brand-300');
        });
    }

    // Re-bind account validation for all current account fields
    bindAccountValidation() {
        document.querySelectorAll('.account-input').forEach(input => {
            const clonedInput = input.cloneNode(true);
            input.parentNode.replaceChild(clonedInput, input);
            this.bindAccountValidationForElement(clonedInput);
        });
    }

    // Update account fields required attribute and remove button visibility
    updateAccountFieldsRequired() {
        const container = document.getElementById('accountsContainer');
        const accountFields = container.querySelectorAll('.account-input');
        const removeButtons = container.querySelectorAll('.remove-account-btn');

        accountFields.forEach((field, index) => {
            field.required = index === 0;
            field.placeholder = accountFields.length === 1 ? "请输入邮箱地址" : `请输入邮箱地址 ${index + 1}`;
        });

        removeButtons.forEach((btn, index) => {
            if (accountFields.length <= 1) {
                btn.classList.add('hidden');
            } else {
                btn.classList.remove('hidden');
            }
        });
    }

    // 保存订阅
    async saveSubscription() {
        const form = document.getElementById('subscriptionForm');
        const formData = new FormData(form);
        const accountFields = document.querySelectorAll('.account-input');

        const accounts = Array.from(accountFields)
            .map(field => field.value.trim())
            .filter(value => value !== '');

        if (accounts.length === 0) {
            console.error('Attempted to save with no accounts.');
            throw new Error('请至少添加一个账户');
        }

        const subscriptionData = {
            productName: formData.get('productName').trim(),
            accounts: accounts,
            expiryDate: formData.get('expiryDate'),
            managementUrl: formData.get('managementUrl').trim(),
            intention: this.editingId ? (this.subscriptions.find(sub => sub.id === this.editingId)?.intention || null) : null
        };

        if (this.editingId) {
            // Editing existing subscription
            const index = this.subscriptions.findIndex(sub => sub.id === this.editingId);
            if (index !== -1) {
                this.subscriptions[index] = {
                    ...this.subscriptions[index],
                    productName: subscriptionData.productName,
                    accounts: subscriptionData.accounts,
                    expiryDate: subscriptionData.expiryDate,
                    managementUrl: subscriptionData.managementUrl
                };
                console.log('Edited subscription:', this.subscriptions[index]);
            } else {
                console.error('Editing failed: Subscription with ID not found', this.editingId);
                throw new Error('编辑失败：找不到订阅');
            }
        } else {
            // Adding new subscription
            const newId = Date.now();
            const newSubscription = {
                id: newId,
                ...subscriptionData,
                intention: null
            };
            this.subscriptions.push(newSubscription);
            console.log('Added new subscription:', newSubscription);
        }

        this.saveData();
        this.render();
    }

    // 编辑订阅
    editSubscription(id) {
        const subscription = this.subscriptions.find(sub => sub.id === id);
        if (subscription) {
            this.openModal(subscription);
        } else {
            console.error('Edit failed: Subscription not found with id:', id);
            alert('编辑失败：找不到该订阅。');
        }
    }

    // 删除订阅（增强版本, 带确认和视觉反馈）
    async deleteSubscription(id) {
        const subscription = this.subscriptions.find(sub => sub.id === id);
        if (!subscription) {
            console.error('Delete failed: Subscription not found with id:', id);
            return;
        }

        if (confirm(`确认要删除"${subscription.productName}"这个订阅吗？此操作不可撤销。`)) {
            this.showLoading();

            // Simulate async deletion
            await new Promise(resolve => setTimeout(resolve, 500));

            // Also remove from batch selection if it's selected
            this.selectedSubscriptions.delete(id);

            // Perform deletion
            this.subscriptions = this.subscriptions.filter(sub => sub.id !== id);

            this.saveData();
            this.render();

            this.showSuccessNotification(`已删除"${subscription.productName}"订阅`);
            this.hideLoading();
        }
    }

    // 保存数据到本地存储
    saveData() {
        try {
            const dataToSave = JSON.stringify(this.subscriptions);
            localStorage.setItem('subscriptions', dataToSave);
            console.log('数据已保存到本地存储');
        } catch (error) {
            console.error('无法保存到本地存储:', error);
            alert('警告：无法将数据保存到您的浏览器存储中，更改可能不会被记住。');
        }
    }
}

// 初始化应用
const subscriptionManager = new SubscriptionManager();
