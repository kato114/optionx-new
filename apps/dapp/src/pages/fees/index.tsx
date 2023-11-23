import { useEffect, useState } from 'react';
import Head from 'next/head';
import { BigNumber, ethers } from 'ethers';

import Skeleton from '@mui/material/Skeleton';

import { providers } from '@0xsequence/multicall';
import axios from 'axios';

import AppBar from 'components/common/AppBar';

import { CHAINS } from 'constants/chains';
import { DOPEX_API_BASE_URL } from 'constants/env';

interface SsovCardProps {
  name: string;
  tokenSymbol: string;
  duration: string;
  type: string;
  purchaseFeePercentage: BigNumber;
  settlementFeePercentage: BigNumber;
}

const SsovCard = ({
  name,
  tokenSymbol,
  duration,
  type,
  purchaseFeePercentage,
  settlementFeePercentage,
}: SsovCardProps) => {
  return (
    <a href={`/ssov/${name}`} rel="noopener noreferrer">
      <div className="bg-umbra shadow-2xl p-4 rounded-2xl hover:-translate-y-1 transition ease-in hover:backdrop-blur-sm hover:bg-opacity-60 cursor-pointer hover:border-wave-blue border-2 border-transparent">
        <div className="flex space-x-3 items-center mb-3">
          <img
            alt={name}
            src={`/images/tokens/${tokenSymbol.toLowerCase()}.svg`}
            className="h-8 w-auto"
          />
          <div className="font-bold capitalize">
            {tokenSymbol} {duration}
          </div>
          <img
            src={`/images/misc/${type === 'call' ? 'calls.svg' : 'puts.svg'}`}
            alt="option-type"
            className="h-6 w-auto"
          />
        </div>
        <div>
          Purchase Fee: {ethers.utils.formatUnits(purchaseFeePercentage, 8)}%{' '}
          <span className="text-xs"> of underlying price per option</span>
        </div>
        <div>
          Settlement Fee: {ethers.utils.formatUnits(settlementFeePercentage, 8)}
          % <span className="text-xs"> of PnL</span>
        </div>
      </div>
    </a>
  );
};

const Fees = () => {
  const [ssovs, setSsovs] = useState<any[]>([]);
  const [ssovsLoading, setSsovsLoading] = useState(false);

  useEffect(() => {
    async function updateSsovsData() {
      setSsovsLoading(true);
      const response = await axios.get(
        `${DOPEX_API_BASE_URL}/v2/ssov?groupBy=none`,
      );

      let _ssovs = Object.keys(response.data).map((k) => response.data[k]);

      const data = await Promise.all(
        _ssovs.map((ssov: { address: string; chainId: number }) => {
          const feeStrategy = new ethers.Contract(
            ssov.chainId === 137
              ? '0xeCf52d848178444d3cd5EBF9bD6F124EBEB42440'
              : '0x8C73B6D3C81C6CC42e8285c8C147a7563d71Add0',
            [
              'function getSsovFeeStructure(address ssov) view returns (uint256 purchaseFeePercentage, uint256 settlementFeePercentage)',
            ],
            new providers.MulticallProvider(
              new ethers.providers.StaticJsonRpcProvider(
                CHAINS[ssov.chainId]?.rpc!,
              ),
            ),
          );

          return feeStrategy['getSsovFeeStructure'](ssov.address);
        }),
      );

      _ssovs = _ssovs.map((s, i) => {
        return {
          ...s,
          purchaseFeePercentage: data[i].purchaseFeePercentage,
          settlementFeePercentage: data[i].settlementFeePercentage,
        };
      });

      setSsovs(_ssovs);
      setSsovsLoading(false);
    }

    updateSsovsData();
  }, []);

  return (
    <div className="min-h-screen">
      <Head>
        <title>Fees | OptionX</title>
      </Head>
      <AppBar />
      <div className="pb-28 pt-40 lg:max-w-5xl md:max-w-3xl sm:max-w-xl max-w-md mx-auto px-4 lg:px-0 to-">
        <div className="mb-8 font-bold text-4xl">Fees</div>
        <div className="mb-8 font-bold text-lg">
          Single Staking Option Vaults
        </div>
        <div className="grid md:grid-cols-2 grid-cols-1 gap-8 mb-8">
          {ssovsLoading
            ? [0, 1, 2, 3, 4, 5].map((i) => {
              return (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  className="bg-umbra rounded-2xl"
                  height={128}
                  width={496}
                />
              );
            })
            : ssovs.map((s) => {
              return (
                <SsovCard
                  key={s.symbol}
                  name={s.symbol}
                  tokenSymbol={s.underlyingSymbol}
                  duration={s.duration}
                  type={s.type}
                  purchaseFeePercentage={s.purchaseFeePercentage}
                  settlementFeePercentage={s.settlementFeePercentage}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Fees;
