import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ethers } from 'ethers';

import Box from '@mui/material/Box';
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

export interface Props {
  open: boolean;
  handleClose: () => void;
}

const feesPercentage = 80;

const RevealDuel = ({ open, handleClose }: Props) => {
  const { signer, duelContract, updateDuels, selectedDuel } = useBoundStore();

  const [isSelectingMoves, setIsSelectingMoves] = useState<boolean>(false);
  const [activeInfoSlide, setActiveInfoSlide] = useState<number>(0);
  const [moves, setMoves] = useState<string[]>([]);

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

  const saveMoves = useCallback(() => {
    if (moves.length <= 4) setMoves([]);
    setIsSelectingMoves(false);
  }, [moves]);

  const goBack = () => {
    setMoves([]);

    setIsSelectingMoves(false);
  };

  const handleReveal = useCallback(async () => {
    if (!signer || !duelContract || !updateDuels) return;
    if (moves.length < 5) return;

    const numericMoves: number[] = [];
    moves.map((move) => {
      if (move === 'kick') numericMoves.push(1);
      else if (move === 'punch') numericMoves.push(0);
      else if (move === 'special') numericMoves.push(3);
      else numericMoves.push(2);
    });

    const salt = window.prompt('Insert your salt');

    await duelContract
      .connect(signer)
    ['revealDuel'](
      selectedDuel!['id'],
      numericMoves,
      ethers.utils.formatBytes32String(salt!),
      {
        value: 0,
      }
    );

    setMoves([]);
    handleClose();
    await updateDuels();
  }, [duelContract, signer, selectedDuel, moves, handleClose, updateDuels]);

  const canReveal = useMemo(() => {
    if (moves.length < 5) return false;

    return true;
  }, [moves]);

  const loadInitialMoves = () => {
    let _historicalMoves = localStorage.getItem('moves');
    let _moves;
    if (_historicalMoves) {
      _moves = JSON.parse(_historicalMoves);
      const moves = _moves[_moves.length - 1];
      setMoves(moves);
    }
  };

  useEffect(() => {
    loadInitialMoves();
  }, []);

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
                alt="Game pad"
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
                    <img src="/images/misc/plus.png" alt="" />
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
                      alt=""
                    />
                  ) : null}
                </Box>
              ))}
            </Box>
          </Box>
          <Instructions />
          <Box className="flex mb-8">
            <Box
              className={`w-2 h-2 ${activeInfoSlide === 0 ? 'bg-white' : ''
                } border-[#43609A] border-[0.1px] rounded-full ml-auto mr-0 cursor-pointer`}
              onClick={() => setActiveInfoSlide(0)}
            />
            <Box
              className={`w-2 h-2 ${activeInfoSlide === 1 ? 'bg-white' : ''
                } border-[#43609A] border-[0.1px] rounded-full ml-2 mr-2 cursor-pointer`}
              onClick={() => setActiveInfoSlide(1)}
            />
            <Box
              className={`w-2 h-2 ${activeInfoSlide === 2 ? 'bg-white' : ''
                } border-[#43609A] border-[0.1px] rounded-full ml-0 mr-auto cursor-pointer`}
              onClick={() => setActiveInfoSlide(2)}
            />
          </Box>
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
                    alt=""
                    className="mx-auto my-auto w-6 h-6"
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
                    alt=""
                    className="mx-auto my-auto w-6 h-6"
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
                    alt=""
                    className="mx-auto my-auto w-6 h-6"
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
                    alt=""
                    className="mx-auto my-auto w-6 h-6"
                  />
                </Box>
              </Box>
            </Tooltip>
          </Box>
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
          <Box className="bg-[#232935] rounded-2xl flex flex-col mb-4 px-3 py-3 mt-6">
            <Box className="flex">
              <img
                src="/images/misc/gamepad.svg"
                alt=""
                className="w-3.5 h-3.5 mr-1.5 mt-1"
              />
              <Typography variant="h6" className="text-[#78859E] text-sm">
                Reveal Moves
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
                    alt=""
                    className="ml-auto mr-auto"
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
                'You will automatically lose if you do not reveal your moves within 24 hours from the challenge'
              }
            />
            <PepeButton
              action={handleReveal}
              text={'REVEAL'}
              className={''}
              variant={'h5'}
              disabled={!canReveal}
            />
          </Box>
        </Box>
      )}
    </Dialog>
  );
};

export default RevealDuel;
