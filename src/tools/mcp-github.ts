import { MCPToolset } from "@google/adk";

/**
 * GitHub MCP toolset for Phase 3 (optional; requires GITHUB_PERSONAL_ACCESS_TOKEN).
 * Use read-only PR toolsets in production.
 *
 * @see https://github.com/github/github-mcp-server
 */
export function createGithubMcpToolset(): MCPToolset | null {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token) return null;

  return new MCPToolset(
    {
      type: "StdioConnectionParams",
      serverParams: {
        command: "docker",
        args: [
          "run",
          "-i",
          "--rm",
          "-e",
          "GITHUB_PERSONAL_ACCESS_TOKEN",
          "ghcr.io/github/github-mcp-server",
        ],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: token,
        },
      },
    },
    ["pull_request_read"],
  );
}
