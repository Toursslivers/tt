import type { FC } from 'react';
import React, { memo } from 'react';
import type { OwnProps } from './CustomSendMenu';
import { Bundles } from '../../../util/moduleLoader';

import useModuleLoader from '../../../hooks/useModuleLoader';

const CustomSendMenuAsync: FC<OwnProps> = (props) => {
  const { isOpen } = props;
  const CustomSend = useModuleLoader(Bundles.Extra, 'CustomSendMenu', !isOpen);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return CustomSend ? <CustomSend {...props} /> : undefined;
};

export default memo(CustomSendMenuAsync);
