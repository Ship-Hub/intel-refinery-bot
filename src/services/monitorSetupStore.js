const pendingByOwner =
  new Map();
const crypto =
  require("crypto");

const createPendingSetup =
  ({
    ownerId,
    chatId,
    ownerUsername,
    admins
  }) => {
    const token =
      crypto.randomBytes(
        12
      )
        .toString(
          "base64url"
        );

    pendingByOwner.set(
      String(
        ownerId
      ),
      {
        token,
        ownerId:
          String(
            ownerId
          ),
        chatId:
          String(
            chatId
          ),
        ownerUsername:
          ownerUsername || null,
        admins,
        createdAt:
          Date.now()
      }
    );

    return token;
  };

const getPendingSetup =
  (
    ownerId,
    token
  ) => {
    const setup =
      pendingByOwner.get(
        String(
          ownerId
        )
      );

    if (
      !setup ||
      setup.token !==
        token ||
      Date.now() -
        setup.createdAt >
        15 * 60 * 1000
    ) {
      return null;
    }

    return setup;
  };

const clearPendingSetup =
  (
    ownerId
  ) =>
    pendingByOwner.delete(
      String(
        ownerId
      )
    );

module.exports = {
  createPendingSetup,
  getPendingSetup,
  clearPendingSetup
};
