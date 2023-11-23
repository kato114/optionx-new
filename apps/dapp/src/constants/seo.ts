import { HOST_URL } from 'constants/env';

const seo = {
  ssov: {
    url: `${HOST_URL}/ssov`,
    banner:
      'https://res.cloudinary.com/dxitdndu3/image/upload/v1684326255/dopex_images/preview_images/ssov_rbhar7.png',
    alt: 'SSOV',
    title: 'SSOV | OptionX Single Staking Options Vault',
    description:
      'Buy options to trade volatility or write options to earn premiums and rewards',
  },
  straddles: {
    url: `${HOST_URL}/straddles`,
    banner:
      'https://res.cloudinary.com/dxitdndu3/image/upload/v1684326260/dopex_images/preview_images/straddles_zpcdyo.png',
    alt: 'Straddles',
    title: 'OptionX Atlantic Straddles',
    description:
      'Buy straddles to trade bi-directional volatility or write Atlantic Puts to earn premiums and funding',
  },
  vedpx: {
    url: `${HOST_URL}/governance/vedpx`,
    banner:
      'https://res.cloudinary.com/dxitdndu3/image/upload/v1685374223/dopex_images/preview_images/vedpx_ou2nyt.png',
    alt: 'veDPX',
    title: 'veDPX | Escrowed DPX',
    description: 'Lock $DPX to earn yield, fees, and vote',
  },
  portfolio: {
    url: `${HOST_URL}/portfolio`,
    banner:
      'https://res.cloudinary.com/dxitdndu3/image/upload/v1684326256/dopex_images/preview_images/portfolio_iakwvl.png',
    alt: 'Portfolio',
    title: 'Portfolio Page',
    description: 'Check your OptionX positions',
  },
  tzwap: {
    url: `${HOST_URL}/tzwap`,
    banner:
      'https://res.cloudinary.com/dxitdndu3/image/upload/v1685374223/dopex_images/preview_images/tzwap_f2gmgz.png',
    alt: 'Tzwap',
    title: 'Tzwap',
    description:
      'Create customizable TWAP buy/sell orders to minimize slippage on high volume transactions',
  },
  farms: {
    url: `${HOST_URL}/farms`,
    banner:
      'https://res.cloudinary.com/dxitdndu3/image/upload/v1684326256/dopex_images/preview_images/farms_j9woij.png',
    alt: 'Farms',
    title: 'OptionX Yield Farms',
    description: 'Stake your LP tokens to earn rewards',
  },
  olp: {
    url: `${HOST_URL}/olp`,
    banner:
      'https://res.cloudinary.com/dxitdndu3/image/upload/v1684326254/dopex_images/preview_images/olp_umbar0.png',
    alt: 'OLP',
    title: 'OLP | OptionX Option Liquidity Pools',
    description:
      'Exit your SSOV positions mid-epoch or provide liquidity to purchase calls and puts at a discount',
  },
  bonds: {
    url: `${HOST_URL}/dpx-bonds`,
    banner:
      'https://res.cloudinary.com/dxitdndu3/image/upload/v1684326253/dopex_images/preview_images/dpx-bonds_ihgulw.png',
    alt: 'OptionX Bonds',
    title: 'OptionX Bonds',
    description: 'Commit $USDC.e to receive $DPX at a discount',
  },
  ssovBeta: {
    url: `${HOST_URL}/ssov-beta`,
    banner:
      'https://res.cloudinary.com/dxitdndu3/image/upload/v1684326255/dopex_images/preview_images/default_qfq5rc.png',
    alt: 'SSOV Beta',
    title: 'SSOV Beta | OptionX',
    description: 'Buy/Sell vanilla options from the SSOVs',
  },
  clamm: {
    url: `${HOST_URL}/clamm`,
    banner:
      'https://res.cloudinary.com/dxitdndu3/image/upload/v1684326255/dopex_images/preview_images/default_qfq5rc.png',
    alt: 'CLAMM',
    title: 'CLAMM | OptionX',
    description: 'Options pools powered by CLAMM liquidity',
  },
  default: {
    url: HOST_URL,
    title: 'OptionX',
    description:
      'OptionX is a maximum liquidity and minimal exposure options protocol',
    alt: 'Default',
    banner:
      'https://res.cloudinary.com/dxitdndu3/image/upload/v1684326255/dopex_images/preview_images/default_qfq5rc.png',
    width: 800,
    height: 450,
  },
};

export default seo;
