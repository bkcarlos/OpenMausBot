// An empty thread used to say only "send a message". The first screen now
// names three ordinary first asks, so a new person does not have to invent
// a prompt before they learn what the bot can do.
import { api, useStore, type Bot } from "@/state/store";
import { t } from "@/lib/i18n";
import type { LocaleKey } from "@/locales";
import { BotAvatar } from "./Avatar";
import { RenameTitle } from "./RenameTitle";

const STARTERS: LocaleKey[] = ["chat.starter.help", "chat.starter.computer", "chat.starter.mail"];

export function EmptyConversation({ bot, canWrite }: { bot: Bot; canWrite: boolean | null }) {
  const { dispatch } = useStore();
  const ask = (text: string) => {
    dispatch({
      type: "send",
      botId: bot.id,
      threadId: bot.threadId,
      text,
      sendId: crypto.randomUUID(),
    });
  };
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <BotAvatar bot={bot} state="idle" size={64} motion="none" motionKey={0} />
      <RenameTitle
        value={bot.name}
        onCommit={(name) => {
          if (window.ogb?.remoteClient?.active) {
            void api(`/api/bots/${bot.id}/profile`, { method: "PATCH", body: JSON.stringify({ name }) })
              .then(({ bot: updated }) => dispatch({ type: "botPatched", bot: updated }))
              .catch((cause) => dispatch({ type: "error", message: cause instanceof Error ? cause.message : String(cause) }));
          } else {
            dispatch({ type: "updateBot", botId: bot.id, patch: { name } });
          }
        }}
        className="text-[17px] font-semibold text-ink"
        inputClassName="rounded bg-inset px-1.5 py-0.5 text-center text-[17px] font-semibold"
      />
      <div className="max-w-[360px] text-[14px] text-ink-secondary">
        {bot.description || t("chat.emptyPrompt")}
      </div>
      {canWrite === true && (
        <div className="mt-2 flex max-w-[420px] flex-col items-stretch gap-2">
          <div className="text-[12px] text-ink-tertiary">{t("chat.startersLabel")}</div>
          {STARTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => ask(t(key))}
              className="rounded-full border border-hairline/50 bg-panel px-4 py-2 text-[13px] text-ink hover:bg-raised"
            >
              {t(key)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
