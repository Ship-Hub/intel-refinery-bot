const levelsByChat =
  new Map();
const loadedChats =
  new Set();

const getConversationLevel =
  (
    chatId
  ) =>
    levelsByChat.get(
      String(
        chatId
      )
    ) || 1;

const setConversationLevel =
  (
    chatId,
    level
  ) =>
    {
      levelsByChat.set(
        String(
          chatId
        ),
        Number(
          level
        )
      );
      loadedChats.add(
        String(
          chatId
        )
      );
    };

const hasLoadedConversationLevel =
  (
    chatId
  ) =>
    loadedChats.has(
      String(
        chatId
      )
    );

module.exports = {
  getConversationLevel,
  setConversationLevel,
  hasLoadedConversationLevel
};
