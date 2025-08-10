export class FragmentService {
    constructor() {
        // Use environment variable or default to localhost for Docker development
        this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
        this.authToken = null;
    }

    setAuthToken(token) {
        this.authToken = token;
    }

    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.authToken) {
            // For development with HTTP Basic Auth
            if (this.authToken.includes(':')) {
                headers['Authorization'] = `Basic ${btoa(this.authToken)}`;
            } else {
                // For production with Cognito tokens
                headers['Authorization'] = `Bearer ${this.authToken}`;
            }
        }

        return headers;
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.apiUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers,
            },
        };

        const response = await fetch(url, config);
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        // Handle different content types
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else if (contentType && contentType.startsWith('text/')) {
            return response.text();
        } else {
            return response.blob();
        }
    }

    async getFragments(expand = true) {
        try {
            const data = await this.makeRequest(`/v1/fragments?expand=${expand ? '1' : '0'}`);
            return data.fragments || [];
        } catch (error) {
            console.error('Error fetching fragments:', error);
            throw error;
        }
    }

    async getFragmentData(id) {
        try {
            return await this.makeRequest(`/v1/fragments/${id}`);
        } catch (error) {
            console.error('Error fetching fragment data:', error);
            throw error;
        }
    }

    async getFragmentInfo(id) {
        try {
            const data = await this.makeRequest(`/v1/fragments/${id}/info`);
            return data.fragment;
        } catch (error) {
            console.error('Error fetching fragment info:', error);
            throw error;
        }
    }

    async createFragment(type, content) {
        try {
            let body;
            const headers = {};

            if (this.authToken) {
                if (this.authToken.includes(':')) {
                    headers['Authorization'] = `Basic ${btoa(this.authToken)}`;
                } else {
                    headers['Authorization'] = `Bearer ${this.authToken}`;
                }
            }

            if (content instanceof File) {
                // Handle file uploads
                body = content;
                headers['Content-Type'] = type;
            } else {
                // Handle text content
                body = content;
                headers['Content-Type'] = type;
            }

            const response = await fetch(`${this.apiUrl}/v1/fragments`, {
                method: 'POST',
                headers,
                body,
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Create fragment failed: ${response.status} - ${error}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating fragment:', error);
            throw error;
        }
    }

    async updateFragment(id, content, contentType) {
        try {
            const headers = {};
            
            if (this.authToken) {
                if (this.authToken.includes(':')) {
                    headers['Authorization'] = `Basic ${btoa(this.authToken)}`;
                } else {
                    headers['Authorization'] = `Bearer ${this.authToken}`;
                }
            }

            headers['Content-Type'] = contentType;

            const response = await fetch(`${this.apiUrl}/v1/fragments/${id}`, {
                method: 'PUT',
                headers,
                body: content,
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Update fragment failed: ${response.status} - ${error}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating fragment:', error);
            throw error;
        }
    }

    async deleteFragment(id) {
        try {
            const headers = {};
            
            if (this.authToken) {
                if (this.authToken.includes(':')) {
                    headers['Authorization'] = `Basic ${btoa(this.authToken)}`;
                } else {
                    headers['Authorization'] = `Bearer ${this.authToken}`;
                }
            }

            const response = await fetch(`${this.apiUrl}/v1/fragments/${id}`, {
                method: 'DELETE',
                headers,
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Delete fragment failed: ${response.status} - ${error}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting fragment:', error);
            throw error;
        }
    }

    async convertFragment(id, extension) {
        try {
            return await this.makeRequest(`/v1/fragments/${id}${extension}`);
        } catch (error) {
            console.error('Error converting fragment:', error);
            throw error;
        }
    }

    async syncOfflineFragment(offlineItem) {
        try {
            switch (offlineItem.action) {
                case 'create':
                    await this.createFragment(offlineItem.data.type, offlineItem.data.content);
                    break;
                case 'update':
                    await this.updateFragment(offlineItem.data.id, offlineItem.data.content, offlineItem.data.convertTo);
                    break;
                case 'delete':
                    await this.deleteFragment(offlineItem.data.id);
                    break;
            }
        } catch (error) {
            console.error('Error syncing offline fragment:', error);
            throw error;
        }
    }

    // Helper method for testing with HTTP Basic Auth
    setBasicAuth(username, password) {
        this.authToken = `${username}:${password}`;
    }

    // Method to test API connectivity
    async testConnection() {
        try {
            const response = await fetch(this.apiUrl);
            return response.ok;
        } catch (error) {
            console.error('API connection test failed:', error);
            return false;
        }
    }
}
