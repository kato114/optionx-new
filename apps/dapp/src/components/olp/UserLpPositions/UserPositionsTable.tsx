import { BigNumber } from 'ethers';

import { TableRow } from '@mui/material';
import Box from '@mui/material/Box';

import { LpPosition } from 'store/Vault/olp';

import CustomButton from 'components/UI/Button';
import NumberDisplay from 'components/UI/NumberDisplay';
import Typography from 'components/UI/Typography';
import {
  BodyCell,
  StyleLeftCell,
  StyleRightCell,
  getLiquidityBodyCell,
} from 'components/common/LpCommon/Table';

import getUserReadableAmount from 'utils/contracts/getUserReadableAmount';
import formatAmount from 'utils/general/formatAmount';

import { DECIMALS_STRIKE, DECIMALS_TOKEN } from 'constants/index';

interface Props {
  lpPosition: LpPosition;
  actions: Function;
  underlyingSymbol: string;
}

export default function UserPositionsTable(props: Props) {
  const { lpPosition, actions, underlyingSymbol } = props;

  return (
    <TableRow className="text-white bg-cod-gray mb-2 ">
      <StyleLeftCell align="left">
        <Typography variant="caption" color="white">
          <Box className="bg-umbra w-14 p-2 border-radius  flex justify-around">
            $<NumberDisplay n={lpPosition.strike} decimals={DECIMALS_STRIKE} />
          </Box>
        </Typography>
      </StyleLeftCell>
      {getLiquidityBodyCell(
        underlyingSymbol,
        lpPosition.usdLiquidity,
        lpPosition.underlyingLiquidity,
        lpPosition.usdLiquidity.gt(BigNumber.from(0))
      )}
      {getLiquidityBodyCell(
        underlyingSymbol,
        lpPosition.usdLiquidityUsed,
        lpPosition.underlyingLiquidityUsed,
        lpPosition.usdLiquidity.gt(BigNumber.from(0))
      )}
      <BodyCell
        data={`${formatAmount(getUserReadableAmount(lpPosition.discount, 0))}%`}
      />
      <BodyCell
        data={`${getUserReadableAmount(lpPosition.purchased, DECIMALS_TOKEN)}`}
      />
      <StyleRightCell align="right" className="pt-2">
        <CustomButton
          className="cursor-pointer text-white"
          color="primary"
          onClick={() => actions()}
        >
          Kill
        </CustomButton>
      </StyleRightCell>
    </TableRow>
  );
}
