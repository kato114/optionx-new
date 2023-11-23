import { useEffect } from 'react';

import Box from '@mui/material/Box';

import { useBoundStore } from 'store';

import PageLoader from 'components/common/PageLoader';
import DepositPanel from 'components/ssov/DepositPanel';
import Description from 'components/ssov/Description';
import ExerciseList from 'components/ssov/ExerciseList';
import Stats from 'components/ssov/Stats';
import WritePositions from 'components/ssov/WritePositions';
import Typography from 'components/UI/Typography';

import { CHAINS } from 'constants/chains';

const Manage = (props: { ssov: string }) => {
  const { ssov } = props;
  const {
    chainId,
    ssovData,
    ssovEpochData,
    ssovV3UserData: ssovUserData,
    setSelectedPoolName,
    selectedPoolName,
    updateSsovV3,
    updateSsovV3Signer,
    updateSsovV3UserData,
    updateSsovV3EpochData,
    signer,
  } = useBoundStore();

  useEffect(() => {
    if (!ssovEpochData) return;
    updateSsovV3Signer();
  }, [signer, updateSsovV3Signer, selectedPoolName, chainId, ssovEpochData]);

  useEffect(() => {
    updateSsovV3();
  }, [updateSsovV3, selectedPoolName, chainId]);

  useEffect(() => {
    if (!ssovData) return;
    updateSsovV3EpochData();
  }, [ssovData, updateSsovV3EpochData, chainId]);

  useEffect(() => {
    updateSsovV3UserData();
  }, [ssovEpochData, updateSsovV3UserData, chainId]);

  useEffect(() => {
    setSelectedPoolName(ssov);
  }, [ssov, setSelectedPoolName]);

  if (ssovData === undefined || ssovEpochData === undefined)
    return (
      <Box className="overflow-x-hidden bg-black h-screen">
        <PageLoader />
      </Box>
    );

  return (
    <Box className="py-12 lg:max-w-5xl md:max-w-3xl sm:max-w-xl max-w-md mx-auto px-4 lg:px-0">
      <Box className="flex flex-col">
        <Box className="flex md:flex-row flex-col mb-4 md:justify-between items-center md:items-start">
          <Description ssovData={ssovData} ssovEpochData={ssovEpochData} />
          <DepositPanel />
        </Box>
        <Stats className="mb-4" />
        {ssovUserData === undefined ? null : (
          <>
            <WritePositions className="mb-4" />
            <ExerciseList />
          </>
        )}
      </Box>
    </Box>
  );
};

export default Manage;
