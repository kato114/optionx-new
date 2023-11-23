import { SetStateAction, useCallback, useMemo, useState } from 'react';
import { BigNumber } from 'ethers';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import MoreVertIcon from '@mui/icons-material/MoreVert';

import { format } from 'date-fns';
import useShare from 'hooks/useShare';

import { useBoundStore } from 'store';

import CustomButton from 'components/UI/Button';
import Typography from 'components/UI/Typography';

import getUserReadableAmount from 'utils/contracts/getUserReadableAmount';
import formatAmount from 'utils/general/formatAmount';
import getPercentageDifference from 'utils/math/getPercentageDifference';

import Settle from './Dialogs/Settle';
import Transfer from './Dialogs/Transfer';

interface ExerciseTableDataProps {
  strikeIndex: number;
  strikePrice: number;
  purchasedAmount: number;
  settleableAmount: BigNumber;
  pnlAmount: BigNumber;
  isSettleable: boolean;
  isPastEpoch: boolean;
}

const DIALOGS = {
  SETTLE: Settle,
  TRANSFER: Transfer,
};

const ExerciseTableData = (props: ExerciseTableDataProps) => {
  const {
    strikeIndex,
    strikePrice,
    purchasedAmount,
    settleableAmount,
    pnlAmount,
    isSettleable,
  } = props;

  const { ssovData, ssovEpochData } = useBoundStore();
  const share = useShare((state) => state.open);

  const [dialogState, setDialogState] = useState({
    open: false,
    type: 'SETTLE',
    ssovData,
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClose = useCallback(
    () => setDialogState((prevState) => ({ ...prevState, open: false })),
    []
  );

  const handleTransfer = useCallback(
    () =>
      setDialogState({
        open: true,
        type: 'TRANSFER',
        ssovData,
      }),
    [ssovData]
  );
  const handleSettle = useCallback(
    () =>
      setDialogState({
        open: true,
        type: 'SETTLE',
        ssovData,
      }),
    [ssovData]
  );

  const handleShare = useCallback(() => {
    const tokenPrice = getUserReadableAmount(ssovData?.tokenPrice, 8);

    share({
      title: (
        <Typography variant="h4" className="font-bold shadow-2xl">
          {ssovData?.underlyingSymbol} {ssovData?.isPut ? 'PUT' : 'CALL'}{' '}
          Options
        </Typography>
      ),
      percentage: ssovData?.isPut
        ? getPercentageDifference(strikePrice, tokenPrice)
        : getPercentageDifference(tokenPrice, strikePrice),
      customPath: '/ssov',
      stats: [
        { name: 'Strike Price', value: `$${formatAmount(strikePrice, 2)}` },
        { name: 'Mark Price', value: `$${formatAmount(tokenPrice, 2)}` },
        {
          name: 'Expiry',
          value: format(
            (ssovEpochData?.epochTimes[1]?.toNumber() || 0) * 1000,
            'do MMM'
          ),
        },
      ],
    });
  }, [share, ssovData, ssovEpochData, strikePrice]);

  const handleClickMenu = useCallback(
    (event: { currentTarget: SetStateAction<HTMLElement | null> }) =>
      setAnchorEl(event.currentTarget),
    []
  );

  const handleCloseMenu = useCallback(() => setAnchorEl(null), []);

  const settleableBooleans = useMemo(() => {
    // @ts-ignore TODO: FIX
    if (ssovEpochData.isEpochExpired) {
      if (isSettleable) {
        return {
          settleButtonDisable: false,
          settleButtonPrimaryColor: true,
        };
      } else {
        return {
          settleButtonDisable: true,
          settleButtonPrimaryColor: false,
        };
      }
    } else
      return {
        settleButtonDisable: true,
        settleButtonPrimaryColor: false,
      };
  }, [ssovEpochData, isSettleable]);

  // @ts-ignore TODO: FIX
  const Dialog = DIALOGS[dialogState.type];

  return (
    <TableRow className="text-white bg-umbra mb-2  h-[69px]">
      <Dialog
        open={dialogState.open}
        handleClose={handleClose}
        strikeIndex={strikeIndex}
      />
      <TableCell align="left" className="border-0 py-1">
        <Typography variant="h6">${formatAmount(strikePrice, 5)}</Typography>
      </TableCell>
      <TableCell align="left" className="border-0 py-1">
        <Typography variant="h6">{formatAmount(purchasedAmount, 5)}</Typography>
      </TableCell>
      <TableCell align="left" className="border-0 py-1">
        <Typography variant="h6">
          {formatAmount(getUserReadableAmount(settleableAmount, 18), 5)}
        </Typography>
      </TableCell>
      <TableCell align="left" className="border-0 py-1">
        <Typography variant="h6">
          {pnlAmount.gte(0)
            ? `${formatAmount(getUserReadableAmount(pnlAmount, 18), 5)} ${ssovData?.collateralSymbol
            }`
            : `0 ${ssovData?.collateralSymbol}`}
        </Typography>
      </TableCell>
      <TableCell align="right" className="border-0 py-1">
        <Box className="flex justify-end">
          <CustomButton
            size="medium"
            className="px-2"
            onClick={handleSettle}
            disabled={settleableBooleans.settleButtonDisable}
            color={
              settleableBooleans.settleButtonPrimaryColor
                ? 'primary'
                : 'cod-gray'
            }
          >
            Settle
          </CustomButton>
          <IconButton
            aria-label="more"
            aria-controls="long-menu"
            aria-haspopup="true"
            onClick={handleClickMenu}
            className="long-menu  bg-mineshaft mx-1 p-0 hover:bg-opacity-80 hover:bg-mineshaft flex"
            size="large"
          >
            <MoreVertIcon className="fill-current text-white" />
          </IconButton>
          <Box>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
              classes={{ paper: 'bg-umbra' }}
            >
              <MenuItem
                key="transfer-options"
                onClick={handleTransfer}
                className="text-white"
                disabled={settleableAmount.eq(BigNumber.from(0))}
              >
                Transfer
              </MenuItem>
              <MenuItem
                key="share"
                onClick={handleShare}
                className="text-white"
                disabled={settleableAmount.eq(BigNumber.from(0))}
              >
                Share
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default ExerciseTableData;
