import cx from 'classnames';

import useClammStore from 'hooks/clamm/useClammStore';

const FilterPanel = () => {
  const { setIsTrade, setIsPut, isTrade, isPut } = useClammStore();

  return (
    <div className="m-[12px] h-[30px] flex items-center justify-between space-x-[12px] w-full">
      <div className=" h-[32px] bg-mineshaft flex items-center justify-center space-x-[4px] p-[4px]">
        <div
          role="button"
          onClick={() => setIsPut(false)}
          className={`h-full flex items-center justify-center`}
        >
          <span
            className={cx(
              !isPut && 'bg-carbon',
              'p-[4px]  font-medium text-[13px]',
            )}
          >
            Calls
          </span>
        </div>
        <div
          role="button"
          onClick={() => setIsPut(true)}
          className="h-full flex items-center justify-center"
        >
          <span
            className={cx(
              isPut && 'bg-carbon',
              'p-[4px]  font-medium text-[13px]',
            )}
          >
            Puts
          </span>
        </div>
      </div>
      <span className="text-jaffa text-xs  w-full ">
        Liquidity less than 1$ will not be displayed
      </span>
    </div>
  );
};

export default FilterPanel;
