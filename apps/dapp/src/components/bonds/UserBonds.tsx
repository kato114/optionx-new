import { useCallback, useEffect, useMemo } from 'react';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import format from 'date-fns/format';
import useSendTx from 'hooks/useSendTx';
import { useBoundStore } from 'store';

import CustomButton from 'components/UI/Button';
import InfoTooltip from 'components/UI/InfoTooltip';
import Typography from 'components/UI/Typography';

import getUserReadableAmount from 'utils/contracts/getUserReadableAmount';
import displayAddress from 'utils/general/displayAddress';

type UserBondsProps = {
  handleModal: () => void;
};

export const UserBonds = ({ handleModal }: UserBondsProps) => {
  const sendTx = useSendTx();
  const {
    accountAddress,
    ensAvatar,
    ensName,
    dpxBondsUserEpochData,
    updateBondsUserEpochData,
    dpxBondsEpochData,
    signer,
    bondsContracts,
  } = useBoundStore();

  const { userDpxBondsState } = dpxBondsUserEpochData;
  const { depositPerNft, bondPrice } = dpxBondsEpochData;

  const handleRedeem = useCallback(async () => {
    if (
      !bondsContracts ||
      !signer ||
      !dpxBondsEpochData.epoch ||
      dpxBondsUserEpochData.userClaimableBonds.length < 1
    )
      return;
    try {
      await sendTx(bondsContracts.bondsContract.connect(signer), 'redeem', [
        dpxBondsEpochData.epoch,
      ]);
    } catch (e) {
      console.log(e);
    }

    return;
  }, [
    bondsContracts,
    dpxBondsUserEpochData,
    dpxBondsEpochData,
    sendTx,
    signer,
  ]);

  useEffect(() => {
    if (!accountAddress || !bondsContracts) return;
    updateBondsUserEpochData();
  }, [updateBondsUserEpochData, accountAddress, bondsContracts]);

  const notRedeemedBonds = useMemo(() => {
    return (
      (userDpxBondsState &&
        userDpxBondsState.filter(
          (bond: { redeemed: boolean }) => bond?.redeemed == false
        )) ||
      []
    );
  }, [userDpxBondsState]);

  return (
    <Box className="mt-5">
      <Typography variant="h5">Your Bonds</Typography>
      {accountAddress ? (
        notRedeemedBonds.length > 0 ? (
          <Box className=" bg-cod-gray max-w-[728px] pb-1">
            <Box className="bg-cod-gray border-b border-umbra mt-3 flex justify-between p-3 rounded-t-lg">
              <CustomButton
                variant="text"
                color="mineshaft"
                className="text-white border-cod-gray hover:border-wave-blue border border-solid"
              >
                {ensAvatar && (
                  <img src={ensAvatar} className="w-5 mr-2" alt="ens avatar" />
                )}
                {ensName ? ensName : displayAddress(accountAddress)}
              </CustomButton>
              <Tooltip title={`Redeem maturated bonds`} arrow>
                <CustomButton onClick={handleRedeem}>Redeem</CustomButton>
              </Tooltip>
            </Box>
            <Box className="flex bg-cod-gray border-b border-umbra">
              <Box className="p-3 flex-2 lg:flex-1 border-umbra">
                <Typography variant="h5" color="stieglitz" className="my-auto">
                  DPX Available
                </Typography>
              </Box>
              <Box className="p-3 flex lg:flex-1 border-umbra space-x-1">
                <Typography variant="h5" color="stieglitz" className="my-auto">
                  Issue Date
                </Typography>
                <InfoTooltip
                  title="Date & time of minting your bond"
                  id="locked-until"
                  iconClassName="h-5 w-5"
                  className="my-auto"
                />
              </Box>
              <Box className="p-3 flex lg:flex-1 border-umbra space-x-1">
                <Typography variant="h5" color="stieglitz" className="my-auto">
                  Locked Until
                </Typography>
                <InfoTooltip
                  title="You cannot redeem until the maturation period"
                  id="locked-until"
                  iconClassName="h-5 w-5"
                  className="my-auto"
                />
              </Box>
            </Box>
            {notRedeemedBonds.map((bond, index) => (
              <Box className="bg-cod-gray flex flex-wrap mb-5" key={index}>
                <Box className="p-3 flex-2 lg:flex-1 border-umbra w-1/2">
                  <Typography variant="h5">
                    {(
                      getUserReadableAmount(depositPerNft, 6) /
                      getUserReadableAmount(bondPrice, 6)
                    ).toFixed(2)}
                    <span className="bg-[#C3F8FF] rounded-sm text-xs text-black font-bold p-0.5 ml-1">
                      DPX
                    </span>
                  </Typography>
                </Box>
                <Box className="p-3 flex-2 lg:flex-1 border-umbra w-1/2">
                  <Typography variant="h5">
                    {format(new Date(bond.issued * 1000), 'EEE d LLL h:mmbb')}
                  </Typography>
                </Box>
                <Box className="p-3 lg:flex-1 lg:border-t-0 border-umbra w-1/2">
                  <Typography variant="h5">
                    {bond.maturityTime &&
                      format(
                        new Date(bond.maturityTime * 1000),
                        'EEE d LLL h:mmbb'
                      )}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box className="border flex m-auto justify-center border-umbra rounded-2xl p-3 max-w-[728px] mt-5">
            You have no vested DPX.
            <Typography
              variant="h5"
              className="text-[#22E1FF] ml-2"
              onClick={handleModal}
              role="button"
            >
              Bond Now
            </Typography>
          </Box>
        )
      ) : (
        <Box className="border border-umbra rounded-2xl p-3 flex max-w-[728px] mt-5">
          <AccountBalanceWalletIcon /> Connect your wallet to see your bonds
        </Box>
      )}
    </Box>
  );
};
