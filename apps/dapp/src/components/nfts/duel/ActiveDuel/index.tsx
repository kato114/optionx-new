import React, { useMemo } from 'react';

import Box from '@mui/material/Box';
import Countdown from 'react-countdown';
import { useBoundStore } from 'store';

import { Duel } from 'store/Duel';

import Typography from 'components/UI/Typography';
import { PepeChildrenButton } from 'components/nfts/components/PepeButton';

import displayAddress from 'utils/general/displayAddress';

const ActiveDuel = ({
  duel,
  handleUndo,
  handleReveal,
  handleClaimForfeit,
}: {
  duel: Duel;
  handleUndo: Function;
  handleReveal: Function;
  handleClaimForfeit: Function;
}) => {
  const { accountAddress } = useBoundStore();

  const handleClick = () => {
    if (duel['status'] === 'requireUndo') handleUndo(duel['id']);
    else if (duel['status'] === 'requireReveal') handleReveal(duel);
    else if (duel['status'] === 'requireClaimForfeit')
      handleClaimForfeit(duel['id']);
  };

  const message = useMemo(() => {
    if (duel['status'] === 'waiting') return 'WAIT...';
    else if (duel['status'] === 'requireUndo') return 'UNDO';
    else if (duel['status'] === 'won') return 'YOU WON';
    else if (duel['status'] === 'lost') return 'YOU LOST';
    else if (
      duel['status'] === 'requireReveal' &&
      duel['duelistAddress'] === accountAddress
    )
      return 'REVEAL';
    else if (
      duel['status'] === 'requireReveal' &&
      duel['duelistAddress'] !== accountAddress
    )
      return 'WAIT REVEAL...';
    else if (duel['status'] === 'requireClaimForfeit') return 'CLAIM FORFEIT';
    else if (duel['status'] === 'waitClaimForfeit')
      return 'WAIT CLAIM FORFEIT...';
    else if (duel['status'] === 'forfeit') return 'FORFEIT';
    else return 'TIE';
  }, [duel, accountAddress]);

  const onImgSrcError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    event.currentTarget.src =
      'https://img.tofunft.com/v2/42161/0xede855ced3e5a59aaa267abdddb0db21ccfe5072/666/280/static.jpg';
  };

  return (
    <Box className="w-full flex p-5 bg-[#181C24] relative">
      <img
        src={`https://img.tofunft.com/v2/42161/0xede855ced3e5a59aaa267abdddb0db21ccfe5072/${duel['duelist']}/280/static.jpg`}
        className=" w-14 h-14 mt-1 mr-3 cursor-pointer"
        alt={'Duelist'}
        onError={onImgSrcError}
        onClick={() =>
          window.open('https://arbiscan.io/address/' + duel['duelistAddress'])
        }
      />
      <Box>
        <Typography
          variant="h4"
          className="font-['Minecraft'] relative z-1 mx-auto mt-1 ml-3 text-left text-white"
        >
          <span>Duel Mint</span>
        </Typography>
        <Typography
          variant="h4"
          className="text-[#78859E] font-['Minecraft'] relative z-1 mx-auto mt-1 ml-3 text-center"
        >
          <span>Diamond Pepe</span>
        </Typography>
      </Box>
      <Box className="ml-8">
        <Typography
          variant="h4"
          className="font-['Minecraft'] relative z-1 mx-auto mt-1 ml-3 text-left text-white"
        >
          <span>#{duel['id']}</span>
        </Typography>
        <Typography
          variant="h4"
          className="text-[#78859E] font-['Minecraft'] relative z-1 mx-auto mt-1 ml-3 text-center"
        >
          <span>Duel ID</span>
        </Typography>
      </Box>
      <Box className="ml-10 mt-2 mr-8">
        <Box className="flex">
          {duel['isRevealed'] ? (
            duel['duelistMoves'].map((move, i) => (
              <img
                key={i}
                src={`/images/nfts/pepes/${move}.png`}
                alt={move}
                className={
                  'w-4 h-4 ' +
                  (i < duel['duelistMoves'].length - 1 ? 'mr-1' : '')
                }
              />
            ))
          ) : (
            <Box className="flex">
              <img
                src="/images/nfts/pepes/help-center.png"
                className="w-4 h-4 mr-1"
                alt="?"
              />
              <img
                src="/images/nfts/pepes/help-center.png"
                className="w-4 h-4 mr-1"
                alt="?"
              />
              <img
                src="/images/nfts/pepes/help-center.png"
                className="w-4 h-4 mr-1"
                alt="?"
              />
              <img
                src="/images/nfts/pepes/help-center.png"
                className="w-4 h-4"
                alt="?"
              />
            </Box>
          )}
        </Box>
        <Typography
          variant="h4"
          className="text-[#78859E] font-['Minecraft'] relative z-1 mx-auto mt-3 ml-1 text-left"
        >
          <span>Moves</span>
        </Typography>
      </Box>

      <Box className="ml-auto mr-auto mt-2.5">
        <PepeChildrenButton
          className=""
          action={handleClick}
          disabled={['forfeit', 'tie', 'won', 'lost', 'waiting'].includes(
            duel['status']
          )}
        >
          {message}
          {duel['status'] === 'requireReveal' ? (
            <Countdown
              date={
                new Date(duel['challengedDate'].getTime() + 3600 * 4 * 1000)
              }
              renderer={({ days, hours, minutes }) => {
                return (
                  <Box className="flex">
                    <img
                      src="/assets/timer.svg"
                      className="h-[0.9rem] mr-2 ml-1"
                      alt="Timer"
                    />
                    <Typography
                      variant="caption"
                      className="ml-auto text-stieglitz mr-1"
                    >
                      {days}d {hours}h {minutes}m
                    </Typography>
                  </Box>
                );
              }}
            />
          ) : null}
        </PepeChildrenButton>
      </Box>

      <Box className="ml-4 mt-2">
        {duel['challengerMoves']?.length === 5 ? (
          <Box className="flex">
            {duel['challengerMoves'].map((move, i) => (
              <img
                key={i}
                src={`/images/nfts/pepes/${move}.png`}
                className="w-4 h-4 mr-1"
                alt="?"
              />
            ))}
          </Box>
        ) : (
          <Box className="flex">
            <img
              src="/images/nfts/pepes/help-center.png"
              className="w-4 h-4 mr-1"
              alt="?"
            />
            <img
              src="/images/nfts/pepes/help-center.png"
              className="w-4 h-4 mr-1"
              alt="?"
            />
            <img
              src="/images/nfts/pepes/help-center.png"
              className="w-4 h-4 mr-1"
              alt="?"
            />
            <img
              src="/images/nfts/pepes/help-center.png"
              className="w-4 h-4"
              alt="?"
            />
          </Box>
        )}

        <Typography
          variant="h4"
          className="text-[#78859E] font-['Minecraft'] relative z-1 mx-auto mt-3 ml-1 text-right"
        >
          <span>Moves</span>
        </Typography>
      </Box>
      <Box className="ml-8">
        <Typography
          variant="h4"
          className="font-['Minecraft'] relative z-1 mx-auto mt-1 ml-3 text-left text-white"
        >
          <span>{displayAddress(duel['challengerAddress'])}</span>
        </Typography>
        <Typography
          variant="h4"
          className="text-[#78859E] font-['Minecraft'] relative z-1 mx-auto mt-1 ml-3 text-center"
        >
          <span>Opponent</span>
        </Typography>
      </Box>
      <Box className="ml-5">
        <Typography
          variant="h4"
          className="font-['Minecraft'] relative z-1 mx-auto mt-1 ml-3 text-right text-white"
        >
          <span>{duel['challengerAddress'] === '?' ? '?' : 'Duel Mint'}</span>
        </Typography>
        <Typography
          variant="h4"
          className="text-[#78859E] font-['Minecraft'] relative z-1 mx-auto mt-1 ml-3 text-center"
        >
          <span>Diamond Pepe</span>
        </Typography>
      </Box>
      <img
        src={
          duel['challengerAddress'] === '?'
            ? '/images/nfts/pepes/pepe-frame-1.png'
            : `https://img.tofunft.com/v2/42161/0xede855ced3e5a59aaa267abdddb0db21ccfe5072/${duel['challenger']}/280/static.jpg`
        }
        onError={onImgSrcError}
        alt={duel['challengerAddress']}
        className=" w-14 h-14 ml-6 mt-1"
        onClick={() =>
          window.open(
            duel['challengerAddress'] === '?'
              ? '#'
              : 'https://arbiscan.io/address/' + duel['challengerAddress']
          )
        }
      />

      {['won', 'lost'].includes(duel['status']) && !duel['isCreatorWinner'] ? (
        <Box className="absolute px-3 py-1 flex  right-[12rem] top-[5.5rem] bg-[#FFD50B]">
          <img
            src="/images/nfts/pepes/crown.svg"
            className="w-4 h-4 mr-1 mt-0.5"
            alt="?"
          />
          <Typography variant="h6">
            <span className="font-['Minecraft'] text-black">WINNER</span>
          </Typography>
        </Box>
      ) : null}

      {['won', 'lost'].includes(duel['status']) && duel['isCreatorWinner'] ? (
        <Box className="absolute px-3 py-1 flex  right-[12rem] top-[5.5rem] bg-[#FF2727]">
          <img
            src="/images/misc/fire.svg"
            className="w-4 h-4 mr-1 mt-0.5"
            alt="?"
          />
          <Typography variant="h6">
            <span className="font-['Minecraft'] text-[#FFD50B]">REKT</span>
          </Typography>
        </Box>
      ) : null}

      {!duel['isRevealed'] ? (
        <Box className="absolute bg-[#343C4D] px-3 py-1 flex  right-[12rem] top-[5.5rem]">
          <img
            src="/assets/timer.svg"
            className="h-[1rem] mt-0.5 mr-2 ml-1"
            alt="Timer"
          />
          <Typography variant="h6">
            <span className="text-wave-blue font-['Minecraft']">
              {duel['challengerAddress'] !== '?' ? (
                <Countdown
                  date={duel['finishDate']}
                  renderer={({ hours, minutes }) => {
                    return (
                      <Box className={'flex'}>
                        <Typography
                          variant="h5"
                          className="ml-auto text-stieglitz mr-1"
                        >
                          {hours}h {minutes}m
                        </Typography>
                      </Box>
                    );
                  }}
                />
              ) : (
                'Not started'
              )}
            </span>
          </Typography>
        </Box>
      ) : null}

      <Box className="absolute bg-[#343C4D] px-3 py-1 flex  right-[3rem] top-[5.5rem]">
        <Typography variant="h6">
          <span className="font-['Minecraft']">CHALLENGER</span>
        </Typography>
      </Box>

      <Box className="absolute bg-[#343C4D] px-3 py-1 flex  right-[3rem] top-[5.5rem]">
        <Typography variant="h6">
          <span className="font-['Minecraft']">CHALLENGER</span>
        </Typography>
      </Box>

      <Box className="absolute bg-[#343C4D] px-3 py-1 flex  right-[47%] top-[-1rem]">
        <img
          src="/images/misc/diamond.svg"
          className="w-4 h-4 mr-1 mt-1"
          alt="Diamond"
        />
        <Typography variant="h6">
          <span className="font-['Minecraft'] text-stieglitz">
            <span className="text-white">{duel['wager']} </span>
            {duel['tokenName']}
          </span>
        </Typography>
      </Box>

      <Box className="absolute bg-[#343C4D] px-3 py-1 flex  left-[3rem] top-[5.5rem]">
        <Typography variant="h6">
          <span className="font-['Minecraft']">DUELIST</span>
        </Typography>
      </Box>

      {['won', 'lost'].includes(duel['status']) && duel['isCreatorWinner'] ? (
        <Box className="absolute px-3 py-1 flex  left-[9.5rem] top-[5.5rem] bg-[#FFD50B]">
          <img
            src="/images/nfts/pepes/crown.svg"
            className="w-4 h-4 mr-1 mt-0.5"
            alt="Winner"
          />
          <Typography variant="h6">
            <span className="font-['Minecraft'] text-black">WINNER</span>
          </Typography>
        </Box>
      ) : null}

      {['won', 'lost'].includes(duel['status']) && !duel['isCreatorWinner'] ? (
        <Box className="absolute px-3 py-1 flex  left-[9.5rem] top-[5.5rem] bg-[#FF2727]">
          <img
            src="/images/misc/fire.svg"
            className="w-4 h-4 mr-1 mt-0.5"
            alt="Rekt"
          />
          <Typography variant="h6">
            <span className="font-['Minecraft'] text-[#FFD50B]">REKT</span>
          </Typography>
        </Box>
      ) : null}

      {!duel['isRevealed'] ? (
        <Box className="absolute px-3 py-1 flex  left-[9.5rem] top-[5.5rem] bg-[#343C4D]">
          <img
            src="/assets/timer.svg"
            className="h-[1rem] mt-0.5 mr-2 ml-1"
            alt="Timer"
          />
          <Typography variant="h6">
            <span className="text-wave-blue font-['Minecraft']">
              {duel['challengerAddress'] !== '?' ? (
                <Countdown
                  date={duel['finishDate']}
                  renderer={({ hours, minutes }) => {
                    return (
                      <Box className={'flex'}>
                        <Typography
                          variant="h5"
                          className="ml-auto text-stieglitz mr-1"
                        >
                          {hours}h {minutes}m
                        </Typography>
                      </Box>
                    );
                  }}
                />
              ) : (
                'Not started'
              )}
            </span>
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
};

export default ActiveDuel;
