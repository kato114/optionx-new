import React, { ReactNode, useCallback, useMemo, useState } from 'react';

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import { styled } from '@mui/material/styles';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import isEmpty from 'lodash/isEmpty';
import sortBy from 'lodash/sortBy';
import { IOlpApi } from 'pages/olp';

import {
  StyleLeftTableCell,
  StyleRightTableCell,
  StyleTableCell,
} from 'components/common/LpCommon/Table';
import SsovFilter from 'components/ssov/SsovFilter';
import { TablePaginationActions, Typography } from 'components/UI';

import { getReadableTime } from 'utils/contracts';

import { CHAINS } from 'constants/chains';
import { DEFAULT_CHAIN_ID } from 'constants/env';

import { FeaturedOlp } from './FeaturedOlp';
import { OlpTableRow } from './OlpTableRow';

const ROWS_PER_PAGE: number = 5;

const StyleSecondHeaderTable = styled(TableContainer)`
  table {
    border-collapse: separate !important;
    border-spacing: 0;
  }
`;

interface HeaderCellInterface {
  children: ReactNode;
}

const StyleTableCellHeader = (props: HeaderCellInterface) => {
  const { children } = props;
  return (
    <StyleTableCell align="left">
      <Typography variant="h6" color="stieglitz">
        {children}
      </Typography>
    </StyleTableCell>
  );
};

const FEATURED_OLPS: string[] = ['DPX-MONTHLY', 'ARB-MONTHLY', 'DPX-WEEKLY'];

export const OlpHome = ({ olps }: { olps: Record<string, IOlpApi[]> }) => {
  const chainIds: string[] = Object.keys(olps ?? []);

  const [selectedOlpMarkets, setSelectedOlpMarkets] = useState<string[]>([]);
  const [selectedOlpExpiries, setSelectedOlpExpiries] = useState<string[]>([]);
  const [selectedOlpNetworks, setSelectedOlpNetworks] = useState<string[]>([]);
  const [page, setPage] = useState<number>(0);
  const [sortByTvl, setSortByTvl] = useState<boolean>(true);

  const olpMarkets = useMemo(() => {
    if (!olps) return [];
    return [
      ...new Set(
        Object.keys(olps)
          .map((chainId) => olps[chainId]?.map((o) => o.underlyingSymbol) ?? '')
          .flat(),
      ),
    ];
  }, [olps]);

  const olpExpiries = useMemo(() => {
    if (!olps) return [];
    const expiries = [
      ...new Set(chainIds?.map((c) => olps[c]?.map((o) => o.expiry)).flat()),
    ];

    if (!expiries) return [];

    return sortBy(expiries)?.map((o) => getReadableTime(o!));
  }, [olps, chainIds]);

  const olpNetworks = useMemo(() => {
    if (!olps) return [];
    return chainIds.map((c) => CHAINS[Number(c)]?.name || '');
  }, [olps, chainIds]);

  const filteredMarket = useMemo(() => {
    if (!olps) return [];

    let filtered: IOlpApi[] = Object.values(olps).flat();

    if (!isEmpty(selectedOlpNetworks)) {
      filtered = filtered.filter((o) =>
        selectedOlpNetworks.includes(CHAINS[o.chainId!]?.name || ''),
      );
    }

    if (!isEmpty(selectedOlpExpiries)) {
      filtered = filtered.filter((o) => {
        return selectedOlpExpiries.includes(getReadableTime(o?.expiry!));
      });
    }

    if (!isEmpty(selectedOlpMarkets)) {
      filtered = filtered.filter((o) =>
        selectedOlpMarkets.includes(o.underlyingSymbol),
      );
    }

    return sortByTvl
      ? filtered.sort((a: IOlpApi, b: IOlpApi) => (a.tvl < b.tvl ? 1 : -1))
      : filtered.sort((a: IOlpApi, b: IOlpApi) => (a.tvl > b.tvl ? 1 : -1));
  }, [
    olps,
    selectedOlpMarkets,
    selectedOlpExpiries,
    selectedOlpNetworks,
    sortByTvl,
  ]);

  const handleChangePage = useCallback(
    (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      setPage(newPage);
    },
    [setPage],
  );

  return (
    <Box className="flex flex-col flex-grow w-full">
      <Typography variant="h5" color="white">
        Featured
      </Typography>
      <Box className="flex mt-2 flex-col space-x-0 space-y-6 lg:flex-row lg:space-x-6 lg:space-y-0">
        {olps[DEFAULT_CHAIN_ID]?.filter((o) =>
          FEATURED_OLPS.includes(o.symbol),
        ).map((o, idx) => <FeaturedOlp key={idx} olp={o} />)}
      </Box>
      <Typography variant="h5" color="white" className="my-3 mt-8">
        All Options LP
      </Typography>
      <Paper sx={{ width: '100%', overflow: 'hidden', background: 'black' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  className="flex"
                  sx={{
                    border: '1px solid #1e1e1e',
                    borderBottom: '0px',
                    padding: '1px',
                  }}
                >
                  <SsovFilter
                    activeFilters={selectedOlpMarkets}
                    setActiveFilters={setSelectedOlpMarkets}
                    text="All"
                    options={olpMarkets}
                    multiple={true}
                    showImages={true}
                  />
                  <SsovFilter
                    activeFilters={selectedOlpExpiries}
                    setActiveFilters={setSelectedOlpExpiries}
                    text="Expiry"
                    options={olpExpiries}
                    multiple={true}
                    showImages={false}
                  />
                  <SsovFilter
                    activeFilters={selectedOlpNetworks}
                    setActiveFilters={setSelectedOlpNetworks}
                    text="Network"
                    options={olpNetworks}
                    multiple={true}
                    showImages={false}
                  />
                </TableCell>
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>
      </Paper>
      <StyleSecondHeaderTable>
        <Table>
          <TableHead>
            <TableRow>
              <StyleLeftTableCell align="left" className="flex space-x-1">
                <ArrowDownwardIcon className="fill-current text-stieglitz w-4 my-auto" />
                <Typography variant="h6" color="stieglitz" className="my-auto">
                  Market
                </Typography>
              </StyleLeftTableCell>
              <StyleTableCellHeader>
                <button onClick={() => setSortByTvl(!sortByTvl)}>TVL</button>
              </StyleTableCellHeader>
              <StyleTableCellHeader>Utilization</StyleTableCellHeader>
              <StyleTableCellHeader>Network</StyleTableCellHeader>
              <StyleRightTableCell align="right">
                <Typography variant="h6" color="stieglitz">
                  Action
                </Typography>
              </StyleRightTableCell>
            </TableRow>
          </TableHead>
          <TableBody className="">
            {filteredMarket
              ?.slice(
                page * ROWS_PER_PAGE,
                page * ROWS_PER_PAGE + ROWS_PER_PAGE,
              )
              ?.map((olp, idx) => (
                <OlpTableRow key={idx} olp={olp} idx={idx} />
              ))}
          </TableBody>
        </Table>
      </StyleSecondHeaderTable>
      {filteredMarket?.length ?? 0 > ROWS_PER_PAGE ? (
        <TablePagination
          component="div"
          id="olps"
          rowsPerPageOptions={[ROWS_PER_PAGE]}
          count={filteredMarket?.length ?? 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={ROWS_PER_PAGE}
          className="text-stieglitz border-0 flex flex-grow justify-center"
          ActionsComponent={TablePaginationActions}
        />
      ) : null}
    </Box>
  );
};

export default OlpHome;
