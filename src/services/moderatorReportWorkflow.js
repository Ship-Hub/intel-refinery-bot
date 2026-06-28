const {
  getDueModeratorReports,
  generateModeratorReport
} = require(
  "../api/backendClient"
);
const {
  formatTelegramHtml
} = require(
  "./telegramFormatter"
);

const formatModeratorReport =
  (
    report
  ) => {
    const admins =
      report?.admins || [];

    return [
      "📋 <b>Moderator audit report</b>",
      "",
      ...admins.flatMap(
        (admin) => [
          `<b>${formatTelegramHtml(
            admin.displayName ||
              "Unnamed admin"
          )}</b>`,
          `Messages: ${admin.numberOfMessages || 0}`,
          `Escalation caused: ${admin.escalationCaused || 0}`,
          `De-escalations: ${admin.deescalations || 0}`,
          `Score: ${admin.score || 0}/10`,
          admin.behaviourSummary
            ? `Summary: ${formatTelegramHtml(
                admin.behaviourSummary
              )}`
            : "Summary: No summary returned.",
          ""
        ]
      )
    ].join(
      "\n"
    );
  };

const deliverDueModeratorReports =
  async (
    bot
  ) => {
    const response =
      await getDueModeratorReports(
        "telegram"
      );

    for (
      const item
      of response.data || []
    ) {
      const admins =
        await bot.telegram.getChatAdministrators(
          item.conversationId
        );
      const liveAdmins =
        admins
          .filter(
            (admin) =>
              !admin.user.is_bot
          )
          .map(
            (admin) => ({
              externalUserId:
                String(
                  admin.user.id
                ),
              username:
                admin.user.username ||
                null,
              displayName:
                [
                  admin.user.first_name,
                  admin.user.last_name
                ]
                  .filter(Boolean)
                  .join(" ") ||
                "Unnamed admin"
            })
          );
      const refreshed =
        await generateModeratorReport({
          platform:
            "telegram",
          conversationId:
            String(
              item.conversationId
            ),
          ownerExternalUserId:
            String(
              item.ownerExternalUserId
            ),
          admins:
            liveAdmins
        });

      await bot.telegram.sendMessage(
        item.ownerExternalUserId,
        formatModeratorReport(
          refreshed.data
        ),
        {
          parse_mode:
            "HTML"
        }
      );
    }
  };

module.exports = {
  formatModeratorReport,
  deliverDueModeratorReports
};
