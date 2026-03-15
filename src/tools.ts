import { z } from 'zod';
import { NotionClient } from './api-client.js';

/**
 * Notion MCP Tool Definitions
 *
 * DESCRIPTION GUIDELINES (for LLM token efficiency):
 * - Tool `description`: max 60 chars (sent to LLM)
 * - Parameter `.describe()`: max 15 chars (sent to LLM)
 */

export const tools = [
  // === Pages ===
  {
    name: 'pages_create',
    description: 'Create a new page in Notion',
    inputSchema: z.object({
      parent_type: z.enum(['page_id', 'database_id']).describe('parent type'),
      parent_id: z.string().describe('parent ID'),
      title: z.string().optional().describe('page title'),
      properties: z.record(z.string(), z.any()).optional().describe('page properties'),
      children: z.array(z.any()).optional().describe('content blocks'),
      icon_emoji: z.string().optional().describe('icon emoji'),
    }),
    handler: async (client: NotionClient, args: {
      parent_type: 'page_id' | 'database_id';
      parent_id: string;
      title?: string;
      properties?: Record<string, any>;
      children?: any[];
      icon_emoji?: string;
    }) => {
      const body: Record<string, any> = {
        parent: { type: args.parent_type, [args.parent_type]: args.parent_id },
      };

      if (args.parent_type === 'database_id' && args.properties) {
        body.properties = args.properties;
      } else if (args.title) {
        body.properties = {
          title: { title: [{ text: { content: args.title } }] },
        };
      }

      if (args.children) body.children = args.children;
      if (args.icon_emoji) body.icon = { type: 'emoji', emoji: args.icon_emoji };

      return await client.createPage(body);
    },
  },

  {
    name: 'pages_get',
    description: 'Retrieve a page by ID',
    inputSchema: z.object({
      page_id: z.string().describe('page ID'),
    }),
    handler: async (client: NotionClient, args: { page_id: string }) => {
      return await client.getPage(args.page_id);
    },
  },

  {
    name: 'pages_update',
    description: 'Update page properties',
    inputSchema: z.object({
      page_id: z.string().describe('page ID'),
      properties: z.record(z.string(), z.any()).optional().describe('properties'),
      archived: z.boolean().optional().describe('archive page'),
      icon_emoji: z.string().optional().describe('icon emoji'),
    }),
    handler: async (client: NotionClient, args: {
      page_id: string;
      properties?: Record<string, any>;
      archived?: boolean;
      icon_emoji?: string;
    }) => {
      const body: Record<string, any> = {};
      if (args.properties) body.properties = args.properties;
      if (args.archived !== undefined) body.archived = args.archived;
      if (args.icon_emoji) body.icon = { type: 'emoji', emoji: args.icon_emoji };
      return await client.updatePage(args.page_id, body);
    },
  },

  {
    name: 'pages_property_get',
    description: 'Get a specific page property value',
    inputSchema: z.object({
      page_id: z.string().describe('page ID'),
      property_id: z.string().describe('property ID'),
      page_size: z.number().optional().describe('results per page'),
      start_cursor: z.string().optional().describe('pagination cursor'),
    }),
    handler: async (client: NotionClient, args: {
      page_id: string;
      property_id: string;
      page_size?: number;
      start_cursor?: string;
    }) => {
      return await client.getPageProperty(args.page_id, args.property_id, {
        page_size: args.page_size,
        start_cursor: args.start_cursor,
      });
    },
  },

  // === Databases ===
  {
    name: 'databases_create',
    description: 'Create a new database',
    inputSchema: z.object({
      parent_page_id: z.string().describe('parent page ID'),
      title: z.string().describe('database title'),
      properties: z.record(z.string(), z.any()).describe('schema properties'),
    }),
    handler: async (client: NotionClient, args: {
      parent_page_id: string;
      title: string;
      properties: Record<string, any>;
    }) => {
      return await client.createDatabase({
        parent: { type: 'page_id', page_id: args.parent_page_id },
        title: [{ text: { content: args.title } }],
        properties: args.properties,
      });
    },
  },

  {
    name: 'databases_get',
    description: 'Retrieve a database by ID',
    inputSchema: z.object({
      database_id: z.string().describe('database ID'),
    }),
    handler: async (client: NotionClient, args: { database_id: string }) => {
      return await client.getDatabase(args.database_id);
    },
  },

  {
    name: 'databases_update',
    description: 'Update database title or schema',
    inputSchema: z.object({
      database_id: z.string().describe('database ID'),
      title: z.string().optional().describe('new title'),
      properties: z.record(z.string(), z.any()).optional().describe('schema updates'),
    }),
    handler: async (client: NotionClient, args: {
      database_id: string;
      title?: string;
      properties?: Record<string, any>;
    }) => {
      const body: Record<string, any> = {};
      if (args.title) body.title = [{ text: { content: args.title } }];
      if (args.properties) body.properties = args.properties;
      return await client.updateDatabase(args.database_id, body);
    },
  },

  {
    name: 'databases_query',
    description: 'Query a database with filters and sorts',
    inputSchema: z.object({
      database_id: z.string().describe('database ID'),
      filter: z.any().optional().describe('filter object'),
      sorts: z.array(z.any()).optional().describe('sort criteria'),
      page_size: z.number().optional().describe('results per page'),
      start_cursor: z.string().optional().describe('pagination cursor'),
    }),
    handler: async (client: NotionClient, args: {
      database_id: string;
      filter?: any;
      sorts?: any[];
      page_size?: number;
      start_cursor?: string;
    }) => {
      const body: Record<string, any> = {};
      if (args.filter) body.filter = args.filter;
      if (args.sorts) body.sorts = args.sorts;
      if (args.page_size) body.page_size = args.page_size;
      if (args.start_cursor) body.start_cursor = args.start_cursor;
      return await client.queryDatabase(args.database_id, body);
    },
  },

  // === Blocks ===
  {
    name: 'blocks_get',
    description: 'Retrieve a block by ID',
    inputSchema: z.object({
      block_id: z.string().describe('block ID'),
    }),
    handler: async (client: NotionClient, args: { block_id: string }) => {
      return await client.getBlock(args.block_id);
    },
  },

  {
    name: 'blocks_update',
    description: 'Update a block',
    inputSchema: z.object({
      block_id: z.string().describe('block ID'),
      content: z.record(z.string(), z.any()).describe('block content'),
      archived: z.boolean().optional().describe('archive block'),
    }),
    handler: async (client: NotionClient, args: {
      block_id: string;
      content: Record<string, any>;
      archived?: boolean;
    }) => {
      const body: Record<string, any> = { ...args.content };
      if (args.archived !== undefined) body.archived = args.archived;
      return await client.updateBlock(args.block_id, body);
    },
  },

  {
    name: 'blocks_children_list',
    description: 'List child blocks of a block or page',
    inputSchema: z.object({
      block_id: z.string().describe('block/page ID'),
      page_size: z.number().optional().describe('results per page'),
      start_cursor: z.string().optional().describe('pagination cursor'),
    }),
    handler: async (client: NotionClient, args: {
      block_id: string;
      page_size?: number;
      start_cursor?: string;
    }) => {
      return await client.getBlockChildren(args.block_id, {
        page_size: args.page_size,
        start_cursor: args.start_cursor,
      });
    },
  },

  {
    name: 'blocks_children_append',
    description: 'Append child blocks to a page or block',
    inputSchema: z.object({
      block_id: z.string().describe('block/page ID'),
      children: z.array(z.any()).describe('blocks to append'),
    }),
    handler: async (client: NotionClient, args: {
      block_id: string;
      children: any[];
    }) => {
      return await client.appendBlockChildren(args.block_id, args.children);
    },
  },

  {
    name: 'blocks_delete',
    description: 'Delete (archive) a block',
    inputSchema: z.object({
      block_id: z.string().describe('block ID'),
    }),
    handler: async (client: NotionClient, args: { block_id: string }) => {
      return await client.deleteBlock(args.block_id);
    },
  },

  // === Users ===
  {
    name: 'users_list',
    description: 'List all users in the workspace',
    inputSchema: z.object({
      page_size: z.number().optional().describe('results per page'),
      start_cursor: z.string().optional().describe('pagination cursor'),
    }),
    handler: async (client: NotionClient, args: {
      page_size?: number;
      start_cursor?: string;
    }) => {
      return await client.listUsers(args);
    },
  },

  {
    name: 'users_get',
    description: 'Retrieve a user by ID',
    inputSchema: z.object({
      user_id: z.string().describe('user ID'),
    }),
    handler: async (client: NotionClient, args: { user_id: string }) => {
      return await client.getUser(args.user_id);
    },
  },

  {
    name: 'users_me',
    description: 'Get the bot user info',
    inputSchema: z.object({}),
    handler: async (client: NotionClient) => {
      return await client.getBotUser();
    },
  },

  // === Search ===
  {
    name: 'search',
    description: 'Search pages and databases by title',
    inputSchema: z.object({
      query: z.string().optional().describe('search query'),
      filter_type: z.enum(['page', 'database']).optional().describe('object type'),
      sort_direction: z.enum(['ascending', 'descending']).optional().describe('sort order'),
      page_size: z.number().optional().describe('results per page'),
      start_cursor: z.string().optional().describe('pagination cursor'),
    }),
    handler: async (client: NotionClient, args: {
      query?: string;
      filter_type?: 'page' | 'database';
      sort_direction?: 'ascending' | 'descending';
      page_size?: number;
      start_cursor?: string;
    }) => {
      const body: Record<string, any> = {};
      if (args.query) body.query = args.query;
      if (args.filter_type) body.filter = { value: args.filter_type, property: 'object' };
      if (args.sort_direction) body.sort = { direction: args.sort_direction, timestamp: 'last_edited_time' };
      if (args.page_size) body.page_size = args.page_size;
      if (args.start_cursor) body.start_cursor = args.start_cursor;
      return await client.search(body);
    },
  },

  // === Comments ===
  {
    name: 'comments_create',
    description: 'Add a comment to a page or discussion',
    inputSchema: z.object({
      parent_page_id: z.string().optional().describe('page ID'),
      discussion_id: z.string().optional().describe('discussion ID'),
      rich_text: z.string().describe('comment text'),
    }),
    handler: async (client: NotionClient, args: {
      parent_page_id?: string;
      discussion_id?: string;
      rich_text: string;
    }) => {
      const body: Record<string, any> = {
        rich_text: [{ text: { content: args.rich_text } }],
      };
      if (args.parent_page_id) {
        body.parent = { page_id: args.parent_page_id };
      } else if (args.discussion_id) {
        body.discussion_id = args.discussion_id;
      }
      return await client.createComment(body);
    },
  },

  {
    name: 'comments_list',
    description: 'List comments on a block or page',
    inputSchema: z.object({
      block_id: z.string().describe('block/page ID'),
      page_size: z.number().optional().describe('results per page'),
      start_cursor: z.string().optional().describe('pagination cursor'),
    }),
    handler: async (client: NotionClient, args: {
      block_id: string;
      page_size?: number;
      start_cursor?: string;
    }) => {
      return await client.listComments(args.block_id, {
        page_size: args.page_size,
        start_cursor: args.start_cursor,
      });
    },
  },
];

export type Tool = (typeof tools)[number];
