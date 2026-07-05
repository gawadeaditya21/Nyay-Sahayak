#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import HybridRagService from "./services/hybridRagService.js";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

// IMPORTANT: In stdio MCP servers, console.log cannot be used because stdout is reserved for JSON-RPC.
// Use console.error for all logging.
const server = new Server(
  {
    name: "nyay-sahayak-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define the tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_indian_laws",
        description:
          "Search the Nyay-Sahayak vector database for relevant Indian laws, legal provisions, IPC, or BNS context.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The legal query or situation to search for",
            },
          },
          required: ["query"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "search_indian_laws") {
    const query = request.params.arguments?.query;
    if (typeof query !== "string") {
      throw new Error("Invalid query argument");
    }

    try {
      console.error(`[MCP] Executing search_indian_laws for query: "${query}"`);
      const ragResponse = await HybridRagService.retrieveContext(query);
      
      let formattedResults = "No relevant laws found.";
      if (ragResponse.results && ragResponse.results.length > 0) {
        formattedResults = ragResponse.results
          .map((r, index) => {
            const meta = r.payload.metadata || {};
            return `--- Context ${index + 1} ---\nSource: ${meta.title || 'Unknown'} (${meta.act || 'Act'})\nText:\n${r.payload.text}`;
          })
          .join("\n\n");
      }

      console.error(`[MCP] Search complete. Returning ${ragResponse.results.length} results.`);
      return {
        content: [
          {
            type: "text",
            text: formattedResults,
          },
        ],
      };
    } catch (error) {
      console.error(`[MCP] Error: ${error.message}`);
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving laws: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 Nyay-Sahayak MCP Server is running and listening on stdio.");
}

run().catch((error) => {
  console.error("Fatal error running MCP server:", error);
  process.exit(1);
});
