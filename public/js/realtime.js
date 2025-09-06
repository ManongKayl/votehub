// Real-time Updates with Socket.IO
class RealTimeManager {
    constructor() {
        this.socket = null;
        this.connectedPolls = new Set();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        this.init();
    }
    
    init() {
        this.connect();
        this.bindEvents();
    }
    
    connect() {
        try {
            this.socket = io(CONFIG.SOCKET_URL, {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: false
            });
            
            this.socket.on('connect', () => {
                console.log('Connected to real-time server');
                this.reconnectAttempts = 0;
                
                // Rejoin polls that were connected before disconnect
                this.connectedPolls.forEach(pollId => {
                    this.socket.emit('join-poll', pollId);
                });
            });
            
            this.socket.on('disconnect', (reason) => {
                console.log('Disconnected from real-time server:', reason);
                
                if (reason === 'io server disconnect') {
                    // Server initiated disconnect, try to reconnect
                    this.handleReconnect();
                }
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                this.handleReconnect();
            });
            
            // Listen for vote updates
            this.socket.on('voteUpdate', (data) => {
                this.handleVoteUpdate(data);
            });
            
            // Listen for poll updates
            this.socket.on('pollUpdate', (data) => {
                this.handlePollUpdate(data);
            });
            
            // Listen for new polls
            this.socket.on('newPoll', (data) => {
                this.handleNewPoll(data);
            });
            
        } catch (error) {
            console.error('Failed to initialize socket connection:', error);
            this.handleReconnect();
        }
    }
    
