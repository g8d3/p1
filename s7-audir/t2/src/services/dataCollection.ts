// Data Collection Service
// This service handles collecting data from various sources

export interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'scraping' | 'blockchain';
  endpoint: string;
  status: 'active' | 'inactive' | 'error';
  lastRun?: Date;
  itemsCollected: number;
}

export interface CollectionResult {
  sourceId: string;
  success: boolean;
  itemsCollected: number;
  errors?: string[];
  timestamp: Date;
}

class DataCollectionService {
  private sources: DataSource[] = [
    {
      id: 'twitter',
      name: 'Twitter/X API',
      type: 'api',
      endpoint: '/api/sources/twitter/search',
      status: 'active',
      itemsCollected: 0
    },
    {
      id: 'github',
      name: 'GitHub API',
      type: 'api',
      endpoint: '/api/sources/github/search',
      status: 'active',
      itemsCollected: 0
    },
    {
      id: 'immunefi',
      name: 'Immunefi API',
      type: 'api',
      endpoint: '/api/sources/immunefi/bounties',
      status: 'active',
      itemsCollected: 0
    },
    {
      id: 'code4rena',
      name: 'Code4rena API',
      type: 'api',
      endpoint: '/api/sources/code4rena/contests',
      status: 'active',
      itemsCollected: 0
    },
    {
      id: 'blockchain',
      name: 'Blockchain Monitor',
      type: 'blockchain',
      endpoint: '/api/sources/blockchain/transactions',
      status: 'active',
      itemsCollected: 0
    }
  ];

  // Get all data sources
  getSources(): DataSource[] {
    return this.sources;
  }

  // Get source by ID
  getSource(id: string): DataSource | undefined {
    return this.sources.find(source => source.id === id);
  }

  // Update source status
  updateSourceStatus(id: string, status: 'active' | 'inactive'): boolean {
    const source = this.sources.find(s => s.id === id);
    if (source) {
      source.status = status;
      return true;
    }
    return false;
  }

  // Collect data from a specific source
  async collectFromSource(sourceId: string): Promise<CollectionResult> {
    const source = this.getSource(sourceId);
    if (!source) {
      throw new Error(`Source ${sourceId} not found`);
    }

    const startTime = new Date();

    try {
      const response = await fetch(source.endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const itemsCollected = this.extractItemCount(data, source.type);

      // Update source stats
      source.lastRun = startTime;
      source.itemsCollected += itemsCollected;

      return {
        sourceId,
        success: true,
        itemsCollected,
        timestamp: startTime
      };
    } catch (error) {
      return {
        sourceId,
        success: false,
        itemsCollected: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: startTime
      };
    }
  }

  // Collect data from all active sources
  async collectFromAllSources(): Promise<CollectionResult[]> {
    const activeSources = this.sources.filter(source => source.status === 'active');
    const results: CollectionResult[] = [];

    for (const source of activeSources) {
      try {
        const result = await this.collectFromSource(source.id);
        results.push(result);
      } catch (error) {
        results.push({
          sourceId: source.id,
          success: false,
          itemsCollected: 0,
          errors: [error instanceof Error ? error.message : 'Collection failed'],
          timestamp: new Date()
        });
      }
    }

    return results;
  }

  // Extract item count from API response based on source type
  private extractItemCount(data: any, type: string): number {
    switch (type) {
      case 'api':
        if (data.data) return data.data.length;
        if (data.items) return data.items.length;
        if (data.bounties) return data.bounties.length;
        if (data.contests) return data.contests.length;
        break;
      case 'blockchain':
        if (data.transactions) return data.transactions.length;
        break;
    }
    return 0;
  }

  // Get collection statistics
  getStats() {
    const activeSources = this.sources.filter(s => s.status === 'active').length;
    const totalItems = this.sources.reduce((sum, source) => sum + source.itemsCollected, 0);
    const sourcesWithErrors = this.sources.filter(s => s.status === 'error').length;

    return {
      totalSources: this.sources.length,
      activeSources,
      totalItemsCollected: totalItems,
      sourcesWithErrors,
      lastCollectionRun: new Date(Math.max(...this.sources
        .filter(s => s.lastRun)
        .map(s => s.lastRun!.getTime())))
    };
  }
}

// Export singleton instance
export const dataCollectionService = new DataCollectionService();
export default dataCollectionService;