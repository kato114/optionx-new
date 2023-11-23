import { useEffect } from 'react';

import Head from 'next/head';

import axios from 'axios';

import PageLoader from 'components/common/PageLoader';
import AppBar from 'components/common/AppBar';
import { useBoundStore } from 'store';

const Home = () => {
  const { accountAddress, portfolioData } = useBoundStore();
  console.log("kato", accountAddress)

  return (
    <div>
      <div className="min-h-screen bg-[url('/images/backgrounds/darkness.jpg')]">
        <Head>
          <title>OptionX</title>
          <AppBar />
        </Head>
      </div>
    </div>
  );
};

export default Home;
