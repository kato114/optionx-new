import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useState,
} from 'react';
import { BigNumber } from 'ethers';

import Box from '@mui/material/Box';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import { useBoundStore } from 'store';

import Input from 'components/UI/Input';
import Typography from 'components/UI/Typography';

import { getUserReadableAmount } from 'utils/contracts';
import { formatAmount, getTokenDecimals } from 'utils/general';

import TokenSelector from '../TokenSelector';

interface IOverrides {
  setTokenSelectorOpen?: Dispatch<React.SetStateAction<boolean>>;
}

interface IInputWithTokenSelectorProps {
  selectedTokenSymbol: string;
  setSelectedToken: Dispatch<SetStateAction<string>>;
  handleMax: () => void;
  handleInputAmountChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  inputAmount: string | number;
  topLeftTag?: string;
  topRightTag?: string;
  overrides?: IOverrides;
  userTokenBalance: BigNumber;
}

const InputWithTokenSelector = (props: IInputWithTokenSelectorProps) => {
  const {
    inputAmount,
    handleInputAmountChange,
    setSelectedToken,
    selectedTokenSymbol,
    userTokenBalance,
    topLeftTag,
    topRightTag,
    overrides,
    handleMax,
  } = props;

  const { chainId } = useBoundStore();

  const [tokenSelectorOpen, setTokenSelectorOpen] = useState(false);

  const handleTokenSelectorClick = useCallback(() => {
    if (chainId === 137) return;
    setTokenSelectorOpen((prev) => !prev);

    // overrides
    overrides?.setTokenSelectorOpen &&
      overrides?.setTokenSelectorOpen((prev) => !prev);
  }, [overrides, chainId]);

  return (
    <Box className="bg-umbra ">
      <Input
        size="small"
        variant="default"
        type="number"
        placeholder="0.0"
        value={inputAmount}
        onChange={handleInputAmountChange}
        topElement={
          <Box className="flex mb-2">
            <Typography
              variant="h6"
              className="text-left flex-1 text-stieglitz"
            >
              {topLeftTag}
            </Typography>
            <Typography
              variant="h6"
              className="text-right flex-1 text-stieglitz"
            >
              {topRightTag}
            </Typography>
          </Box>
        }
        leftElement={
          <Box className="flex my-auto w-full space-x-2">
            <Box
              className="flex w-fit bg-cod-gray  justify-content items-center space-x-2 py-2 px-2"
              role={`${chainId === 137 ? 'Box' : 'Button'}`}
              onClick={handleTokenSelectorClick}
            >
              <img
                src={`/images/tokens/${selectedTokenSymbol.toLowerCase()}.svg`}
                alt={selectedTokenSymbol}
                className="w-[2rem]"
              />
              <Typography variant="h6" className="my-auto">
                {selectedTokenSymbol}
              </Typography>{' '}
              {/**
               * Disabling due 1inch API issues
               */}
              {/* {chainId !== 137 &&
                (tokenSelectorOpen ? (
                  <KeyboardArrowUpIcon className="text-white" />
                ) : (
                  <KeyboardArrowDownIcon className="text-white" />
                ))} */}
            </Box>
          </Box>
        }
        bottomElement={
          <Box className="flex w-full mt-2">
            <Typography
              className=" text-left flex-1 text-stieglitz"
              variant="h6"
            >
              Balance
            </Typography>
            <Typography
              className="text-right flex-1 text-stieglitz underline cursor-pointer"
              variant="h6"
              onClick={handleMax}
            >
              {formatAmount(
                getUserReadableAmount(
                  BigNumber.from(userTokenBalance),
                  getTokenDecimals(selectedTokenSymbol, chainId),
                ),
                3,
              )}
            </Typography>
          </Box>
        }
      />
      {/**
       * Disabling due 1inch API issues
       */}
      {false && (
        <TokenSelector
          open={tokenSelectorOpen}
          setOpen={handleTokenSelectorClick}
          setFromTokenSymbol={setSelectedToken}
          isInDialog={false}
          tokensToExclude={['ETH']}
        />
      )}
    </Box>
  );
};

export default InputWithTokenSelector;
