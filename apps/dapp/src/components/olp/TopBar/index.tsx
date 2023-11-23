import { useCallback, useMemo, useState } from 'react';

import {
  Avatar,
  Box,
  IconButton,
  MenuItem,
  Menu as MuiMenu,
} from '@mui/material';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';

import useWindowSize from 'hooks/useWindowSize';
import { useBoundStore } from 'store';

import Typography from 'components/UI/Typography';

import { getReadableTime } from 'utils/contracts';

const IS_BETA: boolean = true;

const TopBar = () => {
  const {
    olpData,
    updateOlpEpochData,
    updateOlpUserData,
    setSelectedEpoch,
    selectedEpoch,
    tokenPrices,
  } = useBoundStore();

  const { width } = useWindowSize();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSelectChange = useCallback(
    async (e: { target: { value: any } }) => {
      if (setSelectedEpoch) {
        setSelectedEpoch(Number(e.target.value));
        await updateOlpEpochData();
        await updateOlpUserData();
      }
    },
    [setSelectedEpoch, updateOlpUserData, updateOlpEpochData]
  );

  const underlyingSymbol = olpData?.underlyingSymbol;

  const tokenPrice =
    tokenPrices.find((token) => token.name === underlyingSymbol)?.price || 0;

  const expiries = useMemo(() => {
    if (!olpData?.expiries) return [];
    return olpData.expiries.map((expiry, index) => {
      return (
        <MenuItem
          key={index}
          onClick={() => {
            setAnchorEl(null);
            handleSelectChange({ target: { value: index } });
          }}
        >
          {getReadableTime(expiry)}
        </MenuItem>
      );
    });
  }, [olpData?.expiries, handleSelectChange]);

  return (
    <Box className="flex flex-wrap flex-row bg-cod-gray border-radius ">
      <Box
        className={`${width > 500 ? 'w-[17rem]' : 'w-full'
          } flex-grow-1 flex justify-between py-1 px-2 pl-0`}
      >
        <Box className="flex items-center">
          <Box sx={{ p: 1 }} className="flex -space-x-4">
            <img
              className="w-8 h-8 z-10 border border-gray-500 rounded-full"
              src={`/images/tokens/${underlyingSymbol?.toLowerCase()}.svg`}
              alt={underlyingSymbol}
            />
            <img
              className="w-8 h-8 z-0"
              src="/images/tokens/usdc.svg"
              alt="USDC.e"
            />
          </Box>
          <Box className="ml-1">
            <Typography variant="h6">Options LP</Typography>
            <Typography variant="h6" className="text-gray-500">
              {underlyingSymbol}
            </Typography>
          </Box>
        </Box>
        {IS_BETA && (
          <Typography
            variant="h6"
            className="mt-1.5 bg-primary  p-2 font-bold h-[fit-content] mr-1"
          >
            BETA
          </Typography>
        )}
      </Box>

      <Box
        className={`${width > 500 ? 'w-[17rem]' : 'w-full'
          } flex-grow-1 px-2 border border-umbra`}
      >
        <Box className="flex flex-row justify-between p-2">
          <Box>
            <Typography variant="h6">
              {getReadableTime(olpData?.expiries[selectedEpoch]!)}
            </Typography>
            <Typography color="stieglitz" variant="h6">
              SSOV Expiry
            </Typography>
          </Box>
          <IconButton
            className="p-0"
            onClick={(e) => {
              setAnchorEl(e.currentTarget);
            }}
          >
            <Avatar className="fill-current bg-mineshaft p-0 w-[20px] h-[20px]">
              {anchorEl ? (
                <ArrowDropUpIcon
                  sx={{
                    color: 'black',
                  }}
                />
              ) : (
                <ArrowDropDownIcon
                  sx={{
                    color: 'black',
                  }}
                />
              )}
            </Avatar>
          </IconButton>
          <MuiMenu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            sx={{
              '& .MuiPaper-root': {
                backgroundColor: '#1E1E1E',
                minWidth: '19.5rem',
                marginTop: '1rem',
              },
              '& .MuiMenuItem-root': {
                color: 'white',
                fontSize: '14px',
                '&:hover': {
                  color: 'white',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                },
                marginLeft: '-0.25rem',
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          >
            {expiries}
          </MuiMenu>
        </Box>
      </Box>

      <Box className="w-[7rem] flex flex-grow-0 p-2">
        <Box className="flex flex-row ml-2">
          <Box>
            <Typography variant="h6">{`$${tokenPrice}`}</Typography>
            <Typography color="stieglitz" variant="h6">
              Price
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TopBar;
