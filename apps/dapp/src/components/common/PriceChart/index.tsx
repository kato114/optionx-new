import { useEffect, useRef } from 'react';

import { Skeleton } from '@dopex-io/ui';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import cx from 'classnames';
import { ColorType, createChart } from 'lightweight-charts';

import { TOKEN_DATA } from 'constants/tokens';

const PriceChart = ({
  market,
  className,
}: {
  market: string;
  className?: string;
}) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const query = useQuery({
    queryFn: () =>
      axios.get(
        `https://api.coingecko.com/api/v3/coins/${TOKEN_DATA[market].cgId}/market_chart?vs_currency=usd&days=30`,
      ),
    queryKey: [market, 'coingecko-historic-pricing'],
  });

  useEffect(() => {
    if (!chartContainerRef.current || query.isFetching) return;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: {
          type: ColorType.Solid,
          color: 'black',
        },
        textColor: '#D9D9D9',
      },
      watermark: {
        color: 'rgba(0, 0, 0, 0)',
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          color: 'false',
        },
      },
    });

    chart.timeScale().fitContent();

    const areaSeries = chart.addAreaSeries({
      topColor: 'rgba(33, 150, 243, 0.56)',
      bottomColor: 'rgba(33, 150, 243, 0.04)',
      lineColor: 'rgba(33, 150, 243, 1)',
      lineWidth: 2,
    });

    const data = query?.data?.data.prices.map((price: any) => {
      return {
        time: Number((price[0] / 1000).toFixed(0)),
        value: price[1],
      };
    });

    areaSeries.setData(data);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      chart.remove();
    };
  }, [query]);

  return (
    <div className={cx('h-[520px]', className)}>
      {query.isFetched ? (
        <div
          ref={chartContainerRef}
          className="m-3  h-full w-full relative"
        >
          <a
            href="https://www.tradingview.com/"

            className="absolute z-10 p-2 bottom-8 left-2 flex text-xs rounded-full bg-[#2196f3] bg-opacity-50 text-white hover:bg-opacity-40 ease-in duration-200"
            rel="noopener noreferrer"
          >
            Powered by
            <img
              src="/images/brand/trading-view.svg"
              alt="trading-view"
              height="18"
              width="18"
              className="m-1"
            />
          </a>
        </div>
      ) : (
        <Skeleton width={'100%'} height={'100%'} />
      )}
    </div>
  );
};

export default PriceChart;
