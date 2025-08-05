import { DbConnection } from '@clockworklabs/spacetimedb-sdk';

export class SpacetimeService {
  private connection: DbConnection | null = null;
  
  async connect() {
    const host = 'http://localhost:3000';
    const module = 'insect-colony-wars';
    
    this.connection = await DbConnection.builder()
      .withUri(host)
      .withModuleName(module)
      .onConnect((ctx, identity, token) => {
        console.log('Connected!', { identity });
        localStorage.setItem('spacetime_token', token);
      })
      .build();
      
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
