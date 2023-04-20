import { useCallback, useRef, useState } from "react";

import type { FC } from "react";
import type { ApiMessage } from "../../../api/types";
import type { ISettings } from "../../../types";
import type { IMediaDimensions } from "./helpers/calculateAlbumLayout";
import type { ObserveFn } from "../../../hooks/useIntersectionObserver";

import {
  CUSTOM_APPENDIX_ATTRIBUTE,
  MESSAGE_CONTENT_SELECTOR,
} from "../../../config";
import {
  getMessagePhoto,
  getMessageWebPagePhoto,
  getMessageMediaHash,
  getMediaTransferState,
  isOwnMessage,
  getMessageMediaFormat,
  getMessageMediaThumbDataUri,
} from "../../../global/helpers";
import clsx from "clsx";
import getCustomAppendixBg from "./helpers/getCustomAppendixBg";
import {
  calculateMediaDimensions,
  MIN_MEDIA_HEIGHT,
} from "./helpers/mediaDimensions";

import { useIsIntersecting } from "../../../hooks/useIntersectionObserver";
import useMediaWithLoadProgress from "../../../hooks/useMediaWithLoadProgress";
import useShowTransition from "../../../hooks/useShowTransition";
import useBlurredMediaThumbRef from "./hooks/useBlurredMediaThumbRef";
import usePrevious from "../../../hooks/usePrevious";
import useMediaTransition from "../../../hooks/useMediaTransition";
import useLayoutEffectWithPrevDeps from "../../../hooks/useLayoutEffectWithPrevDeps";
import useFlag from "../../../hooks/useFlag";
import useAppLayout from "../../../hooks/useAppLayout";

import ProgressSpinner from "../../ui/ProgressSpinner";
import MediaSpoiler from "../../common/MediaSpoiler";

export type OwnProps = {
  id?: string;
  message: ApiMessage;
  observeIntersection?: ObserveFn;
  noAvatars?: boolean;
  canAutoLoad?: boolean;
  isInSelectMode?: boolean;
  isSelected?: boolean;
  uploadProgress?: number;
  forcedWidth?: number;
  size?: "inline" | "pictogram";
  shouldAffectAppendix?: boolean;
  dimensions?: IMediaDimensions & { isSmall?: boolean };
  asForwarded?: boolean;
  nonInteractive?: boolean;
  isDownloading: boolean;
  isProtected?: boolean;
  theme: ISettings["theme"];
  onClick?: (id: number) => void;
  onCancelUpload?: (message: ApiMessage) => void;
};