    bindEvents() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden, reduce activity
                this.pauseUpdates();
            } else {
                // Page is visible, resume activity
                this.resumeUpdates();
            }
        });
        
        // Handle window beforeunload
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });
    }
    
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
            UI.showNotification('Lost connection to real-time updates', 'warning');
        }
    }
    
    joinPoll(pollId) {
        if (!pollId || this.connectedPolls.has(pollId)) return;
        
        if (this.socket && this.socket.connected) {
            this.socket.emit('join-poll', pollId);
            this.connectedPolls.add(pollId);
            console.log(`Joined poll: ${pollId}`);
        }
    }
    
    leavePoll(pollId) {
        if (!pollId || !this.connectedPolls.has(pollId)) return;
        
        if (this.socket && this.socket.connected) {
            this.socket.emit('leave-poll', pollId);
            this.connectedPolls.delete(pollId);
            console.log(`Left poll: ${pollId}`);
        }
    }
    
    leaveAllPolls() {
        this.connectedPolls.forEach(pollId => {
            if (this.socket && this.socket.connected) {
                this.socket.emit('leave-poll', pollId);
            }
        });
        this.connectedPolls.clear();
    }
    
    handleVoteUpdate(data) {
        const { pollId, results, totalVotes, uniqueVoters } = data;
        
        console.log('Received vote update for poll:', pollId);
        
        // Update poll modal if it's open and showing this poll
        const pollModal = document.getElementById('poll-modal');
        const pollModalBody = document.getElementById('poll-modal-body');
        
        if (pollModal && pollModal.classList.contains('active') && pollModalBody) {
            const voteForm = pollModalBody.querySelector(`[data-poll-id="${pollId}"]`);
            if (voteForm) {
                // Poll modal is showing this poll, update results
                this.updatePollModalResults(pollModalBody, results, totalVotes, uniqueVoters);
            }
        }
        
        // Update poll cards in the current view
        this.updatePollCards(pollId, results, totalVotes, uniqueVoters);
        
        // Update statistics if on home page
        this.updateHomeStatistics();
        
        // Show notification for real-time update
        if (this.connectedPolls.has(pollId)) {
            UI.showNotification('Poll results updated in real-time', 'info', 2000);
        }
    }
    
    updatePollModalResults(modalBody, results, totalVotes, uniqueVoters) {
        // Update results section
        const resultsContainer = modalBody.querySelector('.poll-results');
        if (resultsContainer && results) {
            resultsContainer.innerHTML = results.map((result, index) => `
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
            `).join('');
        }
        
        // Update statistics
        const statsContainer = modalBody.querySelector('.poll-stats-detail');
        if (statsContainer) {
            const totalVotesSpan = statsContainer.querySelector('.stat-item:first-child span');
            const uniqueVotersSpan = statsContainer.querySelector('.stat-item:nth-child(2) span');
            
            if (totalVotesSpan) {
                totalVotesSpan.textContent = `${Utils.formatNumber(totalVotes)} total votes`;
            }
            if (uniqueVotersSpan) {
                uniqueVotersSpan.textContent = `${Utils.formatNumber(uniqueVoters)} unique voters`;
            }
        }
    }
    
    updatePollCards(pollId, results, totalVotes, uniqueVoters) {
        const pollCards = document.querySelectorAll(`[data-poll-id="${pollId}"]`);
        
        pollCards.forEach(card => {
            // Update vote counts in options
            const options = card.querySelectorAll('.poll-option');
            options.forEach((option, index) => {
                const votesSpan = option.querySelector('.option-votes');
                const progressFill = option.querySelector('.progress-fill');
                
                if (results && results[index]) {
                    if (votesSpan) {
                        votesSpan.textContent = results[index].votes;
                    }
                    if (progressFill) {
                        progressFill.style.width = `${results[index].percentage}%`;
                    }
                }
            });
            
            // Update footer statistics
            const pollStats = card.querySelector('.poll-stats');
            if (pollStats) {
                const votesSpan = pollStats.querySelector('span:first-child');
                const votersSpan = pollStats.querySelector('span:nth-child(2)');
                
                if (votesSpan) {
                    votesSpan.innerHTML = `<i class="fas fa-vote-yea"></i> ${Utils.formatNumber(totalVotes)} votes`;
                }
                if (votersSpan) {
                    votersSpan.innerHTML = `<i class="fas fa-users"></i> ${Utils.formatNumber(uniqueVoters)} voters`;
                }
            }
        });
    }
    
    handlePollUpdate(data) {
        const { pollId, update } = data;
        
        console.log('Received poll update:', pollId, update);
        
        // Handle different types of poll updates
        switch (update.type) {
            case 'status_changed':
                this.handlePollStatusChange(pollId, update.isActive);
                break;
            case 'deleted':
                this.handlePollDeleted(pollId);
                break;
            case 'updated':
                this.handlePollDetailsUpdated(pollId, update.data);
                break;
        }
    }
    
    handlePollStatusChange(pollId, isActive) {
        const pollCards = document.querySelectorAll(`[data-poll-id="${pollId}"]`);
        
        pollCards.forEach(card => {
            const statusElement = card.querySelector('.poll-status');
            const voteButton = card.querySelector('.vote-btn');
            
            if (isActive) {
                if (statusElement) statusElement.remove();
                if (voteButton) voteButton.style.display = 'inline-flex';
            } else {
                if (!statusElement) {
                    const statusDiv = document.createElement('div');
                    statusDiv.className = 'poll-status';
                    statusDiv.innerHTML = '<i class="fas fa-clock"></i> Inactive';
                    card.appendChild(statusDiv);
                }
                if (voteButton) voteButton.style.display = 'none';
            }
        });
        
        UI.showNotification(`Poll ${isActive ? 'activated' : 'deactivated'}`, 'info', 3000);
    }
    
    handlePollDeleted(pollId) {
        const pollCards = document.querySelectorAll(`[data-poll-id="${pollId}"]`);
        
        pollCards.forEach(card => {
            card.style.opacity = '0.5';
            card.style.pointerEvents = 'none';
            
            const deletedBadge = document.createElement('div');
            deletedBadge.className = 'poll-status deleted';
            deletedBadge.innerHTML = '<i class="fas fa-trash"></i> Deleted';
            deletedBadge.style.backgroundColor = '#ef4444';
            deletedBadge.style.color = 'white';
            card.appendChild(deletedBadge);
        });
        
        // Close modal if showing deleted poll
        const pollModal = document.getElementById('poll-modal');
        const pollModalBody = document.getElementById('poll-modal-body');
        
        if (pollModal && pollModal.classList.contains('active') && pollModalBody) {
            const voteForm = pollModalBody.querySelector(`[data-poll-id="${pollId}"]`);
            if (voteForm) {
                UI.closeModal('poll-modal');
                UI.showNotification('This poll has been deleted', 'warning');
            }
        }
        
        this.leavePoll(pollId);
    }
    
    handleNewPoll(data) {
        const { poll } = data;
        
        console.log('New poll created:', poll);
        
        // Update home statistics
        this.updateHomeStatistics();
        
        // Show notification if user is on polls page
        const activeSection = document.querySelector('.section.active');
        if (activeSection && activeSection.id === 'polls-section') {
            UI.showNotification('New poll available! Refresh to see it.', 'info', 4000);
        }
    }
    
    async updateHomeStatistics() {
        // Only update if on home page
        const activeSection = document.querySelector('.section.active');
        if (!activeSection || activeSection.id !== 'home-section') return;
        
        try {
            // This would typically fetch updated statistics
            // For now, we'll just increment the displayed numbers slightly
            const totalPollsElement = document.getElementById('total-polls');
            const totalVotesElement = document.getElementById('total-votes');
            
            if (totalPollsElement) {
                const currentValue = parseInt(totalPollsElement.textContent.replace(/,/g, '')) || 0;
                totalPollsElement.textContent = Utils.formatNumber(currentValue);
            }
            
            if (totalVotesElement) {
                const currentValue = parseInt(totalVotesElement.textContent.replace(/,/g, '')) || 0;
                totalVotesElement.textContent = Utils.formatNumber(currentValue + 1);
            }
        } catch (error) {
            console.error('Error updating home statistics:', error);
        }
    }
    
    pauseUpdates() {
        // Reduce real-time update frequency when page is hidden
        if (this.socket) {
            this.socket.disconnect();
        }
    }
    
    resumeUpdates() {
        // Resume real-time updates when page becomes visible
        if (!this.socket || !this.socket.connected) {
            this.connect();
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.leaveAllPolls();
            this.socket.disconnect();
            this.socket = null;
        }
    }
    
    // Utility method to check connection status
    isConnected() {
        return this.socket && this.socket.connected;
    }
    
    // Method to manually trigger reconnection
    reconnect() {
        this.disconnect();
        this.reconnectAttempts = 0;
        this.connect();
    }
}

// Initialize real-time manager
window.RealTime = new RealTimeManager();
