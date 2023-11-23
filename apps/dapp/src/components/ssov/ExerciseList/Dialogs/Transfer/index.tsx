import {
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { BigNumber, utils as ethersUtils } from 'ethers';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { ERC20__factory } from '@dopex-io/sdk';
import useSendTx from 'hooks/useSendTx';
import { useBoundStore } from 'store';

import CustomButton from 'components/UI/Button';
import Dialog from 'components/UI/Dialog';
import Typography from 'components/UI/Typography';

import getUserReadableAmount from 'utils/contracts/getUserReadableAmount';
import formatAmount from 'utils/general/formatAmount';

export interface Props {
  open: boolean;
  handleClose: () => {};
  strikeIndex: number;
}

const Transfer = ({ open, handleClose, strikeIndex }: Props) => {
  const {
    accountAddress,
    signer,
    provider,
    updateSsovV3EpochData,
    updateSsovV3UserData,
    ssovEpochData,
    ssovData,
    selectedEpoch,
  } = useBoundStore();

  const sendTx = useSendTx();

  const [transferAmount, setTransferAmount] = useState('0');
  const [recipient, setRecipient] = useState('');
  const [userEpochStrikeTokenBalance, setUserEpochStrikeTokenBalance] =
    useState<BigNumber>(BigNumber.from(0));

  // @ts-ignore TODO: FIX
  const { epochStrikes, epochStrikeTokens } = ssovEpochData;

  const strikePrice = getUserReadableAmount(epochStrikes[strikeIndex] ?? 0, 8);
  const epochStrikeToken = epochStrikeTokens[strikeIndex];

  const error = useMemo(() => {
    let errorMessage;
    let recipientAddress = recipient.toLocaleLowerCase();
    let _transferAmount = transferAmount.toString();
    if (recipient !== '') {
      try {
        ethersUtils.getIcapAddress(recipientAddress);
      } catch (err) {
        errorMessage = 'Invalid address, please double check.';
      }
    }
    if (_transferAmount !== '' || _transferAmount > '0') {
      if (_transferAmount > userEpochStrikeTokenBalance.toString()) {
        errorMessage = 'Transfer amount exceeds balance';
      }
    }
    return errorMessage;
  }, [recipient, transferAmount, userEpochStrikeTokenBalance]);

  const updateUserEpochStrikeTokenBalance = useCallback(async () => {
    if (!epochStrikeToken || !accountAddress) {
      setUserEpochStrikeTokenBalance(BigNumber.from(0));
      return;
    }
    const userEpochStrikeTokenBalance = await ERC20__factory.connect(
      epochStrikeToken,
      provider
    ).balanceOf(accountAddress);
    setUserEpochStrikeTokenBalance(userEpochStrikeTokenBalance);
  }, [epochStrikeToken, accountAddress, provider]);

  const handleRecipientChange = useCallback(
    (e: { target: { value: { toString: () => SetStateAction<string> } } }) => {
      setRecipient(e.target.value.toString());
    },
    []
  );

  const handleAmountChange = useCallback(
    (e: { target: { value: { toString: () => SetStateAction<string> } } }) => {
      setTransferAmount(e.target.value.toString());
    },
    []
  );

  const handleMax = useCallback(() => {
    // @ts-ignore TODO: FIX
    setTransferAmount(userEpochStrikeTokenBalance);
  }, [userEpochStrikeTokenBalance]);

  const handleTransfer = useCallback(() => {
    if (!accountAddress || !epochStrikeToken || !signer) return;
    try {
      sendTx(ERC20__factory.connect(epochStrikeToken, signer), 'transfer', [
        recipient,
        ethersUtils.parseEther(String(transferAmount)),
      ]);
      // @ts-ignore TODO: FIX
      updateSsovV3EpochData();
      // @ts-ignore TODO: FIX
      updateSsovV3UserData();
      updateUserEpochStrikeTokenBalance();
      setTransferAmount('0');
      setRecipient('');
    } catch (err) {
      console.log(err);
    }
  }, [
    accountAddress,
    epochStrikeToken,
    recipient,
    updateSsovV3EpochData,
    updateUserEpochStrikeTokenBalance,
    updateSsovV3UserData,
    signer,
    sendTx,
    transferAmount,
  ]);

  useEffect(() => {
    updateUserEpochStrikeTokenBalance();
  }, [updateUserEpochStrikeTokenBalance]);

  return (
    <Dialog
      open={open}
      handleClose={handleClose}
      classes={{ paper: 'rounded-2xl m-0' }}
    >
      <Box className="flex flex-col">
        <Box className="flex flex-row items-center mb-4">
          <IconButton
            className="p-0 pr-3 pb-1"
            onClick={handleClose}
            size="large"
          >
            <ArrowBackIcon
              className="text-stieglitz items-center"
              fontSize="large"
            />
          </IconButton>
          <Typography variant="h3">Transfer</Typography>
        </Box>
        <Box className="flex justify-between">
          <Typography variant="h6" className="text-stieglitz mb-2">
            Balance: {getUserReadableAmount(userEpochStrikeTokenBalance, 18)}
          </Typography>
          <Typography
            variant="h6"
            className="text-wave-blue uppercase mb-2 mr-2"
            role="button"
            onClick={handleMax}
          >
            Max
          </Typography>
        </Box>
        <Box className="bg-umbra  flex flex-col p-4">
          <Box className="flex flex-row justify-between">
            <Box className="h-12 bg-cod-gray  p-2 flex flex-row items-center">
              <Box className="flex flex-row h-8 w-8 mr-2">
                <img
                  src={`/images/tokens/${ssovData?.underlyingSymbol}.svg`}
                  alt={ssovData?.underlyingSymbol}
                />
              </Box>
              <Typography variant="h5" className="text-white">
                {ssovData?.underlyingSymbol}
              </Typography>
            </Box>
            <Input
              disableUnderline={true}
              id="amount"
              name="amount"
              value={transferAmount}
              onChange={handleAmountChange}
              placeholder="0"
              type="number"
              className="h-12 text-2xl text-white ml-2"
              classes={{ input: 'text-right' }}
            />
          </Box>
          <Box className="flex flex-col">
            <Box className="flex flex-row justify-between mt-3">
              <Typography
                variant="caption"
                component="div"
                className="text-stieglitz"
              >
                Strike Price
              </Typography>
              <Typography variant="caption">
                ${formatAmount(strikePrice, 5)}
              </Typography>
            </Box>
          </Box>
        </Box>
        {error !== undefined && (
          <Box className="m-4 border-2 p-3 bg-opacity-10 border-red-700 bg-red-500  border-opacity-50">
            <Typography
              variant="caption"
              component="div"
              className="text-center text-md text-red-400"
            >
              {error}
            </Typography>
          </Box>
        )}
        <Box
          className={`${!error && 'mt-4'
            } bg-umbra flex flex-row p-4  justify-between mb-4 w-full`}
        >
          <Input
            disableUnderline={true}
            id="address"
            name="recipientAddress"
            onChange={handleRecipientChange}
            value={recipient}
            type="text"
            className="h-8 text-sm text-white"
            placeholder="Enter recipient address"
            fullWidth
          />
        </Box>
        <CustomButton
          className="w-full mb-4"
          onClick={handleTransfer}
          size="large"
          disabled={recipient !== '' && error === undefined ? false : true}
        >
          Transfer
        </CustomButton>
        <Box className="flex flex-row justify-between mt-4">
          <Typography variant="h6" className="text-stieglitz">
            Epoch {selectedEpoch}
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
};

export default Transfer;
