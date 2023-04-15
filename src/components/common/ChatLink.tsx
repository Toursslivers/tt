import React, { memo, useCallback } from 'react'
import { getActions } from '../../global';

import type { FC } from 'react';

import clsx from 'clsx';
import Link from '../ui/Link';

type OwnProps = {
  className?: string;
  chatId?: string;
  children: React.ReactNode;
};

const ChatLink: FC<OwnProps> = ({
  className, chatId, children,
}) => {
  const { openChat } = getActions();

  const handleClick = useCallback(() => {
    if (chatId) {
      openChat({ id: chatId });
    }
  }, [chatId, openChat]);

  if (!chatId) {
    return children;
  }

  return (
    <Link className={clsx('ChatLink', className)} onClick={handleClick}>{children}</Link>
  );
};

export default memo(ChatLink);