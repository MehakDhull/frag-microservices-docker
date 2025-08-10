// Import styles and other dependencies
import './styles.css';
import { FragmentService } from './services/fragmentService.js';
import { OfflineService } from './services/offlineService.js';

class FragmentsApp {
    constructor() {
        this.fragmentService = new FragmentService();
        this.offlineService = new OfflineService();
        this.fragments = [];
        this.isOnline = navigator.onLine;
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupOfflineHandling();
        
        // Set up basic auth for local development
        this.fragmentService.setBasicAuth('user1@email.com', 'password1');
        
        // Load fragments on start
        await this.loadFragments();

        // Clean up any existing service workers and register minimal one
        if ('serviceWorker' in navigator) {
            try {
                // First, unregister any existing service workers
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                    console.log('Unregistered existing service worker');
                }
                
                // Wait a moment then register our minimal service worker
                setTimeout(async () => {
                    try {
                        const registration = await navigator.serviceWorker.register('/service-worker.js');
                        console.log('Minimal Service Worker registered:', registration);
                    } catch (error) {
                        console.log('Service Worker registration failed:', error);
                    }
                }, 100);
            } catch (error) {
                console.log('Service Worker cleanup failed:', error);
            }
        }
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Fragment form
        document.getElementById('fragment-form').addEventListener('submit', (e) => this.createFragment(e));
        document.getElementById('fragment-type').addEventListener('change', (e) => this.toggleContentInput(e.target.value));

        // Fragment list
        document.getElementById('refresh-btn').addEventListener('click', () => this.loadFragments());
        document.getElementById('search-input').addEventListener('input', (e) => this.searchFragments(e.target.value));

