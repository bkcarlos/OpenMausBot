// Apps the person authorizes one at a time, against that provider's own
// remote MCP server. The OAuth token stays in this computer's MCP sign-in
// store. Composio is not on the path, and authorizing Gmail does not
// authorize Slack.
import { mcpOAuthRedirectUri } from "./mcp-oauth-redirect.ts";

export interface DirectApp {
  id: "gmail" | "slack";
  /** Stored MCP server name. Fixed, so the grant cannot be relabeled onto another host. */
  name: string;
  title: string;
  url: string;
  /** Scopes sent on the consent screen. Empty means the provider's own list. */
  scopes: readonly string[];
  docsUrl: string;
  /** The provider's server creates drafts and does not send. */
  draftsOnly: boolean;
}

export const DIRECT_APPS: readonly DirectApp[] = [
  {
    id: "gmail",
    name: "gmail",
    title: "Gmail",
    url: "https://gmailmcp.googleapis.com/mcp/v1",
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.compose",
    ],
    docsUrl: "https://developers.google.com/workspace/gmail/api/guides/configure-mcp-server",
    draftsOnly: true,
  },
  {
    id: "slack",
    name: "slack",
    title: "Slack",
    url: "https://mcp.slack.com/mcp",
    scopes: [],
    docsUrl: "https://docs.slack.dev/ai/slack-mcp-server/",
    draftsOnly: false,
  },
];

export function directAppByName(name: string): DirectApp | undefined {
  return DIRECT_APPS.find((app) => app.name === name);
}

export function directAppRedirectUri(app: DirectApp): string {
  return mcpOAuthRedirectUri(app.url);
}

export interface DirectAppServer {
  name: string;
  url?: string;
  enabled: boolean;
  auth?: "signed-in" | "needs-sign-in";
}

export type DirectAppCard =
  | { kind: "create" }
  | { kind: "ready"; enabled: boolean; auth?: "signed-in" | "needs-sign-in" }
  | { kind: "name-taken" };

/** How the card should treat an existing server list. A same-name server
 * that points somewhere else is not this app's grant. */
export function directAppCardState(app: DirectApp, servers: readonly DirectAppServer[]): DirectAppCard {
  const existing = servers.find((server) => server.name === app.name);
  if (!existing) return { kind: "create" };
  if (existing.url !== app.url) return { kind: "name-taken" };
  return { kind: "ready", enabled: existing.enabled, auth: existing.auth };
}

/** The POST /api/mcp/servers body for one app. A new server is stored
 * switched off until sign-in succeeds. */
export function directAppCreateBody(
  app: DirectApp,
  input: { clientId: string; clientSecret: string },
): { ok: true; body: Record<string, unknown> } | { ok: false; error: "client-id" | "client-secret" } {
  const clientId = input.clientId.trim();
  const clientSecret = input.clientSecret.trim();
  if (!clientId) return { ok: false, error: "client-id" };
  if (!clientSecret) return { ok: false, error: "client-secret" };
  return {
    ok: true,
    body: {
      name: app.name,
      type: "http",
      url: app.url,
      headers: {},
      oauth: {
        clientId,
        clientSecret,
        ...(app.scopes.length ? { scopes: [...app.scopes] } : {}),
      },
    },
  };
}
