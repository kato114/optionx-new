import { BigNumber, ethers } from 'ethers';
import { formatUnits } from 'viem';

import {
  ERC20__factory,
  SSOVOptionPricing,
  SSOVOptionPricing__factory,
  SsovV3,
  SsovV3__factory,
  SsovV3OptionToken__factory,
  SsovV3Router,
  SsovV3Router__factory,
  SsovV3StakingRewards,
  SsovV3StakingRewards__factory,
  SsovV3Viewer__factory,
} from '@dopex-io/sdk';
import axios from 'axios';
import request from 'graphql-request';
import { getVolume } from 'pages/ssov';
import { TokenData } from 'types';
import { StateCreator } from 'zustand';

import queryClient from 'queryClient';

import { getSsovPurchasesFromTimestampDocument } from 'graphql/ssovs';

import { CommonSlice } from 'store/Vault/common';
import { WalletSlice } from 'store/Wallet';

import getUserReadableAmount from 'utils/contracts/getUserReadableAmount';
import { formatAmount } from 'utils/general';

import { DOPEX_API_BASE_URL } from 'constants/env';
import { DECIMALS_STRIKE, DECIMALS_TOKEN } from 'constants/index';
import { DOPEX_SSOV_SUBGRAPH_API_URL } from 'constants/subgraphs';
import { TOKEN_ADDRESS_TO_DATA } from 'constants/tokens';

export interface SsovV3Signer {
  ssovContractWithSigner?: SsovV3;
  ssovRouterWithSigner?: SsovV3Router | undefined;
  ssovStakingRewardsWithSigner?: SsovV3StakingRewards;
}

export interface SsovV3Data {
  collateralSymbol?: string;
  underlyingSymbol?: string;
  collateralAddress?: string;
  ssovContract?: SsovV3;
  currentEpoch?: number;
  tokenPrice?: BigNumber;
  underlyingPrice?: BigNumber;
  collateralPrice?: BigNumber;
  lpPrice?: BigNumber;
  ssovOptionPricingContract?: SSOVOptionPricing;
  isCurrentEpochExpired?: boolean;
  isPut?: boolean;
}

export interface Reward {
  rewardToken: string;
  amount: any;
}

export interface SsovV3EpochData {
  epochTimes: BigNumber[];
  isEpochExpired: boolean;
  epochStrikes: BigNumber[];
  totalEpochStrikeDeposits: BigNumber[];
  totalEpochOptionsPurchased: BigNumber[];
  totalEpochPremium: BigNumber[];
  availableCollateralForStrikes: BigNumber[];
  rewardTokens: TokenData[];
  settlementPrice: BigNumber;
  epochStrikeTokens: string[];
  APY: string;
  TVL: number;
  rewards: Reward[];
  collateralExchangeRate: BigNumber;
  strikeToIdx: Map<string, number>;
  volumeInUSD: number;
  totalEpochPurchasesInUSD: BigNumber;
  stakingRewards: StakingRewards[][];
}

export interface StakingRewards {
  reward: TokenData;
  amount: BigNumber;
}
export interface WritePositionInterface {
  collateralAmount: BigNumber;
  strike: BigNumber;
  accruedRewards: BigNumber[];
  accruedPremiums: BigNumber;
  stakeRewardTokens: TokenData[];
  stakeRewardAmounts: BigNumber[];
  utilization: BigNumber;
  epoch: number;
  tokenId: BigNumber;
  stakingRewardsPosition?: SsovV3StakingRewards.StakedPositionStructOutput;
}
export interface SsovV3UserData {
  writePositions: WritePositionInterface[];
}

export interface SsovV3Slice {
  ssovData?: SsovV3Data;
  ssovEpochData?: SsovV3EpochData;
  ssovV3UserData?: SsovV3UserData;
  ssovSigner: SsovV3Signer;
  updateSsovV3EpochData: Function;
  updateSsovV3UserData: Function;
  updateSsovV3Signer: Function;
  totalEpochStrikeDepositsPending?: BigNumber[];
  totalEpochStrikeDepositsUsable?: BigNumber[];
  updateSsovV3: Function;
  getSsovViewerAddress: Function;
  getStakingRewardsContract: () => SsovV3StakingRewards | undefined;
}

export const createSsovV3Slice: StateCreator<
  WalletSlice & CommonSlice & SsovV3Slice,
  [['zustand/devtools', never]],
  [],
  SsovV3Slice
