import React from 'react';

import FilterPanel from './components/FilterPanel';
import StrikesTable from './components/StrikesTable';

const StrikesChain = () => {
  return (
    <div className="w-full bg-cod-gray flex flex-col ">
      <FilterPanel />
      <StrikesTable />
    </div>
  );
};

export default StrikesChain;
