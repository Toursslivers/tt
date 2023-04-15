import React, { memo, useCallback, useRef, useState } from "react";

import type { FC, ReactNode } from "react";
import type { ObserveFn } from "../../hooks/useIntersectionObserver";
import { ApiMessageEntityTypes } from "../../api/types";

import clsx from "clsx";
import safePlay from "../../util/safePlay";

import useCustomEmoji from "./hooks/useCustomEmoji";
import useDynamicColorListener from "../../hooks/useDynamicColorListener";

import StickerView from "./StickerView";

import styles from "./CustomEmoji.module.scss";
import svgPlaceholder from "../../assets/square.svg";
import blankImg from "../../assets/blank.png";

type OwnProps = {
  ref?: React.RefObject<HTMLDivElement>;
  documentId: string;
  children?: ReactNode;
  size?: number;
  className?: string;
  loopLimit?: number;
  style?: string;
  isBig?: boolean;
  withGridFix?: boolean;
  withSharedAnimation?: boolean;
  sharedCanvasRef?: React.RefObject<HTMLCanvasElement>;
  sharedCanvasHqRef?: React.RefObject<HTMLCanvasElement>;
  withTranslucentThumb?: boolean;
  shouldPreloadPreview?: boolean;
  forceOnHeavyAnimation?: boolean;
  observeIntersectionForLoading?: ObserveFn;
  observeIntersectionForPlaying?: ObserveFn;
  onClick?: NoneToVoidFunction;
};

const STICKER_SIZE = 20;

const CustomEmoji: FC<OwnProps> = ({
  ref,
  documentId,
  size = STICKER_SIZE,
  isBig,
  className,
  loopLimit,
  style,
  withGridFix,
  withSharedAnimation,
  sharedCanvasRef,
  sharedCanvasHqRef,
  withTranslucentThumb,
  shouldPreloadPreview,
  forceOnHeavyAnimation,
  observeIntersectionForLoading,
  observeIntersectionForPlaying,
  onClick,
}) => {
  // eslint-disable-next-line no-null/no-null
  let containerRef = useRef<HTMLDivElement>(null);
  if (ref) {
    containerRef = ref;
  }

  // An alternative to `withGlobal` to avoid adding numerous global containers
  const customEmoji = useCustomEmoji(documentId);

  const loopCountRef = useRef(0);
  const [shouldLoop, setShouldLoop] = useState(true);

  const hasCustomColor = customEmoji?.shouldUseTextColor;
  const { rgbColor: customColor } = useDynamicColorListener(
    containerRef,
    !hasCustomColor
  );

  const handleVideoEnded = useCallback(
    (e: any) => {
      if (!loopLimit) return;

      loopCountRef.current += 1;

      if (loopCountRef.current >= loopLimit) {
        setShouldLoop(false);
        e.currentTarget.currentTime = 0;
      } else {
        // Loop manually
        safePlay(e.currentTarget);
      }
    },
    [loopLimit]
  );

  const handleStickerLoop = useCallback(() => {
    if (!loopLimit) return;

    loopCountRef.current += 1;

    // Sticker plays 1 more time after disabling loop
    if (loopCountRef.current >= loopLimit - 1) {
      setShouldLoop(false);
    }
  }, [loopLimit]);

  // todo
  // const isHq =
  //   customEmoji?.stickerSetInfo &&
  //   selectIsAlwaysHighPriorityEmoji(getGlobal(), customEmoji.stickerSetInfo);
  const isHq = customEmoji?.stickerSetInfo;
  //  todo
  console.log("style", style);
  return (
    <div
      ref={containerRef}
      className={clsx(
        styles.root,
        className,
        "custom-emoji",
        "emoji",
        withGridFix && styles.withGridFix
      )}
      onClick={onClick}
      data-entity-type={ApiMessageEntityTypes.CustomEmoji}
      data-document-id={documentId}
      data-alt={customEmoji?.emoji}
    >
      <img
        className={styles.highlightCatch}
        src={blankImg}
        alt={customEmoji?.emoji}
        draggable={false}
      />
      {!customEmoji ? (
        <img className={styles.thumb} src={svgPlaceholder} alt="Emoji" />
      ) : (
        <StickerView
          containerRef={containerRef}
          sticker={customEmoji}
          isSmall={!isBig}
          size={size}
          customColor={customColor}
          thumbClassName={styles.thumb}
          fullMediaClassName={styles.media}
          shouldLoop={shouldLoop}
          loopLimit={loopLimit}
          shouldPreloadPreview={shouldPreloadPreview}
          forceOnHeavyAnimation={forceOnHeavyAnimation}
          observeIntersectionForLoading={observeIntersectionForLoading}
          observeIntersectionForPlaying={observeIntersectionForPlaying}
          withSharedAnimation={withSharedAnimation}
          sharedCanvasRef={isHq ? sharedCanvasHqRef : sharedCanvasRef}
          withTranslucentThumb={withTranslucentThumb}
          onVideoEnded={handleVideoEnded}
          onAnimatedStickerLoop={handleStickerLoop}
        />
      )}
    </div>
  );
};

export default memo(CustomEmoji);
