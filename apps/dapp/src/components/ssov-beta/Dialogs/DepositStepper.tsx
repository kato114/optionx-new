import { useCallback, useEffect, useState } from 'react';
import { Address } from 'viem';

import CircularProgress from '@mui/material/CircularProgress';
import Step from '@mui/material/Step';
import StepContent from '@mui/material/StepContent';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';

import { Button, Dialog } from '@dopex-io/ui';
import { useChainId, useContractWrite, useWaitForTransaction } from 'wagmi';

import {
  usePrepareDeposit,
  usePrepareStake,
} from 'hooks/ssov/usePrepareWrites';

import { smartTrim } from 'utils/general';

import { CHAINS } from 'constants/chains';

interface Props {
  isOpen: boolean;
  handleClose: () => void;
  data: {
    token: Address;
    vault: Address;
    strikeIndex: bigint;
    amount: bigint;
    to: Address;
  };
}

const DepositStepper = ({ isOpen = false, handleClose, data }: Props) => {
  const [step, setStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenId, setTokenId] = useState<bigint>();

  const depositConfig = usePrepareDeposit({
    ssov: data.vault,
    strikeIndex: data.strikeIndex,
    amount: data.amount,
    to: data.to,
  });
  const stakeConfig = usePrepareStake({
    ssov: data.vault,
    tokenId: tokenId as bigint,
    receiver: data.to,
  });
  const chainId = useChainId();
  const {
    write: deposit,
    isError: depositError,
    isLoading: depositLoading,
    isSuccess: depositSuccess,
    data: depositTxData,
  } = useContractWrite(depositConfig);
  const {
    write: stake,
    isError: stakeError,
    isLoading: stakeLoading,
    isSuccess: stakeSuccess,
  } = useContractWrite(stakeConfig);

  const { data: txReceipt } = useWaitForTransaction({
    hash: depositTxData?.hash,
  });

  const handleNext = () => {
    setStep((prevStep) => prevStep + 1);
  };

  const handleDeposit = useCallback(() => {
    deposit?.();
    if (depositSuccess) {
      setTokenId(BigInt(Number(txReceipt?.logs[4].data)));
      handleNext();
    }
  }, [deposit, depositSuccess, txReceipt]);

  const handleStake = useCallback(() => {
    if (!txReceipt || !stake) return;
    stake?.();
    if (stakeSuccess) handleNext();
  }, [stake, stakeSuccess, txReceipt]);

  const steps = [
    {
      label: 'Deposit',
      description:
        'This transaction will deposit (lock) your tokens into the SSOV till expiry.',
      buttonLabel: 'Deposit',
      action: handleDeposit,
    },
    {
      label: 'Stake',
      description:
        'This transaction will stake your SSOV position to accrue rewards till expiry.',
      buttonLabel: 'Stake',
      action: handleStake,
    },
  ];

  useEffect(() => {
    if (depositError) {
      setStep(0);
    } else if (stakeError) {
      setStep(1);
    }
  }, [depositError, stakeError]);

  useEffect(() => {
    if (depositSuccess) {
      setStep(1);
    }
    if (stakeSuccess) {
      setStep(2);
    }
  }, [depositSuccess, stakeSuccess]);

  useEffect(() => {
    setLoading(depositLoading || stakeLoading);
  }, [depositLoading, stakeLoading]);

  useEffect(() => {
    if (!txReceipt) return;
    setTokenId(
      BigInt(Number(txReceipt.logs[txReceipt.logs.length - 1].data || 0)),
    );
  }, [txReceipt]);

  return (
    <Dialog
      title="Deposit"
      isOpen={isOpen}
      handleClose={handleClose}
      showCloseIcon
    >
      <Stepper activeStep={step} orientation="vertical" className="mb-3">
        {steps.map((step) => (
          <Step key={step.label}>
            <StepLabel>
              <span className="text-white">{step.label}</span>
            </StepLabel>
            <StepContent>
              <p className="text-white mb-3">{step.description}</p>
              <Button
                variant="contained"
                onClick={step.action}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress className="text-white mr-1" size={16} />
                ) : null}{' '}
                {step.buttonLabel}
              </Button>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      {step > 2 ? (
        <div className="flex flex-col w-full text-center p-3">
          <p className="text-lg">
            You Have Successfully Deposited into the SSOV!
          </p>
          <a
            className="break-all hover:underline"

            rel="noopener noreferrer"
            href={`${CHAINS[chainId]?.explorer}tx/${txReceipt?.transactionHash}`}
          >
            Tx Hash: {smartTrim(String(txReceipt?.transactionHash), 10)}
          </a>
        </div>
      ) : null}
    </Dialog>
  );
};

export default DepositStepper;
