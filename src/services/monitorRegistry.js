const monitoredChatIds =
  new Set();

const replaceMonitors =
  (
    monitors
  ) => {
    monitoredChatIds.clear();
    for (
      const monitor
      of monitors
    ) {
      monitoredChatIds.add(
        String(
          monitor.conversationId
        )
      );
    }
  };

const addMonitor =
  (
    chatId
  ) =>
    monitoredChatIds.add(
      String(
        chatId
      )
    );

const isMonitored =
  (
    chatId
  ) =>
    monitoredChatIds.has(
      String(
        chatId
      )
    );

module.exports = {
  replaceMonitors,
  addMonitor,
  isMonitored
};
