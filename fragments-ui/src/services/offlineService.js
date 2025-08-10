import Dexie from 'dexie';

export class OfflineService {
    constructor() {
        // Initialize IndexedDB database using Dexie
        this.db = new Dexie('FragmentsOfflineDB');
        
        // Define schema
        this.db.version(1).stores({
            fragments: 'id, ownerId, type, size, created, updated',
            fragmentData: 'fragmentId, data',
            offlineQueue: '++id, action, timestamp, data'
        });

        this.init();
    }

    async init() {
        try {
            await this.db.open();
            console.log('Offline database initialized');
        } catch (error) {
            console.error('Failed to initialize offline database:', error);
        }
    }

    // Store fragment metadata for offline access
    async cacheFragment(fragment) {
        try {
            await this.db.fragments.put(fragment);
        } catch (error) {
            console.error('Error caching fragment:', error);
        }
    }

    // Store fragment data for offline access
    async cacheFragmentData(fragmentId, data) {
        try {
            await this.db.fragmentData.put({
                fragmentId,
                data,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error caching fragment data:', error);
        }
    }

    // Get cached fragments
    async getCachedFragments(ownerId = null) {
        try {
            if (ownerId) {
                return await this.db.fragments.where('ownerId').equals(ownerId).toArray();
            } else {
                return await this.db.fragments.toArray();
            }
        } catch (error) {
            console.error('Error getting cached fragments:', error);
            return [];
        }
    }

    // Get cached fragment data
    async getCachedFragmentData(fragmentId) {
        try {
            const item = await this.db.fragmentData.get(fragmentId);
            return item ? item.data : null;
        } catch (error) {
            console.error('Error getting cached fragment data:', error);
            return null;
        }
    }

    // Store offline actions for later synchronization
    async storeOfflineFragment(action, data) {
        try {
            await this.db.offlineQueue.add({
                action,
                data,
                timestamp: new Date().toISOString()
            });
            console.log(`Offline action stored: ${action}`);
        } catch (error) {
            console.error('Error storing offline action:', error);
        }
    }

    // Get all offline actions that need to be synchronized
    async getOfflineData() {
        try {
            return await this.db.offlineQueue.orderBy('timestamp').toArray();
        } catch (error) {
            console.error('Error getting offline data:', error);
            return [];
        }
    }

    // Clear synchronized offline data
    async clearOfflineData() {
        try {
            await this.db.offlineQueue.clear();
            console.log('Offline queue cleared');
        } catch (error) {
            console.error('Error clearing offline data:', error);
        }
    }

    // Remove specific offline action (useful for failed syncs)
    async removeOfflineAction(id) {
        try {
            await this.db.offlineQueue.delete(id);
        } catch (error) {
            console.error('Error removing offline action:', error);
        }
    }

    // Update cached fragments after successful sync
    async updateCachedFragments(fragments) {
        try {
            // Clear existing cache and add new data
            await this.db.fragments.clear();
            await this.db.fragments.bulkAdd(fragments);
        } catch (error) {
            console.error('Error updating cached fragments:', error);
        }
    }

    // Remove fragment from cache
    async removeCachedFragment(fragmentId) {
        try {
            await this.db.fragments.delete(fragmentId);
            await this.db.fragmentData.delete(fragmentId);
        } catch (error) {
            console.error('Error removing cached fragment:', error);
        }
    }

    // Check if we have cached data
    async hasCachedData() {
        try {
            const count = await this.db.fragments.count();
            return count > 0;
        } catch (error) {
            console.error('Error checking cached data:', error);
            return false;
        }
    }

    // Get offline queue count
    async getOfflineQueueCount() {
        try {
            return await this.db.offlineQueue.count();
        } catch (error) {
            console.error('Error getting offline queue count:', error);
            return 0;
        }
    }

    // Clear all cached data (useful for logout or reset)
    async clearAllCache() {
        try {
            await this.db.fragments.clear();
            await this.db.fragmentData.clear();
            await this.db.offlineQueue.clear();
            console.log('All cache cleared');
        } catch (error) {
            console.error('Error clearing all cache:', error);
        }
    }

    // Get database statistics
    async getStats() {
        try {
            return {
                fragments: await this.db.fragments.count(),
                fragmentData: await this.db.fragmentData.count(),
                offlineQueue: await this.db.offlineQueue.count()
            };
        } catch (error) {
            console.error('Error getting database stats:', error);
            return { fragments: 0, fragmentData: 0, offlineQueue: 0 };
        }
    }

    // Export cached data (for backup or debugging)
    async exportCachedData() {
        try {
            return {
                fragments: await this.db.fragments.toArray(),
                fragmentData: await this.db.fragmentData.toArray(),
                offlineQueue: await this.db.offlineQueue.toArray()
            };
        } catch (error) {
            console.error('Error exporting cached data:', error);
            return { fragments: [], fragmentData: [], offlineQueue: [] };
        }
    }

    // Import cached data (for restore)
    async importCachedData(data) {
        try {
            await this.db.transaction('rw', this.db.fragments, this.db.fragmentData, this.db.offlineQueue, async () => {
                // Clear existing data
                await this.db.fragments.clear();
                await this.db.fragmentData.clear();
                await this.db.offlineQueue.clear();

                // Import new data
                if (data.fragments) {
                    await this.db.fragments.bulkAdd(data.fragments);
                }
                if (data.fragmentData) {
                    await this.db.fragmentData.bulkAdd(data.fragmentData);
                }
                if (data.offlineQueue) {
                    await this.db.offlineQueue.bulkAdd(data.offlineQueue);
                }
            });
            console.log('Cached data imported successfully');
        } catch (error) {
            console.error('Error importing cached data:', error);
        }
    }

    // Check database health
    async healthCheck() {
        try {
            // Try to perform basic operations
            await this.db.fragments.limit(1).toArray();
            await this.db.fragmentData.limit(1).toArray();
            await this.db.offlineQueue.limit(1).toArray();
            return true;
        } catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }

    // Optimize database (useful for maintenance)
    async optimize() {
        try {
            // Remove old fragment data (older than 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const oldFragmentData = await this.db.fragmentData
                .where('timestamp')
                .below(thirtyDaysAgo.toISOString())
                .toArray();
            
            if (oldFragmentData.length > 0) {
                await this.db.fragmentData
                    .where('timestamp')
                    .below(thirtyDaysAgo.toISOString())
                    .delete();
                
                console.log(`Removed ${oldFragmentData.length} old fragment data entries`);
            }

            return true;
        } catch (error) {
            console.error('Database optimization failed:', error);
            return false;
        }
    }
}
