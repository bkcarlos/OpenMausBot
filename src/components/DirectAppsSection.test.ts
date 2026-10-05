import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { directAppByName, directAppRedirectUri } from "../../shared/direct-apps.ts";
import { DirectAppsSection } from "./DirectAppsSection";

describe("direct app cards", () => {
  it("shows each provider's redirect and keeps a taken name from the create form", () => {
    const gmail = directAppByName("gmail")!;
    const html = renderToStaticMarkup(createElement(DirectAppsSection, {
      servers: [{ name: "gmail", url: "https://example.test/mcp", enabled: true }],
      restricted: false,
      busy: false,
      signingIn: null,
      onAuthorize: async () => undefined,
      onSignIn: () => undefined,
    }));
    expect(html).toContain(directAppRedirectUri(gmail));
    expect(html).toContain(directAppRedirectUri(directAppByName("slack")!));
    expect(html).toContain("Composio does not receive it");
    expect(html).toContain("already points somewhere else");
    expect(html).toContain("Authorize Slack");
    expect(html).not.toContain("Authorize Gmail");
  });
});
