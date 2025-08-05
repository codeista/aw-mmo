import { DbConnection } from '@clockworklabs/spacetimedb-sdk';
import { SpacetimeMockService } from './spacetime-mock-shared';

// Use mock service if running in development without SpacetimeDB
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !import.meta.env.PROD;

export class SpacetimeService {
  private connection: DbConnection | SpacetimeMockService | null = null;
  
  async connect() {
    if (USE_MOCK) {
      console.log('Using mock SpacetimeDB service');
      this.connection = new SpacetimeMockService();
      await this.connection.connect();
      return this.connection;
    }
    
    const host = import.meta.env.VITE_SPACETIME_HOST || 'http://localhost:3000';
    const module = 'fight-or-die';
    
    try {
      this.connection = await DbConnection.builder()
        .withUri(host)
        .withModuleName(module)
        .onConnect((ctx, identity, token) => {
          console.log('Connected!', { identity });
          localStorage.setItem('spacetime_token', token);
        })
        .build();
    } catch (error) {
      console.error('Failed to connect to SpacetimeDB, falling back to mock', error);
      this.connection = new SpacetimeMockService();
      await this.connection.connect();
    }
      
    return this.connection;
  }
  
  get db() {
    if (!this.connection) throw new Error('Not connected');
    return this.connection.db;
  }
  
  get reducers() {
    if (!this.connection) throw new Error('Not connected');
    return this.connection.reducers;
  }
}
