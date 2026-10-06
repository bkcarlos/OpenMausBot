// An empty thread names the three things a person can actually do: ask,
// connect mail, or put work on a schedule. Connecting mail opens that
// screen. It does not send the bot a sentence it cannot finish.
import { api, useStore, type Bot } from "@/state/store";
import { t } from "@/lib/i18n";
import { BotAvatar } from "./Avatar";
import { RenameTitle } from "./RenameTitle";

export function EmptyConversation({ bot, canWrite }: { bot: Bot; canWrite: boolean | null }) {
  const { dispatch } = useStore();
  const ask = () => {
    dispatch({
      type: "send",
      botId: bot.id,
      threadId: bot.threadId,
      text: t("chat.starter.help"),
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
      <div className="mt-2 flex max-w-[420px] flex-col items-stretch gap-2">
        <div className="text-[12px] text-ink-tertiary">{t("chat.startersLabel")}</div>
        {canWrite === true && (
          <button
            type="button"
            onClick={ask}
            className="rounded-full border border-hairline/50 bg-panel px-4 py-2 text-[13px] text-ink hover:bg-raised"
          >
            {t("chat.starter.help")}
          </button>
        )}
        <button
          type="button"
          onClick={() => dispatch({ type: "togglePlugins", open: true })}
          className="rounded-full border border-hairline/50 bg-panel px-4 py-2 text-[13px] text-ink hover:bg-raised"
        >
          {t("chat.starter.mail")}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "showRoutines" })}
          className="rounded-full border border-hairline/50 bg-panel px-4 py-2 text-[13px] text-ink hover:bg-raised"
        >
          {t("chat.starter.schedule")}
        </button>
      </div>
    </div>
  );
}
