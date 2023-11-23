import React, { FC, ReactNode } from 'react';

import { XMarkIcon } from '@heroicons/react/20/solid';

type colors =
  | 'primary'
  | 'mineshaft'
  | 'carbon'
  | 'umbra'
  | 'success'
  | 'error';

export interface ChipProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  color?: colors;
  size?: 'small' | 'medium' | 'large';
  hover?: boolean;
  deletable?: boolean;
  handleDelete?: () => void;
  hide?: boolean;
}

const SIZE_CLASSES: { [key: string]: string } = {
  small: 'p-1',
  medium: 'p-2',
  large: 'p-3',
};

const BACKGROUND_COLORS: { [key: string]: string } = {
  primary: 'bg-gradient-to-r from-[#06b6d4] to-[#1d4ed8]',
  mineshaft: 'bg-mineshaft',
  umbra: 'bg-umbra',
  carbon: 'bg-carbon',
  error: 'bg-down-bad !text-black',
  success: 'bg-up-only !text-black',
};

const Chip: FC<ChipProps> = (props) => {
  const {
    children,
    icon,
    className = '',
    size = 'medium',
    color = 'carbon',
    hover,
    deletable,
    handleDelete,
    hide,
    ...otherProps
  } = props;

  return (
    <button
      className={` text-sm w-fit text-white 
        ${hover ? 'cursor-pointer hover:opacity-80' : ''} ${className}
        ${deletable || icon ? 'flex justify-between items-center' : ''}
        ${hide ? 'hidden' : ''}
        ${BACKGROUND_COLORS[color]} ${SIZE_CLASSES[size]} ${otherProps}`}
      onClick={handleDelete}
    >
      {icon && <div className="mr-2">{icon}</div>}
      {children}
      {deletable && (
        <div className="ml-2 bg-stieglitz rounded-full w-4">
          <XMarkIcon className="text-white" />
        </div>
      )}
    </button>
  );
};

Chip.displayName = 'Chip';

export default Chip;