const Photo: FC<OwnProps> = ({
  id,
  message,
  observeIntersection,
  noAvatars,
  canAutoLoad,
  isInSelectMode,
  isSelected,
  uploadProgress,
  forcedWidth,
  size = "inline",
  dimensions,
  asForwarded,
  nonInteractive,
  shouldAffectAppendix,
  isDownloading,
  isProtected,
  theme,
  onClick,
  onCancelUpload,
}) => {
  // eslint-disable-next-line no-null/no-null
  const ref = useRef<HTMLDivElement>(null);

  const photo = (getMessagePhoto(message) || getMessageWebPagePhoto(message))!;
  const localBlobUrl = photo.blobUrl;

  const isIntersecting = useIsIntersecting(ref, observeIntersection);

  const { isMobile } = useAppLayout();
  const [isLoadAllowed, setIsLoadAllowed] = useState(canAutoLoad);
  const shouldLoad = isLoadAllowed && isIntersecting;
  const { mediaData, loadProgress } = useMediaWithLoadProgress(
    getMessageMediaHash(message, size),
    !shouldLoad
  );
  const fullMediaData = localBlobUrl || mediaData;

  const withBlurredBackground = Boolean(forcedWidth);
  const [withThumb] = useState(!fullMediaData);
  const noThumb = Boolean(fullMediaData);
  const thumbRef = useBlurredMediaThumbRef(message, noThumb);
  const blurredBackgroundRef = useBlurredMediaThumbRef(
    message,
    !withBlurredBackground
  );
  const thumbClassNames = useMediaTransition(!noThumb);
  const thumbDataUri = getMessageMediaThumbDataUri(message);

  const [isSpoilerShown, , hideSpoiler] = useFlag(photo.isSpoiler);

  const { loadProgress: downloadProgress } = useMediaWithLoadProgress(
    getMessageMediaHash(message, "download"),
    !isDownloading,
    getMessageMediaFormat(message, "download")
  );

  const { isUploading, isTransferring, transferProgress } =
    getMediaTransferState(
      message,
      uploadProgress || (isDownloading ? downloadProgress : loadProgress),
      shouldLoad && !fullMediaData
    );
  const wasLoadDisabled = usePrevious(isLoadAllowed) === false;

  const {
    shouldRender: shouldRenderSpinner,
    transitionClassNames: spinnerClassNames,
  } = useShowTransition(isTransferring, undefined, wasLoadDisabled, "slow");
  const {
    shouldRender: shouldRenderDownloadButton,
    transitionClassNames: downloadButtonClassNames,
  } = useShowTransition(!fullMediaData && !isLoadAllowed);

  const handleClick = useCallback(() => {
    if (isUploading) {
      onCancelUpload?.(message);
      return;
    }

    if (!fullMediaData) {
      setIsLoadAllowed((isAllowed) => !isAllowed);
      return;
    }

    if (isSpoilerShown) {
      hideSpoiler();
      return;
    }

    onClick?.(message.id);
  }, [
    fullMediaData,
    hideSpoiler,
    isSpoilerShown,
    isUploading,
    message,
    onCancelUpload,
    onClick,
  ]);

  const isOwn = isOwnMessage(message);
  useLayoutEffectWithPrevDeps(
    ([prevShouldAffectAppendix]) => {
      if (!shouldAffectAppendix) {
        if (prevShouldAffectAppendix) {
          ref
            .current!.closest<HTMLDivElement>(MESSAGE_CONTENT_SELECTOR)!
            .removeAttribute(CUSTOM_APPENDIX_ATTRIBUTE);
        }
        return;
      }

      const contentEl = ref.current!.closest<HTMLDivElement>(
        MESSAGE_CONTENT_SELECTOR
      )!;
      if (fullMediaData) {
        getCustomAppendixBg(
          fullMediaData,
          isOwn,
          isInSelectMode,
          isSelected,
          theme
        ).then((appendixBg) => {
          contentEl.style.setProperty("--appendix-bg", appendixBg);
          contentEl.setAttribute(CUSTOM_APPENDIX_ATTRIBUTE, "");
        });
      } else {
        contentEl.classList.add("has-appendix-thumb");
      }
    },
    [
      shouldAffectAppendix,
      fullMediaData,
      isOwn,
      isInSelectMode,
      isSelected,
      theme,
    ]
  );

  const { width, height, isSmall } =
    dimensions ||
    calculateMediaDimensions(message, asForwarded, noAvatars, isMobile);

  const className = clsx(
    "media-inner",
    !isUploading && !nonInteractive && "interactive",
    isSmall && "small-image",
    width === height && "square-image",
    height < MIN_MEDIA_HEIGHT && "fix-min-height"
  );

  return (
    <div
      id={id}
      ref={ref}
      className={className}
      style={
        size === "inline"
          ? { height, width, left: dimensions?.x || 0, top: dimensions?.y || 0 }
          : {}
      }
      onClick={isUploading ? undefined : handleClick}
    >
      {withBlurredBackground && (
        <canvas ref={blurredBackgroundRef} className="thumbnail blurred-bg" />
      )}
      <img
        src={fullMediaData}
        className={clsx(
          "full-media",
          withBlurredBackground && "with-blurred-bg"
        )}
        alt=""
        style={forcedWidth ? { width: forcedWidth } : {}}
        draggable={!isProtected}
      />
      {withThumb && (
        <canvas ref={thumbRef} className={clsx("thumbnail", thumbClassNames)} />
      )}
      {isProtected && <span className="protector" />}
      {shouldRenderSpinner && !shouldRenderDownloadButton && (
        <div className={`media-loading ${spinnerClassNames}`}>
          <ProgressSpinner
            progress={transferProgress}
            onClick={isUploading ? handleClick : undefined}
          />
        </div>
      )}
      {shouldRenderDownloadButton && (
        <i className={clsx("icon-download", downloadButtonClassNames)} />
      )}
      <MediaSpoiler
        isVisible={isSpoilerShown}
        withAnimation
        thumbDataUri={thumbDataUri}
        width={width}
        height={height}
        className="media-spoiler"
      />
      {isTransferring && (
        <span className="message-transfer-progress">
          {Math.round(transferProgress * 100)}%
        </span>
      )}
    </div>
  );
};

export default Photo;
