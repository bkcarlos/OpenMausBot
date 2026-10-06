import { createElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Bot } from "@/state/store";

const fixture = vi.hoisted(() => ({ dispatch: vi.fn() }));
vi.mock("@/state/store", () => ({
  api: vi.fn(),
  useStore: () => ({ dispatch: fixture.dispatch }),
}));
vi.mock("./Avatar", () => ({ BotAvatar: () => null }));
vi.mock("./RenameTitle", () => ({ RenameTitle: ({ value }: { value: string }) => value }));

import { EmptyConversation } from "./EmptyConversation";

const bot = { id: "bot-1", threadId: "thread-1", name: "Ada", description: "" } as Bot;

function button(tree: ReactNode, text: string) {
  const walk = (node: ReactNode): ReactElement<{ onClick?: () => void; children?: ReactNode }> | undefined => {
    if (Array.isArray(node)) {
      for (const child of node) {
        const found = walk(child);
        if (found) return found;
      }
      return undefined;
    }
    if (!node || typeof node !== "object" || !("props" in node)) return undefined;
    const current = node as ReactElement<{ onClick?: () => void; children?: ReactNode }>;
    if (current.props.children === text && current.props.onClick) return current;
    return walk(current.props.children);
  };
  return walk(tree);
}

describe("empty conversation", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("offers three plain first messages and sends the one that was clicked", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "send-1" });
    let tree!: ReturnType<typeof EmptyConversation>;
    function Capture() {
      tree = EmptyConversation({ bot, canWrite: true });
      return tree;
    }
    const html = renderToStaticMarkup(createElement(Capture));
    expect(html).toContain("Start with one of these");
    expect(html).toContain("What can you help me with?");
    expect(html).toContain("What can you do on this computer?");
    expect(html).toContain("Help me connect my email");
    button(tree, "Help me connect my email")!.props.onClick!();
    expect(fixture.dispatch).toHaveBeenCalledWith({
      type: "send",
      botId: "bot-1",
      threadId: "thread-1",
      text: "Help me connect my email",
      sendId: "send-1",
    });
  });

  it("hides the starters when this person cannot write in the thread", () => {
    const html = renderToStaticMarkup(createElement(EmptyConversation, { bot, canWrite: false }));
    expect(html).not.toContain("Help me connect my email");
    expect(html).toContain("Send a message to start the conversation.");
  });
});