        // Modal
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-edit').addEventListener('click', () => this.closeModal());
        document.getElementById('edit-form').addEventListener('submit', (e) => this.updateFragment(e));
        document.getElementById('delete-fragment').addEventListener('click', () => this.deleteFragment());
    }

    setupOfflineHandling() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateOfflineStatus();
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateOfflineStatus();
        });

        this.updateOfflineStatus();
    }

    updateOfflineStatus() {
        const offlineStatus = document.getElementById('offline-status');
        if (this.isOnline) {
            offlineStatus.classList.add('hidden');
        } else {
            offlineStatus.classList.remove('hidden');
        }
    }

    async syncOfflineData() {
        // Prevent sync if already loading to avoid loops
        if (this.isLoading) {
            console.log('Sync skipped - already loading');
            return;
        }
        
        try {
            const offlineData = await this.offlineService.getOfflineData();
            for (const item of offlineData) {
                await this.fragmentService.syncOfflineFragment(item);
            }
            await this.offlineService.clearOfflineData();
            await this.loadFragments();
        } catch (error) {
            console.error('Error syncing offline data:', error);
        }
    }


    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('hidden', !content.id.startsWith(tabName));
        });

        // Only load fragments if switching to list tab and not already loading
        if (tabName === 'list' && !this.isLoading) {
            this.loadFragments();
        }
    }

    toggleContentInput(type) {
        const textInput = document.getElementById('text-input');
        const fileInput = document.getElementById('file-input');

        if (type.startsWith('image/')) {
            textInput.classList.add('hidden');
            fileInput.classList.remove('hidden');
        } else {
            textInput.classList.remove('hidden');
            fileInput.classList.add('hidden');
        }
    }

    async createFragment(event) {
        event.preventDefault();
        
        try {
            this.showLoading(true);
            
            const type = document.getElementById('fragment-type').value;
            let content;

            if (type.startsWith('image/')) {
                const fileInput = document.getElementById('fragment-file');
                if (!fileInput.files[0]) {
                    alert('Please select an image file');
                    return;
                }
                content = fileInput.files[0];
            } else {
                const textContent = document.getElementById('fragment-text').value.trim();
                if (!textContent) {
                    alert('Please enter some content');
                    return;
                }
                content = textContent;
            }

            try {
                const fragment = await this.fragmentService.createFragment(type, content);
                alert('Fragment created successfully!');
            } catch (error) {
                // If API is not available, create a mock fragment for demo
                console.log('API not available, creating demo fragment');
                const mockFragment = {
                    id: 'demo-' + Date.now(),
                    type: type,
                    size: typeof content === 'string' ? content.length : content.size || 0,
                    created: new Date().toISOString(),
                    updated: new Date().toISOString()
                };
                
                // Add to our local fragments list
                this.fragments.unshift(mockFragment);
                
                alert('Fragment created in demo mode!');
            }

            // Reset form
            document.getElementById('fragment-form').reset();
            document.getElementById('fragment-text').value = '';
            document.getElementById('fragment-file').value = '';
            
            // Switch to list tab and refresh
            this.switchTab('list');
            this.renderFragments(this.fragments);

        } catch (error) {
            console.error('Create fragment error:', error);
            alert('Failed to create fragment. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async loadFragments() {
        try {
            this.showLoading(true);
            
            if (this.isOnline) {
                try {
                    this.fragments = await this.fragmentService.getFragments();
                } catch (error) {
                    console.log('API not available, switching to demo mode');
                    // Use mock data when API is not available
                    this.fragments = this.getMockFragments();
                    // Show demo mode notification
                    this.showDemoModeNotification();
                }
            } else {
                // Load from offline storage
                this.fragments = await this.offlineService.getCachedFragments();
            }
            
            this.renderFragments(this.fragments);
        } catch (error) {
            console.error('Load fragments error:', error);
            // Fallback to demo mode
            this.fragments = this.getMockFragments();
            this.renderFragments(this.fragments);
            this.showDemoModeNotification();
        } finally {
            this.showLoading(false);
        }
    }

    getMockFragments() {
        return [
            {
                id: 'demo-001',
                type: 'text/plain',
                size: 123,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            },
            {
                id: 'demo-002', 
                type: 'text/markdown',
                size: 456,
                created: new Date(Date.now() - 86400000).toISOString(),
                updated: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'demo-003',
                type: 'application/json',
                size: 789,
                created: new Date(Date.now() - 172800000).toISOString(),
                updated: new Date(Date.now() - 172800000).toISOString()
            }
        ];
    }

    showDemoModeNotification() {
        // Create demo mode notification if it doesn't exist
        let demoNotification = document.getElementById('demo-notification');
        if (!demoNotification) {
            demoNotification = document.createElement('div');
            demoNotification.id = 'demo-notification';
            demoNotification.className = 'demo-notification';
            demoNotification.innerHTML = `
                <span>🚧 Demo Mode - API Server not available. Showing mock data.</span>
                <button onclick="this.parentElement.style.display='none'">×</button>
            `;
            document.querySelector('.main-content').prepend(demoNotification);
        }
        demoNotification.style.display = 'block';
    }

    renderFragments(fragments) {
        const container = document.getElementById('fragments-container');
        
        if (!fragments || fragments.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1;">
                    <p style="color: #666; font-size: 1.1rem;">No fragments found</p>
                    <p style="color: #999;">Create your first fragment to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = fragments.map(fragment => this.createFragmentCard(fragment)).join('');
    }

    createFragmentCard(fragment) {
        const createdDate = new Date(fragment.created).toLocaleDateString();
        const sizeFormatted = this.formatFileSize(fragment.size);
        const preview = this.createFragmentPreview(fragment);

        return `
            <div class="fragment-card" data-id="${fragment.id}">
                <div class="fragment-card-header">
                    <span class="fragment-type">${fragment.type}</span>
                    <div class="fragment-id">${fragment.id.substring(0, 8)}...</div>
                </div>
                ${preview}
                <div class="fragment-meta">
                    <span class="fragment-size">${sizeFormatted}</span>
                    <span class="fragment-date">${createdDate}</span>
                </div>
                <div class="fragment-actions">
                    <button class="btn btn-primary" onclick="app.editFragment('${fragment.id}')">
                        Edit
                    </button>
                    <button class="btn btn-secondary" onclick="app.downloadFragment('${fragment.id}')">
                        Download
                    </button>
                    <button class="btn btn-danger" onclick="app.confirmDeleteFragment('${fragment.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    createFragmentPreview(fragment) {
        if (fragment.type.startsWith('image/')) {
            return `
                <div class="fragment-preview image">
                    <img src="${this.fragmentService.apiUrl}/v1/fragments/${fragment.id}" 
                         alt="Fragment preview" 
                         onerror="this.style.display='none'">
                </div>
            `;
        } else {
            // For text content, we'd need to fetch it - for now show placeholder
            return `
                <div class="fragment-preview">
                    <div style="color: #999; font-style: italic;">
                        Click "Edit" to view content
                    </div>
                </div>
            `;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async editFragment(id) {
        try {
            this.showLoading(true);
            
            const fragment = this.fragments.find(f => f.id === id);
            if (!fragment) return;

            const content = await this.fragmentService.getFragmentData(id);
            
            // Populate modal
            document.getElementById('edit-fragment-id').textContent = fragment.id;
            document.getElementById('edit-fragment-type').textContent = fragment.type;
            document.getElementById('edit-content').value = content;
            
            // Populate conversion options
            const convertSelect = document.getElementById('convert-to');
            convertSelect.innerHTML = this.getConversionOptions(fragment.type);
            
            // Store current fragment for editing
            this.currentEditingFragment = fragment;
            
            // Show modal
            document.getElementById('edit-modal').classList.remove('hidden');
            
        } catch (error) {
            console.error('Edit fragment error:', error);
            alert('Failed to load fragment for editing');
        } finally {
            this.showLoading(false);
        }
    }

    getConversionOptions(type) {
        const conversions = {
            'text/plain': ['text/plain'],
            'text/markdown': ['text/markdown', 'text/html', 'text/plain'],
            'text/html': ['text/html', 'text/plain'],
            'text/csv': ['text/csv', 'text/plain', 'application/json'],
            'application/json': ['application/json', 'application/yaml', 'text/plain'],
            'application/yaml': ['application/yaml', 'text/plain'],
            'image/png': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
            'image/jpeg': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
            'image/webp': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
            'image/gif': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
            'image/avif': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
        };

        const available = conversions[type] || [type];
        return available.map(t => `<option value="${t}"${t === type ? ' selected' : ''}>${t}</option>`).join('');
    }

    async updateFragment(event) {
        event.preventDefault();
        
        try {
            this.showLoading(true);
            
            const content = document.getElementById('edit-content').value;
            const convertTo = document.getElementById('convert-to').value;
            
            await this.fragmentService.updateFragment(this.currentEditingFragment.id, content, convertTo);
            
            if (!this.isOnline) {
                await this.offlineService.storeOfflineFragment('update', {
                    id: this.currentEditingFragment.id,
                    content,
                    convertTo
                });
                alert('Fragment updated and will be synced when online');
            } else {
                alert('Fragment updated successfully!');
            }
            
            this.closeModal();
            this.loadFragments();
            
        } catch (error) {
            console.error('Update fragment error:', error);
            alert('Failed to update fragment');
        } finally {
            this.showLoading(false);
        }
    }

    async downloadFragment(id, extension = '') {
        try {
            const url = `${this.fragmentService.apiUrl}/v1/fragments/${id}${extension}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.fragmentService.authToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `fragment_${id}${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download fragment');
        }
    }

    confirmDeleteFragment(id) {
        if (confirm('Are you sure you want to delete this fragment? This action cannot be undone.')) {
            this.deleteFragmentById(id);
        }
    }

    async deleteFragmentById(id) {
        try {
            this.showLoading(true);
            
            await this.fragmentService.deleteFragment(id);
            
            if (!this.isOnline) {
                await this.offlineService.storeOfflineFragment('delete', { id });
                alert('Fragment deletion queued and will sync when online');
            } else {
                alert('Fragment deleted successfully');
            }
            
            this.loadFragments();
            
        } catch (error) {
            console.error('Delete fragment error:', error);
            alert('Failed to delete fragment');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteFragment() {
        if (!this.currentEditingFragment) return;
        
        if (confirm('Are you sure you want to delete this fragment? This action cannot be undone.')) {
            await this.deleteFragmentById(this.currentEditingFragment.id);
            this.closeModal();
        }
    }

    searchFragments(query) {
        if (!query.trim()) {
            this.renderFragments(this.fragments);
            return;
        }

        const filtered = this.fragments.filter(fragment => 
            fragment.type.toLowerCase().includes(query.toLowerCase()) ||
            fragment.id.toLowerCase().includes(query.toLowerCase()) ||
            new Date(fragment.created).toLocaleDateString().includes(query)
        );

        this.renderFragments(filtered);
    }

    closeModal() {
        document.getElementById('edit-modal').classList.add('hidden');
        this.currentEditingFragment = null;
    }

    showLoading(show) {
        this.isLoading = show;
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FragmentsApp();
});

export default FragmentsApp;
