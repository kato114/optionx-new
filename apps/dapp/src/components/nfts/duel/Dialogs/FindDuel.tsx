import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { BigNumber } from 'ethers';

import { ERC20__factory } from '@dopex-io/sdk';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useBoundStore } from 'store';
import BigCrossIcon from 'svgs/icons/BigCrossIcon';

import Dialog from 'components/UI/Dialog';
import Typography from 'components/UI/Typography';
import { PepeButton } from 'components/nfts/components/PepeButton';
import Details from 'components/nfts/duel/Details';
import DuelExpiry from 'components/nfts/duel/DuelExpiry';
import Instructions from 'components/nfts/duel/Instructions';
import Moves from 'components/nfts/duel/Moves';

import getContractReadableAmount from 'utils/contracts/getContractReadableAmount';
import getUserReadableAmount from 'utils/contracts/getUserReadableAmount';
import formatAmount from 'utils/general/formatAmount';

import { MAX_VALUE } from 'constants/index';

export interface Props {
  open: boolean;
  handleClose: () => void;
}

const feesPercentage = 80;

const FindDuel = ({ open, handleClose }: Props) => {
  const {
    signer,
    contractAddresses,
    accountAddress,
    provider,
    duelContract,
    updateDuels,
    selectedDuel,
  } = useBoundStore();

  const [isSelectingNfts, setIsSelectingNfts] = useState<boolean>(false);
  const [isSelectingMoves, setIsSelectingMoves] = useState<boolean>(false);
  const [moves, setMoves] = useState<string[]>([]);
  const [isSearchModeActive, setIsSearchModeActive] = useState<boolean>(false);
  const [payWithETH, setPayWithETH] = useState<boolean>(false);
  const [userTokenBalance, setUserTokenBalance] = useState<BigNumber>(
    BigNumber.from('0')
  );

  const tokenName = useMemo(() => {
    return payWithETH ? 'ETH' : 'WETH';
  }, [payWithETH]);

  const fees = useMemo(() => {
    if (!selectedDuel) return 0;
    return (selectedDuel['wager'] * feesPercentage) / 100;
  }, [selectedDuel]);

  const maxPayout = useMemo(() => {
    if (!selectedDuel) return 0;
    return selectedDuel['wager'] * 2 - fees;
  }, [selectedDuel, fees]);

  const kickMovesSelected = useMemo(() => {
    let counter: number = 0;

    moves.map((move) => {
      if (move === 'kick') counter += 1;
    });

    return counter;
  }, [moves]);

  const blockMovesSelected = useMemo(() => {
    let counter: number = 0;

    moves.map((move) => {
      if (move === 'block') counter += 1;
    });

    return counter;
  }, [moves]);

  const specialMovesSelected = useMemo(() => {
    let counter: number = 0;

    moves.map((move) => {
      if (move === 'special') counter += 1;
    });

    return counter;
  }, [moves]);

  const punchMovesSelected = useMemo(() => {
    let counter: number = 0;

    moves.map((move) => {
      if (move === 'punch') counter += 1;
    });

    return counter;
  }, [moves]);

  const addMove = useCallback(
    (move: string) => {
      if (move === 'kick' && kickMovesSelected >= 2) return;
      if (move === 'punch' && punchMovesSelected >= 2) return;
      if (move === 'block' && blockMovesSelected >= 2) return;
      if (move === 'special' && specialMovesSelected >= 1) return;
      if (moves.length > 4) return;

      setMoves([...moves, move]);
    },
    [
      punchMovesSelected,
      specialMovesSelected,
      blockMovesSelected,
      kickMovesSelected,
      moves,
    ]
  );

  const atLeastOneBlock = useMemo(() => {
    let flag = false;

    for (let i in moves) {
      if (moves[i] === 'block') flag = true;
    }

    return flag;
  }, [moves]);

  const saveMoves = useCallback(() => {
    if (moves.length <= 4) setMoves([]);
    if (!atLeastOneBlock) return alert('Your sequence must include a block');

    setIsSelectingMoves(false);
  }, [moves, atLeastOneBlock]);

  const goBack = () => {
    setMoves([]);

    setIsSelectingMoves(false);
  };

  const handleMatch = useCallback(async () => {
    if (!signer || !accountAddress || !duelContract || !updateDuels) return;
    if (moves.length < 5) return;
    if (!atLeastOneBlock) return alert('Your sequence must include a block');

    if (tokenName !== 'ETH') {
      const token = ERC20__factory.connect(
        contractAddresses[selectedDuel!['tokenName']],
        signer
      );

      const allowance = await token.allowance(
        accountAddress,
        duelContract.address
      );

      if (allowance.eq(0)) {
        await token.approve(duelContract.address, MAX_VALUE);
      }
    }

    const numericMoves: number[] = [];
    moves.map((move) => {
      if (move === 'kick') numericMoves.push(1);
      else if (move === 'punch') numericMoves.push(0);
      else if (move === 'special') numericMoves.push(3);
      else numericMoves.push(2);
    });

    await duelContract
      .connect(signer)
    ['challenge'](selectedDuel!['id'], numericMoves, {
      value:
        tokenName === 'ETH'
          ? getContractReadableAmount(selectedDuel!['wager'], 18)
          : 0,
    });

    setMoves([]);
    handleClose();
    await updateDuels();
  }, [
    duelContract,
    tokenName,
    signer,
    contractAddresses,
    selectedDuel,
    accountAddress,
    moves,
    handleClose,
    updateDuels,
    atLeastOneBlock,
  ]);

  const sufficientBalance = useMemo(() => {
    if (!userTokenBalance || !selectedDuel) return false;

    if (getUserReadableAmount(userTokenBalance, 18) < selectedDuel['wager'])
      return false;

    return true;
  }, [userTokenBalance, selectedDuel]);

  const canCreate = useMemo(() => {
    if (moves.length < 5) return false;
    if (!sufficientBalance) return false;
    if (!atLeastOneBlock) return false;

    return true;
  }, [moves, sufficientBalance, atLeastOneBlock]);

  // Updates the approved and user balance state
  useEffect(() => {
    (async function () {
      if (!provider || !contractAddresses || !tokenName || !accountAddress)
        return;

      let userAmount: BigNumber;

      if (tokenName === 'ETH') {
        userAmount = await provider.getBalance(accountAddress);
      } else {
        const _token = ERC20__factory.connect(
          contractAddresses[tokenName],
          provider
        );

        userAmount = await _token.balanceOf(accountAddress!);
      }
      setUserTokenBalance(userAmount);
    })();
  }, [accountAddress, provider, contractAddresses, tokenName]);

  return (
    <Dialog
      open={open}
      handleClose={handleClose}
      background={'bg-[#181C24]'}
      classes={{
        paper: 'rounded m-0',
        paperScrollPaper: 'overflow-x-hidden',
      }}
    >
      {!selectedDuel ? (
        <Box></Box>
      ) : isSearchModeActive ? (
        <Box>
          <Box className="flex flex-row items-center mb-4">
            <img
              src={'/images/nfts/pepes/find-duel-button.png'}
              className={'w-46 mr-2 ml-auto'}
              alt={'Create duel'}
            />
            <IconButton
              className="p-0 pb-1 mr-1.5 mt-0.5 ml-auto"
              onClick={() => setIsSearchModeActive(false)}
              size="large"
            >
              <BigCrossIcon className="" />
            </IconButton>
          </Box>
          <Box className="flex flex-row items-center mb-24 mt-2"></Box>
        </Box>
      ) : isSelectingNfts ? (
        <Box>
          <Box className="flex flex-row items-center mb-4">
            <IconButton
              className="p-0 pb-1 mr-auto mt-0.5 ml-0"
              onClick={() => setIsSelectingNfts(false)}
              size="large"
            >
              <img
                src="/images/misc/arrow-left-white.svg"
                className="w-46 ml-auto"
                alt="Go back"
              />
            </IconButton>
            <img
              src="/images/nfts/pepes/your-nfts.png"
              className="w-46 mr-auto"
              alt="Your nfts"
            />
          </Box>
          <Box className="h-[40rem] overflow-hidden mt-2">
            <Box>
              <Box className="absolute left-[20%] top-[40%] z-50 text-center">
                <Typography
                  variant="h5"
                  className="text-[#9CECFD] font-['Minecraft']"
                >
                  Checking for whitelisted NFTs...
                </Typography>
                <CircularProgress
                  color="inherit"
                  size="17px"
                  className="mr-auto ml-auto mt-0.5 text-[#9CECFD]"
                />
              </Box>
              {[...Array(8)].map((i) => {
                return (
                  <Box className="flex lg:grid lg:grid-cols-12 mb-3" key={i}>
                    {[3, 1, 2, 1].map((j) => (
                      <Box className="col-span-3 px-2 relative" key={j}>
                        <img
                          src={`/images/nfts/pepes/pepe-frame-${j}.png`}
                          className="w-full"
                          alt="Pepe"
                        />
                      </Box>
                    ))}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      ) : isSelectingMoves ? (
        <Box>
          <Box className="flex flex-row items-center mb-4">
            <IconButton
              className="p-0 pb-1 mr-auto mt-0.5 ml-0"
              onClick={goBack}
              size="large"
            >
              <img
                src="/images/misc/arrow-left-white.svg"
                className="w-46 ml-auto"
                alt="Go back"
              />
            </IconButton>
            <img
              src="/images/nfts/pepes/select-moves.png"
              className="w-46 mr-auto"
              alt="Select moves"
            />
          </Box>
          <Box className="bg-[#232935] rounded-2xl flex flex-col mb-4 px-3 py-3">
            <Box className="flex">
              <img
                src="/images/misc/gamepad.svg"
                className="w-3.5 h-3.5 mr-1.5 mt-1"
                alt=""
              />
              <Typography variant="h6" className="text-[#78859E] text-sm">
                Select Moves
              </Typography>
            </Box>
            <Box className="flex mt-5 mb-1 ml-2">
              <Moves moves={moves} />
              {[...Array(5 - moves.length)].map((i) => (
                <Box className="flex" key={i}>
                  <Box className="mr-3">
                    <img src="/images/misc/plus.png" alt="Plus" />
                    <Box className="mt-1 text-center">
                      <Typography variant="h6" className="mt-1 text-[10px]">
                        <span className="text-[#78859E]">*</span>
                      </Typography>
                      <Typography variant="h6" className="text-[10px]">
                        <span className="text-white font-['Minecraft']">-</span>
                      </Typography>
                    </Box>
                  </Box>
                  {i < 5 - moves.length - 1 ? (
                    <img
                      src="/images/misc/arrow-right-black.svg"
                      className="w-2.5 h-3 mt-3 mr-3"
                      alt="Arrow right"
                    />
                  ) : null}
                </Box>
              ))}
            </Box>
          </Box>
          <Instructions />
          <Box className="flex">
            <Box className="ml-auto w-1/2 flex">
              <Tooltip title="Kick">
                <Box
                  className="bg-[#43609A] rounded-full w-11 h-10 flex border-2 border-black ml-auto mr-12 relative cursor-pointer"
                  onClick={() => addMove('kick')}
                >
                  <Box className="absolute bg-[#22E1FF] flex pl-1.5 pr-1.5 rounded-full left-[-0.5rem] top-[-0.2rem]">
                    <Typography
                      variant="h6"
                      className="text-black text-[10px] font-['Minecraft'] mt-0.5 mx-0.5"
                    >
                      {2 - kickMovesSelected}
                    </Typography>
                  </Box>
                  <img
                    src="/images/nfts/pepes/kick.png"
                    className="mx-auto my-auto w-6 h-6"
                    alt="Kick"
                  />
                </Box>
              </Tooltip>
            </Box>
          </Box>
          <Box className="flex mt-0.5">
            <Box className="ml-auto w-1/2 flex">
              <Tooltip title="Block">
                <Box
                  className="bg-[#43609A] rounded-full w-11 h-10 flex border-2 border-black ml-14 relative cursor-pointer"
                  onClick={() => addMove('block')}
                >
                  <Box className="absolute bg-[#22E1FF] flex pl-1.5 pr-1.5 rounded-full left-[-0.5rem] top-[-0.2rem]">
                    <Typography
                      variant="h6"
                      className="text-black text-[10px] font-['Minecraft'] mt-0.5 mx-0.5"
                    >
                      {2 - blockMovesSelected}
                    </Typography>
                  </Box>
                  <img
                    src="/images/nfts/pepes/block.png"
                    className="mx-auto my-auto w-6 h-6"
                    alt="Block"
                  />
                </Box>
              </Tooltip>
              <Tooltip title="Special">
                <Box
                  className="bg-[#43609A] rounded-full w-11 h-10 flex border-2 border-black ml-8 mr-3 relative cursor-pointer"
                  onClick={() => addMove('special')}
                >
                  <Box className="absolute bg-[#FFD50B] flex pl-1.5 pr-1.5 rounded-full left-[-0.5rem] top-[-0.2rem]">
                    <Typography
                      variant="h6"
                      className="text-black text-[10px] font-['Minecraft'] mt-0.5 mx-0.5"
                    >
                      {1 - specialMovesSelected}
                    </Typography>
                  </Box>
                  <img
                    src="/images/nfts/pepes/special.png"
                    className="mx-auto my-auto w-6 h-6"
                    alt="Special"
                  />
                </Box>
              </Tooltip>
            </Box>
          </Box>
          <Box className="flex">
            <Tooltip title="Punch">
              <Box
                className="ml-auto w-1/2 flex cursor-pointer"
                onClick={() => addMove('punch')}
              >
                <Box className="bg-[#43609A] rounded-full w-11 h-10 flex border-2 border-black ml-auto mr-12 relative">
                  {' '}
                  <Box className="absolute bg-[#22E1FF] flex pl-1.5 pr-1.5 rounded-full left-[-0.5rem] top-[-0.2rem]">
                    <Typography
                      variant="h6"
                      className="text-black text-[10px] font-['Minecraft'] mt-0.5 mx-0.5"
                    >
                      {2 - punchMovesSelected}
                    </Typography>
                  </Box>
                  <img
                    src="/images/nfts/pepes/punch.png"
                    className="mx-auto my-auto w-6 h-6"
                    alt="Punch"
                  />
                </Box>
              </Box>
            </Tooltip>
          </Box>
          {moves.length > 0 && !atLeastOneBlock ? (
            <Box className="flex mt-8 ml-4 mr-4">
              <Typography
                variant="h6"
                className="text-red-500 font-['Minecraft'] cursor-pointer"
              >
                {'Your sequence must include a block'}
              </Typography>
            </Box>
          ) : null}
          <Box className="flex mt-5">
            <Box className="w-1/2 mr-2 ml-4">
              <PepeButton
                action={() => setMoves([])}
                text={'RESET'}
                className={''}
                variant={'h5'}
                disabled={false}
              />
            </Box>
            <Box className="w-1/2 ml-2 mr-4">
              <PepeButton
                action={saveMoves}
                text={'SAVE'}
                className={''}
                variant={'h5'}
                disabled={false}
              />
            </Box>
          </Box>
        </Box>
      ) : (
        <Box>
          <Box className="flex flex-row items-center mb-4">
            <IconButton
              className="p-0 pb-1 mr-auto ml-0.5 opacity-20 hover:opacity-100"
              size="large"
            >
              <Tooltip title={'Not enabled yet'}>
                <img src="/images/misc/search.svg" alt="Search" />
              </Tooltip>
            </IconButton>
            <img
              src={'/images/nfts/pepes/find-duel-button.png'}
              className={'w-46 mr-1 ml-auto'}
              alt={'Create duel'}
            />
            <IconButton
              className="p-0 pb-1 mr-0 mt-0.5 ml-auto"
              onClick={handleClose}
              size="large"
            >
              <BigCrossIcon className="" />
            </IconButton>
          </Box>
          <Box className="bg-[#232935] rounded-2xl flex flex-col mb-1 p-1 pr-2">
            <Box className="flex flex-row justify-between mb-1.5">
              <Box className="flex">
                <img
                  src="/images/nfts/pepes/crown.svg"
                  className="w-3 h-3 mt-3 mb-0.5 mr-0.5 ml-2"
                  alt="Wager"
                />
                <Typography
                  variant="h6"
                  className="text-[#78859E] text-sm pl-1 pt-1.5"
                >
                  Wager
                </Typography>
              </Box>
              <Box className="ml-auto bg-[#343C4D] pt-1 pb-0 px-2 rounded-sm mt-1.5 mr-2 flex">
                <img
                  src={`/images/tokens/${selectedDuel[
                    'tokenName'
                  ].toLowerCase()}.svg`}
                  className="h-3.5 w-3.5 mr-2"
                  alt="Token"
                />
                <Typography variant="h6" className="text-sm font-['Minecraft']">
                  {formatAmount(selectedDuel['wager'], 4)}
                  <span className="text-[#78859E] ml-1">
                    {payWithETH ? 'ETH' : 'WETH'}
                  </span>
                </Typography>
              </Box>
              <Typography
                variant="h6"
                className="text-sm font-['Minecraft'] mt-2.5 cursor-pointer"
                onClick={() => setPayWithETH(!payWithETH)}
              >
                {payWithETH ? 'Use WETH?' : 'Use ETH?'}
              </Typography>
            </Box>
          </Box>
          <Box className="bg-[#232935] rounded-2xl flex flex-col mt-4 mb-4 px-3 py-3">
            <Box className="flex">
              <img
                src="/images/misc/gamepad.svg"
                className="w-3.5 h-3.5 mr-1.5 mt-1"
                alt="Gamepad"
              />
              <Typography variant="h6" className="text-[#78859E] text-sm">
                Select Moves
              </Typography>
              {moves.length === 5 ? (
                <Typography
                  variant="h6"
                  className="text-cyan-500 text-sm ml-auto cursor-pointer"
                  onClick={() => setMoves([])}
                >
                  Reset
                </Typography>
              ) : null}
            </Box>
            <Box className="flex mt-3 mb-1">
              {moves.length === 5 ? (
                <Moves moves={moves} />
              ) : (
                <Box
                  className="py-6 bg-[#343C4D] flex  w-full cursor-pointer"
                  onClick={() => setIsSelectingMoves(true)}
                >
                  <img
                    src="/images/misc/plus-skin.svg"
                    className="ml-auto mr-auto"
                    alt="Plus"
                  />
                </Box>
              )}
            </Box>
          </Box>
          <Box className=" p-4 pb-1.5 border border-[#232935] bg-[#232935] w-full mt-0.5">
            <Details
              maxPayout={maxPayout}
              payoutTokenName={selectedDuel['tokenName']}
              fees={fees}
            />
            <DuelExpiry
              text={
                'You will automatically win if your opponent does not reveal his moves in 24 hours'
              }
            />
            <PepeButton
              action={handleMatch}
              text={!sufficientBalance ? 'Insufficient balance' : 'DUEL'}
              className={''}
              variant={'h5'}
              disabled={!canCreate}
            />
          </Box>
        </Box>
      )}
    </Dialog>
  );
};

export default FindDuel;
