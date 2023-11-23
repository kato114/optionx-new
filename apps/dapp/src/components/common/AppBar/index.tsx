import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';

import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Modal from '@mui/material/Modal';

import MenuIcon from '@mui/icons-material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NotificationsIcon from '@mui/icons-material/Notifications';

import axios from 'axios';
import { useNetwork } from 'wagmi';

import { useBoundStore } from 'store';

import DisclaimerDialog from 'components/common/DisclaimerDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'components/UI/Tooltip';

import { DEFAULT_CHAIN_ID } from 'constants/env';
import {
  DISCLAIMER_MESSAGE,
  OFAC_COMPLIANCE_LOCAL_STORAGE_KEY,
} from 'constants/index';

import ConnectButton from '../ConnectButton';
import AppLink from './AppLink';
import AppSubMenu from './AppSubMenu';
import NetworkButton from './NetworkButton';
import NftClaims from './NftClaims';
import RdpxAirdropButton from './RdpxAirdropButton';
import { LinkType } from './types';

const NotifiCard = lazy(() =>
  import('components/NotifiCard').then((module) => ({
    default: module.NotifiCard,
  })),
);

const appLinks: {
  [key: number]: LinkType[];
} = {
  1: [
    { name: 'Farms', to: '/farms' },
    { name: 'Sale', to: '/sale' },
  ],
  42161: [
    {
      name: 'SSOV', to: '/ssov',
    },
    {
      name: 'LP', to: '/olp',
    },
    {
      name: 'Staddles', to: '/clamm/WETH-USDC',
    },
    { name: 'Portfolio', to: '/portfolio' },
  ],
  137: [
    { name: 'Portfolio', to: '/portfolio' },
    { name: 'SSOV', to: '/ssov' },
    { name: 'Straddles', to: '/straddles' },
  ],
};

const menuLinks = [
  { name: 'Home', to: 'https://dopex.io' },
  { name: 'Docs', to: 'https://docs.dopex.io/' },
  { name: 'Discord', to: 'https://discord.gg/dopex' },
  { name: 'Github', to: 'https://github.com/dopex-io' },
  { name: 'Bug Bounty', to: 'https://github.com/dopex-io/bug-bounty' },
  { name: 'Fees', to: '/fees' },
  { name: 'Diamond Pepe NFTs', to: '/nfts/diamondpepes' },
  { name: 'OptionX NFTs', to: '/nfts/dopex' },
];

export default function AppBar() {
  const {
    accountAddress,
    updateTokenPrices,
    updateAssetBalances,
    setOpenComplianceDialog,
    openComplianceDialog,
    setUserCompliant,
    provider,
  } = useBoundStore();

  // // const { chain } = useNetwork();

  useEffect(() => {
    updateAssetBalances();
  }, [updateAssetBalances, provider]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorElSmall, setAnchorElSmall] = useState<null | HTMLElement>(null);
  const [isNotifiCardOpen, setIsNotifiCardOpen] = useState(false);

  const links = appLinks[DEFAULT_CHAIN_ID];

  const handleClose = useCallback(() => setAnchorEl(null), []);
  const handleCloseSmall = useCallback(() => setAnchorElSmall(null), []);

  const handleClickMenu = useCallback(
    (event: any) => setAnchorEl(event.currentTarget),
    [],
  );

  const handleClickMenuSmall = useCallback(
    (event: any) => setAnchorElSmall(event.currentTarget),
    [],
  );

  const userComplianceCheck = useCallback(async () => {
    if (!accountAddress) return;

    let data = localStorage.getItem(accountAddress) as any;
    let signature: string | null = null;
    // If signature does not exit in local storage
    if (!data) {
      // Get signature from api
      try {
        await axios
          .get(
            `https://flo7r5qw6dj5mi337w2esfvhhm0caese.lambda-url.us-east-1.on.aws/?address=${ethers.utils.getAddress(
              accountAddress,
            )}`,
          )
          .then((res) => {
            signature = res.data.signature;
          });
      } catch (err) {
        console.log(err);
      }
    } else {
      let objectified = JSON.parse(data) as any;
      signature = objectified[OFAC_COMPLIANCE_LOCAL_STORAGE_KEY];
    }

    if (!signature) {
      setUserCompliant(false);
      return;
    }

    const signatureSigner = ethers.utils.verifyMessage(
      DISCLAIMER_MESSAGE['english'],
      signature,
    );

    if (signatureSigner === accountAddress) setUserCompliant(true);
  }, [accountAddress, setUserCompliant]);

  useEffect(() => {
    userComplianceCheck();
  }, [userComplianceCheck]);

  useEffect(() => {
    updateAssetBalances();
  }, [updateAssetBalances]);

  useEffect(() => {
    updateTokenPrices();
    const intervalId = setInterval(updateTokenPrices, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [updateTokenPrices]);

  return (
    <>
      <DisclaimerDialog
        open={openComplianceDialog}
        handleClose={setOpenComplianceDialog}
      />
      <nav className="fixed bottom-0 w-full text-gray-600 z-50 backdrop-blur-sm h-[55px]">
        <div className="flex w-full items-center container justify-between mx-auto max-w-full">
          <div className="w-full space-x-1 flex justify-between border-t-[2px] py-3 px-5">
            {links?.map((link) => {
              // if (link.subLinks) {
              //   return (
              //     <AppSubMenu
              //       key={link.name}
              //       menuName={link.name}
              //       links={link.subLinks}
              //     />
              //   );
              // }
              return (
                <AppLink
                  to={link.to || ''}
                  name={link.name}
                  key={link.name}
                />
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