> = (set, get) => ({
  ssovData: {},
  ssovV3UserData: {
    writePositions: [],
  },
  ssovSigner: {},
  /**
   * Temporary resolver for legacy staking rewards contract and latest staking rewards contract
   */
  getStakingRewardsContract: () => {
    const {
      contractAddresses,
      signer,
      selectedPoolName,
      chainId,
      selectedEpoch,
    } = get();
    if (
      !signer ||
      !contractAddresses['SSOV-V3'] ||
      !contractAddresses['SSOV-V3']['STAKING-REWARDS'] ||
      chainId === 137
    )
      return;

    const legacyStakingEpoch: Record<string, number[]> = {
      'DPX-WEEKLY-CALLS-SSOV-V3': [42, 43],
      'rDPX-WEEKLY-CALLS-SSOV-V3': [42, 43],
      'stETH-WEEKLY-CALLS-SSOV-V3': [23, 24],
    };

    if (
      selectedPoolName &&
      legacyStakingEpoch[selectedPoolName] &&
      legacyStakingEpoch[selectedPoolName].includes(selectedEpoch)
    ) {
      return SsovV3StakingRewards__factory.connect(
        '0x64CcDDf4eE6bc26Ab6F6967B7Eab60f3280239e3',
        signer,
      );
    }

    return SsovV3StakingRewards__factory.connect(
      contractAddresses['SSOV-V3']['STAKING-REWARDS'],
      signer,
    );
  },
  updateSsovV3Signer: async () => {
    const {
      contractAddresses,
      signer,
      selectedPoolName,
      chainId,
      getStakingRewardsContract,
    } = get();

    if (!contractAddresses || !signer || !selectedPoolName) return;

    let _ssovSigner: SsovV3Signer;

    if (!contractAddresses['SSOV-V3']) return;

    const ssovAddress = contractAddresses['SSOV-V3'].VAULTS[selectedPoolName];

    if (!ssovAddress) return;

    const ssovRouterAddress = contractAddresses['SSOV-V3']['ROUTER'];

    let ssovRouterWithSigner;

    if (chainId !== 137)
      ssovRouterWithSigner = SsovV3Router__factory.connect(
        ssovRouterAddress,
        signer,
      );

    const _ssovContractWithSigner = SsovV3__factory.connect(
      ssovAddress,
      signer,
    );

    let ssovStakingRewardsWithSigner = getStakingRewardsContract();

    _ssovSigner = {
      ssovContractWithSigner: _ssovContractWithSigner,
      ssovRouterWithSigner,
      ssovStakingRewardsWithSigner,
    };

    set((prevState) => ({
      ...prevState,
      ssovSigner: _ssovSigner,
    }));
  },
  updateSsovV3EpochData: async () => {
    const {
      contractAddresses,
      selectedEpoch,
      selectedPoolName,
      provider,
      getSsovViewerAddress,
      chainId,
      getStakingRewardsContract,
    } = get();
    const ssovViewerAddress = getSsovViewerAddress();

    if (
      !contractAddresses ||
      !selectedEpoch ||
      !selectedPoolName ||
      !provider ||
      !ssovViewerAddress
    )
      return;

    if (!contractAddresses['SSOV-V3']) return;

    const ssovAddress = contractAddresses['SSOV-V3'].VAULTS[selectedPoolName];

    if (!ssovAddress) return;

    const ssovContract = SsovV3__factory.connect(ssovAddress, provider);

    const ssovViewerContract = SsovV3Viewer__factory.connect(
      ssovViewerAddress,
      provider,
    );

    const [
      epochTimes,
      totalEpochStrikeDeposits,
      totalEpochOptionsPurchased,
      totalEpochPremium,
      epochData,
      epochStrikeTokens,
      apyPayload,
      rewardsPayLoad,
    ] = await Promise.all([
      ssovContract.getEpochTimes(selectedEpoch),
      ssovViewerContract.getTotalEpochStrikeDeposits(
        selectedEpoch,
        ssovContract.address,
      ),
      ssovViewerContract.getTotalEpochOptionsPurchased(
        selectedEpoch,
        ssovContract.address,
      ),
      ssovViewerContract.getTotalEpochPremium(
        selectedEpoch,
        ssovContract.address,
      ),
      ssovContract.getEpochData(selectedEpoch),
      ssovViewerContract.getEpochStrikeTokens(
        selectedEpoch,
        ssovContract.address,
      ),
      axios.get(`${DOPEX_API_BASE_URL}/v2/ssov/apy?symbol=${selectedPoolName}`),
      axios.get(
        `${DOPEX_API_BASE_URL}/v2/ssov/rewards?symbol=${selectedPoolName}`,
      ),
    ]);
    const epochStrikes = epochData.strikes;
    const strikeToIdx = new Map<string, number>();

    const epochStrikeDataArray = await Promise.all(
      epochStrikes.map(async (strike, idx) => {
        strikeToIdx.set(strike.toString(), idx);
        return ssovContract.getEpochStrikeData(selectedEpoch, strike);
      }),
    );

    const availableCollateralForStrikes = epochStrikeDataArray.map((item) => {
      return item?.totalCollateral.sub(item?.activeCollateral);
    });

    const totalEpochDeposits = totalEpochStrikeDeposits.reduce(
      (acc, deposit) => {
        return acc.add(deposit);
      },
      BigNumber.from(0),
    );

    const underlyingPrice = await ssovContract.getUnderlyingPrice();
    const totalEpochDepositsInUSD = !(await ssovContract.isPut())
      ? getUserReadableAmount(totalEpochDeposits, 18) *
        getUserReadableAmount(underlyingPrice, 8)
      : getUserReadableAmount(totalEpochDeposits, 18);

    const totalEpochPurchases = totalEpochOptionsPurchased.reduce(
      (accumulator, val) => {
        return accumulator.add(val);
      },
      BigNumber.from(0),
    );
    const totalEpochPurchasesInUSD = totalEpochPurchases.mul(underlyingPrice);

    const tradesData = await queryClient.fetchQuery({
      queryKey: ['getSsovPurchasesFromTimestamp'],
      queryFn: async () =>
        request(
          DOPEX_SSOV_SUBGRAPH_API_URL,
          getSsovPurchasesFromTimestampDocument,
          {
            fromTimestamp: (new Date().getTime() / 1000 - 86400).toFixed(0),
          },
        ),
    });

    const volume = await getVolume(tradesData, ssovAddress);
    const volumeInUSD =
      getUserReadableAmount(volume, DECIMALS_TOKEN) *
      getUserReadableAmount(underlyingPrice, DECIMALS_STRIKE);

    let _stakingRewards: StakingRewards[][] = [];
    let stakingRewardsContract = getStakingRewardsContract();

    if (stakingRewardsContract) {
      const epochStrikeStakingRewardsCalls = epochStrikes.map((strike) => {
        return (
          stakingRewardsContract &&
          stakingRewardsContract[
            'getSsovEpochStrikeRewardsInfo(address,uint256,uint256)'
          ](ssovAddress, strike, selectedEpoch)
        );
      });

      const epochStrikeStakingRewardsResult = await Promise.all(
        epochStrikeStakingRewardsCalls,
      );

      for (const strikeRewardInfo of epochStrikeStakingRewardsResult) {
        let stakingRewards: StakingRewards[] = [];
        if (strikeRewardInfo) {
          for (const rewardInfo of strikeRewardInfo) {
            const rewardTokenAddress = rewardInfo.rewardToken;
            let tokenData = {
              symbol: '',
              imgSrc: '',
            };

            if (epochStrikeTokens.includes(rewardTokenAddress)) {
              const optionsToken = SsovV3OptionToken__factory.connect(
                rewardTokenAddress,
                provider,
              );
              const [strike, symbol] = await Promise.all([
                optionsToken.strike(),
                optionsToken.symbol(),
              ]);

              if (strike.lt(10e8)) {
                const readableStrike = formatAmount(
                  formatUnits(strike.toBigInt(), 8),
                  5,
                );

                // Array(4) [ "ARB", "29SEP23", "0", "C" ]
                const symbolSplit = symbol.split('-');

                const readableSymbol = `${symbolSplit[0]}-${symbolSplit[1]}-${readableStrike}-${symbolSplit[3]}`;

                tokenData = {
                  ...tokenData,
                  symbol: readableSymbol,
                };
              } else {
                tokenData = {
                  ...tokenData,
                  symbol,
                };
              }
            } else {
              const symbol = await ERC20__factory.connect(
                rewardTokenAddress,
                provider,
              ).symbol();

              tokenData = {
                ...tokenData,
                symbol,
              };
            }
            stakingRewards.push({
              reward: tokenData,
              amount: rewardInfo.rewardAmount,
            });
          }
          _stakingRewards.push(stakingRewards);
        }
      }
    }

    const _ssovEpochData = {
      isEpochExpired: epochData.expired,
      settlementPrice: epochData.settlementPrice,
      epochTimes,
      epochStrikes,
      totalEpochStrikeDeposits,
      totalEpochOptionsPurchased,
      totalEpochPremium,
      availableCollateralForStrikes,
      rewardTokens: epochData.rewardTokensToDistribute.map((token) => {
        return (
          TOKEN_ADDRESS_TO_DATA[token.toLowerCase()] || {
            symbol: 'UNKNOWN',
            imgSrc: '',
          }
        );
      }),
      APY: apyPayload.data.apy,
      epochStrikeTokens,
      TVL: totalEpochDepositsInUSD,
      rewards: rewardsPayLoad.data.rewards,
      collateralExchangeRate: epochData.collateralExchangeRate,
      strikeToIdx: strikeToIdx,
      volumeInUSD: volumeInUSD,
      totalEpochPurchasesInUSD: totalEpochPurchasesInUSD,
      stakingRewards: _stakingRewards,
    };

    set((prevState) => ({ ...prevState, ssovEpochData: _ssovEpochData }));
  },
  updateSsovV3UserData: async () => {
    const {
      contractAddresses,
      accountAddress,
      provider,
      selectedEpoch,
      selectedPoolName,
      getSsovViewerAddress,
      getStakingRewardsContract,
    } = get();

    const ssovViewerAddress = getSsovViewerAddress();

    if (
      !contractAddresses ||
      !accountAddress ||
      !selectedEpoch ||
      !selectedPoolName ||
      !ssovViewerAddress
    )
      return;

    if (!contractAddresses['SSOV-V3']) return;

    const ssovAddress = contractAddresses['SSOV-V3'].VAULTS[selectedPoolName];

    if (!ssovAddress) return;

    const ssov = SsovV3__factory.connect(ssovAddress, provider);

    const ssovViewerContract = SsovV3Viewer__factory.connect(
      ssovViewerAddress,
      provider,
    );

    const writePositions = await ssovViewerContract.walletOfOwner(
      accountAddress,
      ssovAddress,
    );

    const writePositionsData = await Promise.all(
      writePositions.map((i) => {
        return ssov.writePosition(i);
      }),
    );

    const checkpointData = await Promise.all(
      writePositionsData.map((pos) => {
        return ssov.checkpoints(pos.epoch, pos.strike, pos.checkpointIndex);
      }),
    );

    const accruedPremiumsPerPosition = writePositionsData.map(
      ({ collateralAmount }, index) => {
        const { activeCollateral, totalCollateral, accruedPremium } =
          checkpointData[index];
        const activeCollateralShare = collateralAmount
          .mul(activeCollateral)
          .div(totalCollateral);
        const accruedPremiumForCurrentPosition = activeCollateral.eq(0)
          ? BigNumber.from(0)
          : activeCollateralShare.mul(accruedPremium).div(activeCollateral);
        return accruedPremiumForCurrentPosition;
      },
    );

    let _rewardTokens: TokenData[][] = [];
    let _rewardAmounts: BigNumber[][] = [];
    let stakedPositions: SsovV3StakingRewards.StakedPositionStructOutput[] = [];

    const ssovStakingRewardsWithSigner = getStakingRewardsContract();

    if (ssovStakingRewardsWithSigner) {
      // Staking rewards
      const earnedCalls = writePositions.map((writePositionId) => {
        if (ssovStakingRewardsWithSigner) {
          return ssovStakingRewardsWithSigner['earned(address,uint256)'](
            ssov.address,
            writePositionId,
          );
        }
      });

      const stakedPositionCalls = writePositions.map((writePositionId) => {
        if (ssovStakingRewardsWithSigner) {
          return ssovStakingRewardsWithSigner?.getId(
            ssovAddress,
            writePositionId,
            selectedEpoch,
          );
        }
      });

      const earnings = await Promise.all(earnedCalls);
      let stakePositionIds = await Promise.all(stakedPositionCalls);

      let stakedPositionsCalls = stakePositionIds.map((id) => {
        return ssovStakingRewardsWithSigner!.getUserStakedPosition(id!);
      });

      stakedPositions = await Promise.all(stakedPositionsCalls);

      for (const earning of earnings) {
        _rewardAmounts.push(earning?.rewardAmounts!);
        let _rewardsTokenData = [];

        for (const rewardToken of earning?.rewardTokens!) {
          const symbol = await ERC20__factory.connect(
            rewardToken,
            provider,
          ).symbol();

          let tokenData = {
            symbol: symbol,
            imgSrc: '',
          };

          _rewardsTokenData.push(tokenData);
        }

        _rewardTokens.push(_rewardsTokenData);
      }
    }

    const _writePositions = writePositionsData.map((o, i) => {
      const utilization = checkpointData[i]?.activeCollateral.isZero()
        ? BigNumber.from(0)
        : checkpointData[i]?.activeCollateral
            .mul(1e2)
            .div(checkpointData[i]?.totalCollateral!);

      return {
        tokenId: writePositions[i] as BigNumber,
        collateralAmount: o.collateralAmount,
        epoch: o.epoch.toNumber(),
        strike: o.strike,
        accruedRewards: [],
        accruedPremiums: accruedPremiumsPerPosition[i],
        utilization: utilization!,
        stakeRewardAmounts: _rewardAmounts[i],
        stakeRewardTokens: _rewardTokens[i],
        stakingRewardsPosition: stakedPositions[i],
      };
    });

    set((prevState) => ({
      ...prevState,
      ssovV3UserData: {
        ...prevState.ssovV3UserData,
        writePositions: _writePositions,
      },
    }));
  },
  updateSsovV3: async () => {
    const {
      chainId,
      contractAddresses,
      selectedPoolName = '',
      provider,
      setSelectedEpoch,
    } = get();
    let _ssovData: SsovV3Data;

    const ssovAddress =
      contractAddresses['SSOV-V3']?.['VAULTS'][selectedPoolName];

    if (!ssovAddress) return;

    const _ssovContract = SsovV3__factory.connect(ssovAddress, provider);

    try {
      const [
        currentEpoch,
        tokenPrice,
        collateralPrice,
        underlyingSymbol,
        collateralToken,
        isPut,
      ] = await Promise.all([
        _ssovContract.currentEpoch(),
        _ssovContract.getUnderlyingPrice(),
        _ssovContract.getCollateralPrice(),
        _ssovContract.underlyingSymbol(),
        _ssovContract.collateralToken(),
        _ssovContract.isPut(),
      ]);

      let _currentEpoch = Number(currentEpoch) === 0 ? 1 : Number(currentEpoch);

      const params = window.location.search.split('?epoch=');

      if (params.length === 2) _currentEpoch = Number(params[1]!);

      const [epochData, collateralSymbol] = await Promise.all([
        _ssovContract.getEpochData(_currentEpoch),
        ERC20__factory.connect(collateralToken, provider).symbol(),
      ]);

      setSelectedEpoch(_currentEpoch);

      _ssovData = {
        underlyingSymbol,
        collateralSymbol,
        collateralAddress: collateralToken,
        isPut,
        ssovContract: _ssovContract,
        currentEpoch: Number(currentEpoch),
        isCurrentEpochExpired: epochData.expired,
        tokenPrice,
        underlyingPrice: tokenPrice,
        collateralPrice,
        lpPrice: ethers.utils.parseEther('1'),
        ssovOptionPricingContract: SSOVOptionPricing__factory.connect(
          chainId === 1088
            ? '0xeec2be5c91ae7f8a338e1e5f3b5de49d07afdc81'
            : '0x2b99e3d67dad973c1b9747da742b7e26c8bdd67b',
          provider,
        ),
      };

      set((prevState) => ({ ...prevState, ssovData: _ssovData }));
    } catch (err) {}
  },
  selectedEpoch: 1,
  getSsovViewerAddress: () => {
    const { selectedPoolName, contractAddresses } = get();
    if (!selectedPoolName || !contractAddresses['SSOV-V3']?.['VIEWER']) return;

    return selectedPoolName === 'ETH-CALLS-SSOV-V3'
      ? '0x9F948e9A79186f076EA19f5DDCCDF30eDc6DbaA2'
      : contractAddresses['SSOV-V3']['VIEWER'];
  },
});
