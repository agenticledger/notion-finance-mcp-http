/**
 * Notion API Client
 * Base URL: https://api.notion.com/v1
 * Auth: Bearer token (Integration token) + Notion-Version header
 */

const BASE_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export class NotionClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options?: {
      params?: Record<string, string | number | undefined>;
      body?: Record<string, any>;
    },
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Notion-Version': NOTION_VERSION,
      'Accept': 'application/json',
    };

    const fetchOptions: RequestInit = { method, headers };

    if (options?.body) {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Error ${response.status}: ${text}`);
    }

    return response.json();
  }

  // === Pages ===

  async createPage(body: Record<string, any>): Promise<any> {
    return this.request<any>('POST', '/pages', { body });
  }

  async getPage(pageId: string): Promise<any> {
    return this.request<any>('GET', `/pages/${encodeURIComponent(pageId)}`);
  }

  async updatePage(pageId: string, body: Record<string, any>): Promise<any> {
    return this.request<any>('PATCH', `/pages/${encodeURIComponent(pageId)}`, { body });
  }

  async getPageProperty(pageId: string, propertyId: string, params?: { start_cursor?: string; page_size?: number }): Promise<any> {
    return this.request<any>('GET', `/pages/${encodeURIComponent(pageId)}/properties/${encodeURIComponent(propertyId)}`, {
      params: params as any,
    });
  }

  // === Databases ===

  async createDatabase(body: Record<string, any>): Promise<any> {
    return this.request<any>('POST', '/databases', { body });
  }

  async getDatabase(databaseId: string): Promise<any> {
    return this.request<any>('GET', `/databases/${encodeURIComponent(databaseId)}`);
  }

  async updateDatabase(databaseId: string, body: Record<string, any>): Promise<any> {
    return this.request<any>('PATCH', `/databases/${encodeURIComponent(databaseId)}`, { body });
  }

  async queryDatabase(databaseId: string, body?: Record<string, any>): Promise<any> {
    return this.request<any>('POST', `/databases/${encodeURIComponent(databaseId)}/query`, { body: body || {} });
  }

  // === Blocks ===

  async getBlock(blockId: string): Promise<any> {
    return this.request<any>('GET', `/blocks/${encodeURIComponent(blockId)}`);
  }

  async updateBlock(blockId: string, body: Record<string, any>): Promise<any> {
    return this.request<any>('PATCH', `/blocks/${encodeURIComponent(blockId)}`, { body });
  }

  async getBlockChildren(blockId: string, params?: { start_cursor?: string; page_size?: number }): Promise<any> {
    return this.request<any>('GET', `/blocks/${encodeURIComponent(blockId)}/children`, {
      params: params as any,
    });
  }

  async appendBlockChildren(blockId: string, children: any[]): Promise<any> {
    return this.request<any>('PATCH', `/blocks/${encodeURIComponent(blockId)}/children`, {
      body: { children },
    });
  }

  async deleteBlock(blockId: string): Promise<any> {
    return this.request<any>('DELETE', `/blocks/${encodeURIComponent(blockId)}`);
  }

  // === Users ===

  async listUsers(params?: { start_cursor?: string; page_size?: number }): Promise<any> {
    return this.request<any>('GET', '/users', { params: params as any });
  }

  async getUser(userId: string): Promise<any> {
    return this.request<any>('GET', `/users/${encodeURIComponent(userId)}`);
  }

  async getBotUser(): Promise<any> {
    return this.request<any>('GET', '/users/me');
  }

  // === Search ===

  async search(body?: Record<string, any>): Promise<any> {
    return this.request<any>('POST', '/search', { body: body || {} });
  }

  // === Comments ===

  async createComment(body: Record<string, any>): Promise<any> {
    return this.request<any>('POST', '/comments', { body });
  }

  async listComments(blockId: string, params?: { start_cursor?: string; page_size?: number }): Promise<any> {
    return this.request<any>('GET', '/comments', {
      params: { block_id: blockId, ...params } as any,
    });
  }
}
