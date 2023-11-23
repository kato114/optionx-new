import { useCallback } from 'react';

import { Addresses, MerkleDistributor__factory } from '@dopex-io/sdk';
import { Button } from '@dopex-io/ui';
import { useQuery } from '@tanstack/react-query';
import capitalize from 'lodash/capitalize';
import { useNetwork, useSwitchNetwork, useWalletClient } from 'wagmi';
import { getContract } from 'wagmi/actions';

import { DOPEX_API_BASE_URL } from 'constants/env';

interface NftClaimButtonProps {
  account: string;
  name: string;
}

const NftClaimButton = ({ account, name }: NftClaimButtonProps) => {
  const walletClient = useWalletClient();
  const network = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  const query = useQuery({
    queryKey: [name, account],
    queryFn: () =>
      fetch(
        `${DOPEX_API_BASE_URL}/v2/quest/${name.toLowerCase()}/${account}`
      ).then((res) => res.json()),
  });

  const handleClick = useCallback(async () => {
    if (!walletClient.data) return;

    if (network.chain?.id !== 42161) {
      switchNetwork?.(42161);
    }

    const contract = getContract({
      address: Addresses[42161]['NFTS'][`Dopex${capitalize(name)}NFT`],
      abi: MerkleDistributor__factory.abi,
      ...(walletClient.data ? { walletClient: walletClient.data } : {}),
    });

    const txData = query?.data?.data;

    await contract.write.claim([
      txData.index,
      txData.address,
      txData.amount,
      txData.proof,
    ]);
  }, [network.chain?.id, query.data, switchNetwork, walletClient, name]);

  if (!query.isLoading && query?.data?.valid) {
    return (
      <Button
        className="flex space-x-2 mx-2 bg-gradient-to-r from-blue-700 to-purple-700"
        onClick={handleClick}
      >
        Claim {capitalize(name)} NFT
      </Button>
    );
  } else return null;
};

export default NftClaimButton;
