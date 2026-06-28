const {
  extractImage,
  validateImages,
  analyzeImagesAndReply
} = require(
  "./imageHandlers"
);

const isImageAnalysisRequest =
  (
    caption = ""
  ) =>
    /\b(analy[sz]e|what do you see|what is in this image|is this proof|check this image|read this image)\b/i.test(
      caption
    );

const handleCaptionedImageRequest =
  async (
    ctx
  ) => {
    const caption =
      ctx.message?.caption || "";
    const image =
      extractImage(
        ctx.message || {}
      );

    if (
      !image ||
      !isImageAnalysisRequest(
        caption
      )
    ) {
      return false;
    }

    const error =
      validateImages(
        [image]
      );

    if (
      error
    ) {
      await ctx.reply(
        error
      );
      return true;
    }

    await analyzeImagesAndReply(
      ctx,
      [image],
      {
        showProcessing:
          false
      }
    );
    return true;
  };

module.exports = {
  isImageAnalysisRequest,
  handleCaptionedImageRequest
};
