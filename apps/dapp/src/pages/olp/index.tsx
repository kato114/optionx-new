import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import axios from 'axios';
import { NextSeo } from 'next-seo';
import { useBoundStore } from 'store';

import Typography from 'components/UI/Typography';
import AppBar from 'components/common/AppBar';
import { OlpHome } from 'components/olp/OlpHome';

import { DOPEX_API_BASE_URL } from 'constants/env';
import seo from 'constants/seo';

const OLP_INTRO: string =
  'https://blog.dopex.io/articles/product-launches-updates/Option-Liquidity-Pools-Walkthrough';

export interface IOlpApi {
  underlyingSymbol: string;
  symbol: string;
  duration: string;
  chainId: number;
  address: string;
  hasCall: boolean;
  hasPut: boolean;
  utilization: number;
  tvl: number;
  expiry: number;
}

const Olp = () => {
  const { provider, tokenPrices } = useBoundStore();

  const [vaults, setVaults] = useState<{
    [key: string]: IOlpApi[];
  }>({});

  useEffect(() => {
    if (tokenPrices.length < 0 || !provider) {
      return;
    }
    async function getData() {
      let data = await axios
        .get(`${DOPEX_API_BASE_URL}/v2/olp`)
        .then((payload) => payload.data);
      setVaults(data);
    }
    getData();
  }, [provider, tokenPrices]);

  return (
    <Box className="min-h-screen">
      <NextSeo
        title={seo.olp.title}
        description={seo.olp.description}
        canonical={seo.olp.url}
        openGraph={{
          url: seo.olp.url,
          title: seo.olp.title,
          description: seo.olp.description,
          images: [
            {
              url: seo.olp.banner,
              width: seo.default.width,
              height: seo.default.height,
              alt: seo.olp.alt,
              type: 'image/png',
            },
          ],
        }}
      />
      <AppBar />
      <Box className="pt-1 pb-32 lg:max-w-6xl md:max-w-3xl sm:max-w-xl max-w-md mx-auto px-4 lg:px-0 min-h-screen">
        <Box className="pt-5 mx-auto">
          <OlpHome olps={vaults!} />
        </Box>
      </Box>
    </Box>
  );
};

export default Olp;
