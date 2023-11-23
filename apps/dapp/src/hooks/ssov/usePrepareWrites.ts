import { Address } from 'viem';

import { SsovV3__factory, SsovV3StakingRewards__factory } from '@dopex-io/sdk';
import { erc20ABI, usePrepareContractWrite } from 'wagmi';

interface SsovStakeAndClaimProps {
  ssov: Address;
  tokenId: bigint;
  receiver: Address;
}

interface ApproveProps {
  token: Address;
  spender: Address;
  amount: bigint;
}

interface SsovDepositAndPurchaseProps {
  ssov: Address;
  strikeIndex: bigint;
  amount: bigint;
  to: Address;
}

interface WithdrawProps {
  ssov: Address;
  tokenId: bigint;
  to: Address;
}

interface SettleProps extends SsovDepositAndPurchaseProps {
  epoch: bigint;
}

export const usePrepareApprove = ({ token, spender, amount }: ApproveProps) => {
  const { config } = usePrepareContractWrite({
    abi: erc20ABI,
    address: token,
    functionName: 'approve',
    args: [spender, amount],
  });

  return config;
};

export const usePrepareDeposit = ({
  ssov,
  strikeIndex,
  amount,
  to,
}: SsovDepositAndPurchaseProps) => {
  const { config } = usePrepareContractWrite({
    abi: SsovV3__factory.abi,
    address: ssov,
    functionName: 'deposit',
    args: [strikeIndex, amount, to],
  });

  return config;
};

export const usePreparePurchase = ({
  ssov,
  strikeIndex,
  amount,
  to,
}: SsovDepositAndPurchaseProps) => {
  const { config } = usePrepareContractWrite({
    abi: SsovV3__factory.abi,
    address: ssov,
    functionName: 'purchase',
    args: [strikeIndex, amount, to],
  });

  return config;
};

export const usePrepareStake = ({ ssov, tokenId }: SsovStakeAndClaimProps) => {
  const { config } = usePrepareContractWrite({
    abi: SsovV3StakingRewards__factory.abi,
    address: '0x9d5FA385cd988d3F148F53a9A5C87B7C8540B62d' as Address,
    functionName: 'stake',
    args: [ssov, tokenId],
  });

  return config;
};

export const usePrepareClaim = ({
  ssov,
  tokenId,
  receiver,
}: SsovStakeAndClaimProps) => {
  const { config } = usePrepareContractWrite({
    abi: SsovV3StakingRewards__factory.abi,
    address: '0x9d5FA385cd988d3F148F53a9A5C87B7C8540B62d' as Address,
    functionName: 'claim',
    args: [ssov, tokenId, receiver],
  });

  return config;
};

export const usePrepareWithdraw = ({ ssov, tokenId, to }: WithdrawProps) => {
  const { config } = usePrepareContractWrite({
    abi: SsovV3__factory.abi,
    address: ssov,
    functionName: 'withdraw',
    args: [tokenId, to],
  });

  return config;
};

export const usePrepareSettle = ({
  ssov,
  strikeIndex,
  amount,
  epoch,
  to,
}: SettleProps) => {
  const { config } = usePrepareContractWrite({
    abi: SsovV3__factory.abi,
    address: ssov,
    functionName: 'settle',
    args: [strikeIndex, amount, epoch, to],
  });

  return config;
};
