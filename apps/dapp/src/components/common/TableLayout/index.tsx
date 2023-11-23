import { Disclosure, Skeleton } from '@dopex-io/ui';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import {
  AccessorKeyColumnDef,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';

interface Props<T> {
  data: T[];
  columns: (ColumnDef<T, any> | AccessorKeyColumnDef<T>)[];
  isContentLoading: boolean;
  rowSpacing?: number;
  pageSize?: number;
  disclosure?: React.ReactElement<Partial<T>>[];
}

const Placeholder = () => {
  return (
    <div className="flex justify-center my-auto w-full bg-cod-gray  py-8">
      <p className="text-sm text-stieglitz">Nothing to show</p>
    </div>
  );
};

const TableLayout = <T extends object>({
  data,
  columns,
  disclosure,
  rowSpacing = 1,
  // pageSize = 100,
  isContentLoading = true,
}: Props<T>) => {
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    // initialState: {
    //   pagination: {
    //     pageSize: pageSize,
    //   },
    // },
  });

  const {
    getHeaderGroups,
    getRowModel,
    getState,
    setPageIndex,
    previousPage,
    getCanPreviousPage,
    nextPage,
    getCanNextPage,
    getPageCount,
  } = table;

  if (isContentLoading)
    return (
      <div className="w-full h-fit p-[12px] space-y-[12px]">
        {Array.from(Array(4)).map((_, index) => {
          return (
            <Skeleton
              key={index}
              width="fitContent"
              height={50}
              color="carbon"
              variant="rounded"
            />
          );
        })}
      </div>
    );

  return data.length > 0 ? (
    <div className="bg-cod-gray ">
      <div className="overflow-x-auto">
        <table className="bg-cod-gray  w-full">
          <thead>
            {getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index: number) => {
                  let textAlignment;
                  if (index === 0) {
                    textAlignment = 'text-left';
                  } else if (index === columns.length - 1) {
                    textAlignment = 'text-right';
                  } else {
                    textAlignment = 'text-left';
                  }
                  return (
                    <th
                      key={header.id}
                      className={`m-3 py-2 px-4 ${textAlignment} w-1/${columns.length}`}
                    >
                      <span className="text-xs text-stieglitz font-normal">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="max-h-32 overflow-y-auto divide-y divide-umbra ">
            {getRowModel().rows.map((row, index) => {
              return (
                <Disclosure key={row.id}>
                  {({ open }: { open: boolean }) => {
                    return (
                      <>
                        <tr className={`${open ? 'bg-umbra' : ''}`}>
                          {row.getVisibleCells().map((cell, index) => {
                            let textAlignment;
                            if (index === 0) {
                              textAlignment = 'text-left';
                            } else if (index === columns.length - 1) {
                              textAlignment = 'text-right';
                            } else {
                              textAlignment = 'text-left';
                            }
                            return (
                              <td
                                key={cell.id}
                                className={`m-3 py-${rowSpacing} px-4 ${textAlignment}`}
                              >
                                <span className="text-sm">
                                  {flexRender(cell.column.columnDef.cell, {
                                    ...cell.getContext(),
                                    open,
                                  })}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                        {disclosure ? disclosure[index] : null}
                      </>
                    );
                  }}
                </Disclosure>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* {data.length > getState().pagination.pageSize ? (
        <div className="sticky flex flex-wrap justify-center sm:justify-end border-t border-umbra py-3 px-3 text-xs text-stieglitz space-x-3">
          <div className="flex space-x-2">
            <span className="flex my-auto text-center space-x-1">
              <p>Rows per page: </p>
              <p className="text-white">{pageSize}</p>
            </span>
            <span className="my-auto text-center">
              {getState().pagination.pageIndex *
                getState().pagination.pageSize +
                1}
              -
              {Math.min(
                (getState().pagination.pageIndex + 1) *
                  getState().pagination.pageSize,
                data.length,
              )}{' '}
              of {data.length}
            </span>
          </div>
          <div className="flex">
            <button
              onClick={() => previousPage()}
              disabled={!getCanPreviousPage()}
              color="transparent"
              className={`${
                !getCanPreviousPage() ? 'hover:cursor-not-allowed' : ''
              }`}
            >
              <ChevronLeftIcon className="w-6 h-6 fill-current text-stieglitz hover:text-white" />
            </button>
            {Array.from(Array(Math.min(pageSize, getPageCount()))).map(
              (_, idx) => (
                <button
                  key={idx}
                  onClick={(e: any) => setPageIndex(e.target.innerText - 1)}
                  className={`py-2 px-3  ${
                    idx === getState().pagination.pageIndex
                      ? 'text-white bg-mineshaft'
                      : ''
                  }`}
                >
                  {idx + 1}
                </button>
              ),
            )}
            <button
              onClick={() => nextPage()}
              disabled={!getCanNextPage()}
              color="transparent"
              className={`${
                !getCanNextPage() ? 'hover:cursor-not-allowed' : ''
              }`}
            >
              <ChevronRightIcon className="w-6 h-6 fill-current text-stieglitz hover:text-white" />
            </button>
            <button
              onClick={(e: any) => setPageIndex(e.target.innerText - 1)}
              className={`py-2 px-3 my-auto  ${
                !getCanNextPage() ? 'text-white bg-mineshaft' : ''
              }`}
            >
              {getPageCount()}
            </button>
          </div>
        </div>
      ) : null} */}
    </div>
  ) : (
    <Placeholder />
  );
};

export default TableLayout;
