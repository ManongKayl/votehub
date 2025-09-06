// UI Management
class UIManager {
    constructor() {
        this.notifications = [];
        this.modals = new Map();
        this.init();
    }
    
    init() {
        this.bindGlobalEvents();
        this.initializeModals();
        this.hideLoadingScreen();
    }
    
    bindGlobalEvents() {
        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
        
        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }
    
    initializeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.modals.set(modal.id, modal);
        });
    }
    
    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, CONFIG.ANIMATION_DURATION);
            }
        }, 1000);
    }
    
    showNotification(message, type = 'info', duration = CONFIG.NOTIFICATION_DURATION) {
        const id = Utils.generateId();
        const notification = this.createNotificationElement(id, message, type);
        
        const container = document.getElementById('notification-container');
        if (container) {
            container.appendChild(notification);
            
            // Trigger animation
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
            
            // Auto remove
            setTimeout(() => {
                this.removeNotification(id);
            }, duration);
        }
        
        this.notifications.push({ id, element: notification, type, message });
        return id;
    }
    
    createNotificationElement(id, message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.id = `notification-${id}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${icons[type] || icons.info}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-message">${Utils.sanitizeHtml(message)}</div>
            </div>
            <button class="notification-close" onclick="UI.removeNotification('${id}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        return notification;
    }
    
    removeNotification(id) {
        const notification = document.getElementById(`notification-${id}`);
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, CONFIG.ANIMATION_DURATION);
        }
        
        this.notifications = this.notifications.filter(n => n.id !== id);
    }
    
    clearNotifications() {
        this.notifications.forEach(n => this.removeNotification(n.id));
    }
    
    showModal(modalId) {
        const modal = this.modals.get(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus first input
            const firstInput = modal.querySelector('input, textarea, select, button');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }
    
    closeModal(modalId) {
        const modal = this.modals.get(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Reset form if exists
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }
    }
    
    closeAllModals() {
        this.modals.forEach((modal, id) => {
            this.closeModal(id);
        });
    }
    
    showLoading(element, text = 'Loading...') {
        if (element) {
            element.disabled = true;
            const originalText = element.textContent;
            element.dataset.originalText = originalText;
            element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        }
    }
    
    hideLoading(element) {
        if (element && element.dataset.originalText) {
            element.disabled = false;
            element.textContent = element.dataset.originalText;
            delete element.dataset.originalText;
        }
    }
    
    createPagination(container, currentPage, totalPages, onPageChange) {
        if (!container || totalPages <= 1) return;
        
        container.innerHTML = '';
        
        // Previous button
        const prevBtn = this.createPageButton('Previous', currentPage > 1, () => {
            if (currentPage > 1) onPageChange(currentPage - 1);
        });
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Previous';
        container.appendChild(prevBtn);
        
        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        if (startPage > 1) {
            container.appendChild(this.createPageButton(1, true, () => onPageChange(1)));
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'page-ellipsis';
                container.appendChild(ellipsis);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const btn = this.createPageButton(i, true, () => onPageChange(i));
            if (i === currentPage) {
                btn.classList.add('active');
            }
            container.appendChild(btn);
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'page-ellipsis';
                container.appendChild(ellipsis);
            }
            container.appendChild(this.createPageButton(totalPages, true, () => onPageChange(totalPages)));
        }
        
        // Next button
        const nextBtn = this.createPageButton('Next', currentPage < totalPages, () => {
            if (currentPage < totalPages) onPageChange(currentPage + 1);
        });
        nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
        container.appendChild(nextBtn);
    }
    
    createPageButton(text, enabled, onClick) {
        const button = document.createElement('button');
        button.className = `page-btn ${enabled ? '' : 'disabled'}`;
        button.textContent = text;
        
        if (enabled && onClick) {
            button.addEventListener('click', onClick);
        }
        
        return button;
    }
    
    createEmptyState(container, icon, title, message, actionText = null, actionCallback = null) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="${icon}"></i>
                <h3>${title}</h3>
                <p>${message}</p>
                ${actionText && actionCallback ? `<button class="btn btn-primary" id="empty-action-btn">${actionText}</button>` : ''}
            </div>
        `;
        
        if (actionText && actionCallback) {
            const actionBtn = container.querySelector('#empty-action-btn');
            if (actionBtn) {
                actionBtn.addEventListener('click', actionCallback);
            }
        }
    }
    
    createLoadingState(container, text = 'Loading...') {
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>${text}</span>
            </div>
        `;
    }
    
    createSkeletonLoader(container, type = 'polls') {
        const skeletons = {
            polls: `
                <div class="polls-grid">
                    ${Array(6).fill().map(() => `
                        <div class="poll-card skeleton">
                            <div class="poll-header">
                                <div class="skeleton skeleton-title"></div>
                                <div class="skeleton skeleton-text" style="width: 40%;"></div>
                            </div>
                            <div class="poll-body">
                                <div class="skeleton skeleton-text"></div>
                                <div class="skeleton skeleton-text" style="width: 80%;"></div>
                                <div class="skeleton skeleton-text" style="width: 60%;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `,
            table: `
                <div class="data-table">
                    <table>
                        <thead>
                            <tr>
                                ${Array(4).fill().map(() => '<th><div class="skeleton skeleton-text"></div></th>').join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${Array(5).fill().map(() => `
                                <tr>
                                    ${Array(4).fill().map(() => '<td><div class="skeleton skeleton-text"></div></td>').join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `
        };
        
        container.innerHTML = skeletons[type] || skeletons.polls;
    }
    
    formatPollCard(poll, options = {}) {
        const {
            showActions = true,
            showResults = false,
            clickable = true
        } = options;
        
        const hasVoted = poll.hasVoted || false;
        const isExpired = poll.isExpired || false;
        const isActive = poll.isCurrentlyActive !== false;
        
        return `
            <div class="poll-card ${clickable ? 'clickable' : ''}" data-poll-id="${poll._id}">
                <div class="poll-header">
                    <h3 class="poll-title">${Utils.sanitizeHtml(poll.title)}</h3>
                    <div class="poll-meta">
                        <span class="poll-category">${poll.category || 'General'}</span>
                        <span class="poll-date">${Utils.formatRelativeTime(poll.createdAt)}</span>
                    </div>
                </div>
                
                <div class="poll-body">
                    ${poll.description ? `<p class="poll-description">${Utils.sanitizeHtml(poll.description)}</p>` : ''}
                    
                    <div class="poll-options">
                        ${poll.options.map((option, index) => `
                            <div class="poll-option ${hasVoted && showResults ? 'show-results' : ''}" 
                                 data-option-index="${index}">
                                <span class="option-text">${Utils.sanitizeHtml(option.text)}</span>
                                ${showResults ? `
                                    <div class="option-stats">
                                        <span class="option-votes">${option.votes || 0}</span>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${poll.results ? poll.results[index]?.percentage || 0 : 0}%"></div>
                                        </div>
                                    </div>
                                ` : `
                                    <span class="option-votes">${option.votes || 0}</span>
                                `}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="poll-footer">
                    <div class="poll-stats">
                        <span><i class="fas fa-vote-yea"></i> ${Utils.formatNumber(poll.totalVotes || 0)} votes</span>
                        <span><i class="fas fa-users"></i> ${Utils.formatNumber(poll.uniqueVoters || 0)} voters</span>
                        ${poll.creator ? `<span><i class="fas fa-user"></i> ${Utils.sanitizeHtml(poll.creator.username || poll.creator)}</span>` : ''}
                    </div>
                    
                    ${showActions ? `
                        <div class="poll-actions">
                            ${!hasVoted && isActive ? `
                                <button class="btn btn-primary btn-small vote-btn" data-poll-id="${poll._id}">
                                    <i class="fas fa-vote-yea"></i> Vote
                                </button>
                            ` : ''}
                            <button class="btn btn-outline btn-small view-btn" data-poll-id="${poll._id}">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                ${!isActive || isExpired ? `
                    <div class="poll-status">
                        <i class="fas fa-clock"></i> 
                        ${isExpired ? 'Expired' : 'Inactive'}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    showConfirmDialog(title, message, onConfirm, onCancel = null) {
        const id = Utils.generateId();
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = `confirm-modal-${id}`;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${Utils.sanitizeHtml(title)}</h3>
                </div>
                <div class="modal-body">
                    <p>${Utils.sanitizeHtml(message)}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline cancel-btn">Cancel</button>
                    <button class="btn btn-primary confirm-btn">Confirm</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const confirmBtn = modal.querySelector('.confirm-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        
        const cleanup = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, CONFIG.ANIMATION_DURATION);
        };
        
        confirmBtn.addEventListener('click', () => {
            cleanup();
            if (onConfirm) onConfirm();
        });
        
        cancelBtn.addEventListener('click', () => {
            cleanup();
            if (onCancel) onCancel();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cleanup();
                if (onCancel) onCancel();
            }
        });
        
        modal.classList.add('active');
    }
}

// Initialize UI manager
window.UI = new UIManager();
