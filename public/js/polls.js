// Poll Management
class PollManager {
    constructor() {
        this.currentPage = 1;
        this.currentFilters = {};
        this.currentSort = 'createdAt';
        this.currentOrder = 'desc';
        this.pollsPerPage = CONFIG.DEFAULT_PAGE_SIZE;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        // Create poll form
        const createPollForm = document.getElementById('create-poll-form');
        if (createPollForm) {
            createPollForm.addEventListener('submit', (e) => this.handleCreatePoll(e));
        }
        
        // Add option button
        const addOptionBtn = document.getElementById('add-option-btn');
        if (addOptionBtn) {
            addOptionBtn.addEventListener('click', () => this.addPollOption());
        }
        
        // Filter and search
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');
        const searchInput = document.getElementById('search-input');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (sortFilter) {
            sortFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => this.applyFilters(), CONFIG.DEBOUNCE_DELAY));
        }
        
        // Poll card clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.poll-card.clickable')) {
                const pollCard = e.target.closest('.poll-card');
                const pollId = pollCard.dataset.pollId;
                if (pollId) {
                    this.showPollDetail(pollId);
                }
            }
            
            if (e.target.classList.contains('vote-btn')) {
                e.stopPropagation();
                const pollId = e.target.dataset.pollId;
                if (pollId) {
                    this.showVoteModal(pollId);
                }
            }
            
            if (e.target.classList.contains('view-btn')) {
                e.stopPropagation();
                const pollId = e.target.dataset.pollId;
                if (pollId) {
                    this.showPollDetail(pollId);
                }
            }
        });
        
        // Remove option buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-remove-option')) {
                const optionInput = e.target.closest('.option-input');
                if (optionInput) {
                    this.removePollOption(optionInput);
                }
            }
        });
    }
    
    async loadPolls(section = 'polls', page = 1) {
        const container = document.getElementById(`${section}-grid`);
        const paginationContainer = document.getElementById(`${section}-pagination`);
        
        if (!container) return;
        
        try {
            UI.createSkeletonLoader(container, 'polls');
            
            let params = {
                page,
                limit: this.pollsPerPage,
                sortBy: this.currentSort,
                sortOrder: this.currentOrder,
                ...this.currentFilters
            };
            
            let response;
            if (section === 'my-polls') {
                if (!Auth.requireAuth()) return;
                response = await API.getMyPolls(params);
            } else {
                response = await API.getPolls(params);
            }
            
            if (response.success) {
                this.renderPolls(container, response.data.polls, {
                    showActions: true,
                    showResults: false,
                    clickable: true
                });
                
                if (paginationContainer && response.data.pagination) {
                    UI.createPagination(
                        paginationContainer,
                        response.data.pagination.current,
                        response.data.pagination.pages,
                        (newPage) => {
                            this.currentPage = newPage;
                            this.loadPolls(section, newPage);
                        }
                    );
                }
                
                this.currentPage = page;
            }
        } catch (error) {
            UI.createEmptyState(
                container,
                'fas fa-exclamation-triangle',
                'Error Loading Polls',
                error.message || 'Failed to load polls. Please try again.',
                'Retry',
                () => this.loadPolls(section, page)
            );
        }
    }
    
    async loadFeaturedPolls() {
        const container = document.getElementById('featured-polls-grid');
        if (!container) return;
        
        try {
            const response = await API.getPolls({
                limit: 6,
                sortBy: 'totalVotes',
                sortOrder: 'desc'
            });
            
            if (response.success && response.data.polls.length > 0) {
                this.renderPolls(container, response.data.polls, {
                    showActions: true,
                    showResults: true,
                    clickable: true
                });
            } else {
                UI.createEmptyState(
                    container,
                    'fas fa-poll',
                    'No Polls Yet',
                    'Be the first to create a poll and start gathering opinions!',
                    'Create Poll',
                    () => window.app.loadSection('create')
                );
            }
        } catch (error) {
            console.error('Error loading featured polls:', error);
        }
    }
    
    renderPolls(container, polls, options = {}) {
        if (!polls || polls.length === 0) {
            UI.createEmptyState(
                container,
                'fas fa-poll',
                'No Polls Found',
                'No polls match your current filters.',
                'Clear Filters',
                () => this.clearFilters()
            );
            return;
        }
        
        container.innerHTML = polls.map(poll => UI.formatPollCard(poll, options)).join('');
    }
    
    applyFilters() {
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');
        const searchInput = document.getElementById('search-input');
        
        this.currentFilters = {};
        
        if (categoryFilter && categoryFilter.value !== 'all') {
            this.currentFilters.category = categoryFilter.value;
        }
        
        if (searchInput && searchInput.value.trim()) {
            this.currentFilters.search = searchInput.value.trim();
        }
        
        if (sortFilter && sortFilter.value) {
            this.currentSort = sortFilter.value;
        }
        
        this.currentPage = 1;
        
        // Determine current section
        const activeSection = document.querySelector('.section.active');
        const sectionId = activeSection ? activeSection.id.replace('-section', '') : 'polls';
        
        this.loadPolls(sectionId, 1);
    }
    
    clearFilters() {
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');
        const searchInput = document.getElementById('search-input');
        
        if (categoryFilter) categoryFilter.value = 'all';
        if (sortFilter) sortFilter.value = 'createdAt';
        if (searchInput) searchInput.value = '';
        
        this.currentFilters = {};
        this.currentSort = 'createdAt';
        this.currentOrder = 'desc';
        this.currentPage = 1;
        
        this.applyFilters();
    }
    
    async handleCreatePoll(e) {
        e.preventDefault();
        
        if (!Auth.requireAuth()) return;
        
        const formData = new FormData(e.target);
        const title = formData.get('title');
        const description = formData.get('description');
        const category = formData.get('category');
        const endDate = formData.get('endDate');
        const tags = formData.get('tags');
        const isPublic = formData.has('isPublic');
        const allowMultipleVotes = formData.has('allowMultipleVotes');
        
        // Get options
        const optionInputs = e.target.querySelectorAll('input[name="option"]');
        const options = Array.from(optionInputs)
            .map(input => input.value.trim())
            .filter(option => option.length > 0);
        
        // Validation
        if (!title || title.length > CONFIG.MAX_POLL_TITLE_LENGTH) {
            UI.showNotification(`Poll title is required and must be less than ${CONFIG.MAX_POLL_TITLE_LENGTH} characters`, 'error');
            return;
        }
        
        if (description && description.length > CONFIG.MAX_POLL_DESCRIPTION_LENGTH) {
            UI.showNotification(`Poll description must be less than ${CONFIG.MAX_POLL_DESCRIPTION_LENGTH} characters`, 'error');
            return;
        }
        
        if (options.length < CONFIG.MIN_POLL_OPTIONS) {
            UI.showNotification(`Poll must have at least ${CONFIG.MIN_POLL_OPTIONS} options`, 'error');
            return;
        }
        
        if (options.length > CONFIG.MAX_POLL_OPTIONS) {
            UI.showNotification(`Poll cannot have more than ${CONFIG.MAX_POLL_OPTIONS} options`, 'error');
            return;
        }
        
        for (const option of options) {
            if (option.length > CONFIG.MAX_OPTION_LENGTH) {
                UI.showNotification(`Each option must be less than ${CONFIG.MAX_OPTION_LENGTH} characters`, 'error');
                return;
            }
        }
        
        try {
            UI.showLoading(e.target.querySelector('button[type="submit"]'), 'Creating...');
            
            const pollData = {
                title,
                description,
                options,
                category,
                isPublic,
                allowMultipleVotes,
                tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : []
            };
            
            if (endDate) {
                pollData.endDate = endDate;
            }
            
            const response = await API.createPoll(pollData);
            
            if (response.success) {
                UI.showNotification(CONFIG.SUCCESS_MESSAGES.POLL_CREATED, 'success');
                e.target.reset();
                this.resetPollOptions();
                
                // Navigate to the new poll
                this.showPollDetail(response.data.poll._id);
            }
        } catch (error) {
            UI.showNotification(error.message || 'Failed to create poll', 'error');
        } finally {
            UI.hideLoading(e.target.querySelector('button[type="submit"]'));
        }
    }
    
    addPollOption() {
        const optionsContainer = document.getElementById('poll-options');
        const optionInputs = optionsContainer.querySelectorAll('.option-input');
        
        if (optionInputs.length >= CONFIG.MAX_POLL_OPTIONS) {
            UI.showNotification(`Maximum ${CONFIG.MAX_POLL_OPTIONS} options allowed`, 'warning');
            return;
        }
        
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-input';
        optionDiv.innerHTML = `
            <input type="text" name="option" placeholder="Option ${optionInputs.length + 1}" required maxlength="${CONFIG.MAX_OPTION_LENGTH}">
            <button type="button" class="btn-remove-option">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        optionsContainer.appendChild(optionDiv);
        this.updateRemoveButtons();
        
        // Focus new input
        const newInput = optionDiv.querySelector('input');
        if (newInput) newInput.focus();
    }
    
    removePollOption(optionInput) {
        const optionsContainer = document.getElementById('poll-options');
        const optionInputs = optionsContainer.querySelectorAll('.option-input');
        
        if (optionInputs.length <= CONFIG.MIN_POLL_OPTIONS) {
            UI.showNotification(`Minimum ${CONFIG.MIN_POLL_OPTIONS} options required`, 'warning');
            return;
        }
        
        optionInput.remove();
        this.updateRemoveButtons();
        this.updateOptionPlaceholders();
    }
    
    updateRemoveButtons() {
        const optionsContainer = document.getElementById('poll-options');
        const optionInputs = optionsContainer.querySelectorAll('.option-input');
        const removeButtons = optionsContainer.querySelectorAll('.btn-remove-option');
        
        removeButtons.forEach(btn => {
            btn.disabled = optionInputs.length <= CONFIG.MIN_POLL_OPTIONS;
        });
    }
    
    updateOptionPlaceholders() {
        const optionsContainer = document.getElementById('poll-options');
        const optionInputs = optionsContainer.querySelectorAll('.option-input input');
        
        optionInputs.forEach((input, index) => {
            input.placeholder = `Option ${index + 1}`;
        });
    }
    
    resetPollOptions() {
        const optionsContainer = document.getElementById('poll-options');
        optionsContainer.innerHTML = `
            <div class="option-input">
                <input type="text" name="option" placeholder="Option 1" required maxlength="${CONFIG.MAX_OPTION_LENGTH}">
                <button type="button" class="btn-remove-option" disabled>
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="option-input">
                <input type="text" name="option" placeholder="Option 2" required maxlength="${CONFIG.MAX_OPTION_LENGTH}">
                <button type="button" class="btn-remove-option" disabled>
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
    async showPollDetail(pollId) {
        try {
            const response = await API.getPoll(pollId);
            
            if (response.success) {
                const poll = response.data.poll;
                this.renderPollModal(poll);
                UI.showModal('poll-modal');
                
                // Join real-time updates for this poll
                if (window.RealTime) {
                    window.RealTime.joinPoll(pollId);
                }
            }
        } catch (error) {
            UI.showNotification(error.message || 'Failed to load poll details', 'error');
        }
    }
    
    renderPollModal(poll) {
        const modalTitle = document.getElementById('poll-modal-title');
        const modalBody = document.getElementById('poll-modal-body');
        
        if (modalTitle) {
            modalTitle.textContent = poll.title;
        }
        
        if (modalBody) {
            const hasVoted = poll.hasVoted || false;
            const isActive = poll.isCurrentlyActive !== false;
            const canVote = !hasVoted && isActive && Auth.isAuthenticated;
            
            modalBody.innerHTML = `
                <div class="poll-detail">
                    <div class="poll-meta">
                        <span class="poll-category">${poll.category || 'General'}</span>
                        <span class="poll-date">Created ${Utils.formatRelativeTime(poll.createdAt)}</span>
                        <span class="poll-creator">by ${Utils.sanitizeHtml(poll.creator.username)}</span>
                    </div>
                    
                    ${poll.description ? `<p class="poll-description">${Utils.sanitizeHtml(poll.description)}</p>` : ''}
                    
                    <div class="poll-voting-section">
                        ${canVote ? `
                            <h4>Cast Your Vote</h4>
                            <form id="vote-form" data-poll-id="${poll._id}">
                                <div class="vote-options">
                                    ${poll.options.map((option, index) => `
                                        <label class="vote-option">
                                            <input type="radio" name="option" value="${index}" required>
                                            <span class="option-text">${Utils.sanitizeHtml(option.text)}</span>
                                        </label>
                                    `).join('')}
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-vote-yea"></i> Cast Vote
                                </button>
                            </form>
                        ` : `
                            <h4>Results</h4>
                            <div class="poll-results">
                                ${poll.results ? poll.results.map((result, index) => `
                                    <div class="result-item">
                                        <div class="result-header">
                                            <span class="result-text">${Utils.sanitizeHtml(result.text)}</span>
                                            <span class="result-percentage">${result.percentage}%</span>
                                        </div>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${result.percentage}%"></div>
                                        </div>
                                        <div class="result-votes">${Utils.formatNumber(result.votes)} votes</div>
                                    </div>
                                `).join('') : ''}
                            </div>
                        `}
                    </div>
                    
                    <div class="poll-stats-detail">
                        <div class="stat-item">
                            <i class="fas fa-vote-yea"></i>
                            <span>${Utils.formatNumber(poll.totalVotes || 0)} total votes</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-users"></i>
                            <span>${Utils.formatNumber(poll.uniqueVoters || 0)} unique voters</span>
                        </div>
                        ${poll.endDate ? `
                            <div class="stat-item">
                                <i class="fas fa-clock"></i>
                                <span>Ends ${Utils.formatDate(poll.endDate)}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${poll.tags && poll.tags.length > 0 ? `
                        <div class="poll-tags">
                            ${poll.tags.map(tag => `<span class="tag">#${Utils.sanitizeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
            
            // Bind vote form
            const voteForm = modalBody.querySelector('#vote-form');
            if (voteForm) {
                voteForm.addEventListener('submit', (e) => this.handleVote(e));
            }
        }
    }
    
    async handleVote(e) {
        e.preventDefault();
        
        if (!Auth.requireAuth()) return;
        
        const formData = new FormData(e.target);
        const pollId = e.target.dataset.pollId;
        const optionIndex = parseInt(formData.get('option'));
        
        if (isNaN(optionIndex)) {
            UI.showNotification('Please select an option', 'error');
            return;
        }
        
        try {
            UI.showLoading(e.target.querySelector('button[type="submit"]'), 'Voting...');
            
            const response = await API.castVote({ pollId, optionIndex });
            
            if (response.success) {
                UI.showNotification(CONFIG.SUCCESS_MESSAGES.VOTE_CAST, 'success');
                
                // Refresh poll detail
                this.showPollDetail(pollId);
                
                // Refresh polls list if visible
                const activeSection = document.querySelector('.section.active');
                if (activeSection && ['polls-section', 'my-polls-section'].includes(activeSection.id)) {
                    const sectionId = activeSection.id.replace('-section', '');
                    this.loadPolls(sectionId, this.currentPage);
                }
            }
        } catch (error) {
            UI.showNotification(error.message || 'Failed to cast vote', 'error');
        } finally {
            UI.hideLoading(e.target.querySelector('button[type="submit"]'));
        }
    }
    
    async showVoteModal(pollId) {
        this.showPollDetail(pollId);
    }
    
    async deletePoll(pollId) {
        if (!Auth.requireAuth()) return;
        
        UI.showConfirmDialog(
            'Delete Poll',
            'Are you sure you want to delete this poll? This action cannot be undone.',
            async () => {
                try {
                    const response = await API.deletePoll(pollId);
                    
                    if (response.success) {
                        UI.showNotification(CONFIG.SUCCESS_MESSAGES.POLL_DELETED, 'success');
                        
                        // Close modal if open
                        UI.closeModal('poll-modal');
                        
                        // Refresh current section
                        const activeSection = document.querySelector('.section.active');
                        if (activeSection) {
                            const sectionId = activeSection.id.replace('-section', '');
                            this.loadPolls(sectionId, this.currentPage);
                        }
                    }
                } catch (error) {
                    UI.showNotification(error.message || 'Failed to delete poll', 'error');
                }
            }
        );
    }
}

// Initialize poll manager
window.PollManager = new PollManager();
