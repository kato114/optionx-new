import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { BigNumber, ethers } from 'ethers';

import { ERC20__factory } from '@dopex-io/sdk';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import { useBoundStore } from 'store';
import BigCrossIcon from 'svgs/icons/BigCrossIcon';

import Dialog from 'components/UI/Dialog';
import Typography from 'components/UI/Typography';
import TokenSelector from 'components/common/TokenSelector';
import { PepeButton } from 'components/nfts/components/PepeButton';
import Details from 'components/nfts/duel/Details';
import DuelExpiry from 'components/nfts/duel/DuelExpiry';
import Instructions from 'components/nfts/duel/Instructions';
import Moves from 'components/nfts/duel/Moves';

import getContractReadableAmount from 'utils/contracts/getContractReadableAmount';
import getUserReadableAmount from 'utils/contracts/getUserReadableAmount';
import downloadTxt from 'utils/general/downloadTxt';
import formatAmount from 'utils/general/formatAmount';
import { getRandomString } from 'utils/general/getRandomString';
import getTokenDecimals from 'utils/general/getTokenDecimals';

import { MAX_VALUE } from 'constants/index';

export interface Props {
  open: boolean;
  handleClose: () => void;
}

const feesPercentage = 80;

const CreateDuel = ({ open, handleClose }: Props) => {
  const {
    chainId,
    signer,
    contractAddresses,
    accountAddress,
    provider,
    updateDuels,
    duelContract,
  } = useBoundStore();

  const [tokenName, setTokenName] = useState<string>('WETH');
  const [wager, setWager] = useState<number>(1);
  const [isSelectingMoves, setIsSelectingMoves] = useState<boolean>(false);
  const [moves, setMoves] = useState<string[]>([]);
  const [hasConfirmedPolicy, setHasConfirmedPolicy] = useState<boolean>(false);
  const [hasConfirmedRelayer, setHasConfirmedRelayer] = useState<boolean>(true);
  const [isTokenSelectorVisible, setIsTokenSelectorVisible] =
    useState<boolean>(false);
  const [userTokenBalance, setUserTokenBalance] = useState<BigNumber>(
    BigNumber.from('0')
  );
  const [salt, setSalt] = useState<string>(getRandomString(10));

  const fees = useMemo(() => {
    return (wager * feesPercentage) / 100;
  }, [wager]);

  const maxPayout = useMemo(() => {
    return wager * 2 - fees;
  }, [wager, fees]);

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
      moves,
      kickMovesSelected,
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
    if (!atLeastOneBlock) return alert('Your sequence must include a block');
    if (!hasConfirmedPolicy) return alert('Please tick the checkbox');

    if (moves.length <= 4) setMoves([]);
    else
      downloadTxt(
        new Date().toLocaleString() + '.txt',
        moves.toString() + ',' + salt
      );

    setIsSelectingMoves(false);
  }, [moves, hasConfirmedPolicy, salt, atLeastOneBlock]);

  const goBack = () => {
    setMoves([]);

    setIsSelectingMoves(false);
  };

  const handleCreate = useCallback(async () => {
    if (!signer || !accountAddress || !duelContract || !updateDuels) return;
    if (moves.length < 5) return;

    const identifier = ethers.utils.formatBytes32String(
      [...Array(30)].map(() => (~~(Math.random() * 36)).toString(36)).join('')
    );

    const encodedSalt = ethers.utils.formatBytes32String(salt);

    const numericMoves: number[] = [];
    moves.map((move) => {
      if (move === 'kick') numericMoves.push(1);
      else if (move === 'punch') numericMoves.push(0);
      else if (move === 'special') numericMoves.push(3);
      else numericMoves.push(2);
    });

    const _historicalMovesStringified = localStorage.getItem('moves');
    let _historicalMoves = [];
    if (_historicalMovesStringified) {
      _historicalMoves = JSON.parse(_historicalMovesStringified);
    }
    _historicalMoves.push(moves);

    localStorage.setItem('moves', JSON.stringify(_historicalMoves));

    let hash = ethers.utils.solidityKeccak256(
      [
        'bytes32',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'bytes32',
      ],
      [
        identifier,
        numericMoves[0],
        numericMoves[1],
        numericMoves[2],
        numericMoves[3],
        numericMoves[4],
        encodedSalt,
      ]
    );

    let movesSig = await signer.signMessage(ethers.utils.arrayify(hash));

    const finalTwoCharacters = movesSig.slice(-2);
    const initial = movesSig.slice(0, -2);

    if (finalTwoCharacters === '00') {
      movesSig = initial + '1b';
    } else if (finalTwoCharacters === '01') {
      movesSig = initial + '1c';
    }

    if (tokenName !== 'ETH') {
      const token = ERC20__factory.connect(
        contractAddresses[tokenName],
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

    if (hasConfirmedRelayer) {
      const duelId = await duelContract.duelCount();

      await fetch('https://dp-relay.dopex.io/submit', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duel_id: duelId,
          moves: numericMoves,
          salt: salt,
        }),
      });
    }

    try {
      await duelContract
        .connect(signer)
      ['createDuel'](
        identifier,
        getContractReadableAmount(
          wager,
          getTokenDecimals(tokenName, chainId)
        ),
        movesSig,
        {
          value:
            tokenName === 'ETH' ? getContractReadableAmount(wager, 18) : 0,
        }
      );
    } catch (err) {
      console.log(err);
      alert('Create duel tx fails');
    }

    setMoves([]);
    handleClose();
    setSalt(getRandomString(10));
    await updateDuels();
  }, [
    duelContract,
    handleClose,
    signer,
    accountAddress,
    updateDuels,
    salt,
    contractAddresses,
    tokenName,
    chainId,
    moves,
    wager,
    hasConfirmedRelayer,
  ]);

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

  const canCreate = useMemo(() => {
    if (moves.length < 5) return false;
    if (!atLeastOneBlock) return false;
    if (getUserReadableAmount(userTokenBalance, 18) < wager) return false;

    return true;
  }, [moves, userTokenBalance, wager, atLeastOneBlock]);

  const handleOpenTokenSelector = useCallback(
    () => setIsTokenSelectorVisible(true),
    []
  );

  const readableBalance = useMemo(() => {
    return getUserReadableAmount(
      userTokenBalance || BigNumber.from('0'),
      getTokenDecimals(tokenName, chainId)
    );
  }, [tokenName, chainId, userTokenBalance]);

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
      {isTokenSelectorVisible ? (
        <Box className="h-[52.8rem]">
          <TokenSelector
            open={isTokenSelectorVisible}
            setOpen={setIsTokenSelectorVisible}
            setFromTokenSymbol={setTokenName}
            isInDialog={true}
            tokensToExclude={[
              'USDC',
              'RDPX',
              'WBTC',
              'USDT',
              'GMX',
              'DAI',
              'JONES',
              'MAGIC',
              'GOHM',
              'DPX',
              'FRAX',
              'MIM',
            ]}
          />{' '}
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
                alt="Gamepad"
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
          <Box className="mt-8">
            <Typography
              variant="h6"
              className="text-white font-['Minecraft'] ml-3"
            >
              Your secret code is
            </Typography>
            <Typography variant="h6" className="text-white ml-3">
              <i>{salt}</i>
            </Typography>
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
          <Box
            className="flex mt-8"
            onClick={() => setHasConfirmedPolicy(!hasConfirmedPolicy)}
          >
            <Checkbox checked={hasConfirmedPolicy} />
            <Typography
              variant="h6"
              className="text-white font-['Minecraft'] cursor-pointer"
            >
              {' '}
              I confirm I have written down on paper the sequence of moves of
              this duel and the secret code and I understood if I forget it I
              will lose all my funds{' '}
            </Typography>
          </Box>
          <Box
            className="flex mt-8"
            onClick={() => setHasConfirmedRelayer(!hasConfirmedRelayer)}
          >
            <Checkbox checked={hasConfirmedRelayer} />
            <Typography
              variant="h6"
              className="text-white font-['Minecraft'] cursor-pointer"
            >
              {' '}
              I want to share my moves and secret code with an automated service
              offered by the OptionX team to automatically reveal my moves{' '}
            </Typography>
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
            <img
              src={'/images/nfts/pepes/create-duel-button.png'}
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
          <Box className="bg-[#232935] rounded-2xl flex flex-col mb-4 p-3 pr-2">
            <Box className="flex flex-row justify-between">
              <Box
                className="h-10 bg-[#181C24] rounded-full pl-1 pr-1 pt-0 pb-0 flex flex-row items-center cursor-pointer"
                onClick={handleOpenTokenSelector}
              >
                <Box className="flex flex-row h-10 pr-14">
                  <img
                    src={`/images/tokens/${tokenName.toLowerCase()}.svg`}
                    alt={tokenName}
                    className="w-8 h-8 mt-1"
                  />
                  <Typography
                    variant="h5"
                    className="text-stieglitz text-sm pl-1 pt-1 ml-1 mt-1"
                  >
                    {tokenName}
                  </Typography>
                  <IconButton
                    className="opacity-40 p-0 group-hover:opacity-70"
                    size="large"
                  >
                    <ArrowDropDownIcon className={'fill-gray-100'} />
                  </IconButton>
                </Box>
              </Box>
              <Select
                className="h-8 text-md text-white ml-2 mr-3 mt-1 font-mono"
                value={wager}
                label="Wager"
                onChange={(event) => setWager(Number(event.target.value))}
              >
                <MenuItem value={'0.05'}>0.05</MenuItem>
                <MenuItem value={'0.1'}>0.1</MenuItem>
                <MenuItem value={'0.2'}>0.2</MenuItem>
                <MenuItem value={'0.5'}>0.5</MenuItem>
                <MenuItem value={'1'}>1</MenuItem>
              </Select>
            </Box>
            <Box className="flex flex-row justify-between">
              <Box className="flex">
                <img
                  src="/images/nfts/pepes/crown.svg"
                  className="w-3 h-3 mt-auto mb-1 mr-0.5"
                  alt="Wager"
                />
                <Typography
                  variant="h6"
                  className="text-[#78859E] text-sm pl-1 pt-2"
                >
                  Wager
                </Typography>
              </Box>
              <Box className="ml-auto mr-0">
                <Typography variant="h6" className="text-sm pl-1 pt-2 pr-3">
                  <span className="text-[#78859E]">Balance: </span>
                  {formatAmount(readableBalance, 2)}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box className="bg-[#232935] rounded-2xl flex flex-col mb-4 px-3 py-3">
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
              payoutTokenName={tokenName}
              fees={fees}
            />
            <DuelExpiry
              text={
                'This duel will remain available for the next 12 hours to challenge.'
              }
            />
            <PepeButton
              action={handleCreate}
              text={'Create'}
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

export default CreateDuel;
