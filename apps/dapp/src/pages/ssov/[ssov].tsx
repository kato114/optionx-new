import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { NextSeo } from 'next-seo';

import AppBar from 'components/common/AppBar';
import Manage from 'components/ssov/Manage';

import seo from 'constants/seo';

import { useBoundStore } from 'store';
import { DEFAULT_CHAIN_ID } from 'constants/env';

const SsovV3Page = () => {
  const { updateState } = useBoundStore();
  useEffect(() => {
    updateState({
      chainId: DEFAULT_CHAIN_ID,
      accountAddress: "0x0d882f4a470c9131a92Bb4e456FA2ca36beF116c",
    });
  }, []);

  const router = useRouter();
  const ssovQuery = router.query['ssov'];
  const ssov = ssovQuery as unknown as string;

  return (
    <div className="overflow-x-hidden bg-black h-screen">
      <NextSeo
        title={`${ssov} ${seo.ssov.title}`}
        description={seo.ssov.description}
        canonical={seo.ssov.url}
        openGraph={{
          url: seo.ssov.url,
          title: seo.ssov.title,
          description: seo.ssov.description,
          images: [
            {
              url: seo.ssov.banner,
              width: seo.default.width,
              height: seo.default.height,
              alt: seo.ssov.alt,
              type: 'image/png',
            },
          ],
        }}
      />
      <AppBar />
      <Manage ssov={ssov} />
    </div>
  );
};

export default SsovV3Page;
