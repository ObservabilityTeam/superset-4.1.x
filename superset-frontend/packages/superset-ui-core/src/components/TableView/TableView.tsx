/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { memo, useEffect, useRef } from 'react';
import { isEqual } from 'lodash';
import { styled, t } from '@superset-ui/core';
import { useFilters, usePagination, useSortBy, useTable } from 'react-table';
import { Empty } from '@superset-ui/core/components';
import Pagination from '@superset-ui/core/components/Pagination';
import TableCollection from '@superset-ui/core/components/TableCollection';
import { TableSize } from '@superset-ui/core/components/Table';
import { SortByType, ServerPagination } from './types';

const DEFAULT_PAGE_SIZE = 10;

export enum EmptyWrapperType {
  Default = 'Default',
  Small = 'Small',
}

export interface TableViewProps {
  columns: any[];
  data: any[];
  pageSize?: number;
  totalCount?: number;
  serverPagination?: boolean;
  onServerPagination?: (args: ServerPagination) => void;
  initialPageIndex?: number;
  initialSortBy?: SortByType;
  loading?: boolean;
  withPagination?: boolean;
  emptyWrapperType?: EmptyWrapperType;
  noDataText?: string;
  className?: string;
  isPaginationSticky?: boolean;
  showRowCount?: boolean;
  scrollTable?: boolean;
  scrollTopOnPagination?: boolean;
  small?: boolean;
  columnsForWrapText?: string[];
  size?: TableSize;
}

const EmptyWrapper = styled.div`
  margin: ${({ theme }) => theme.sizeUnit * 40}px 0;
`;

const TableViewStyles = styled.div<{
  isPaginationSticky?: boolean;
  scrollTable?: boolean;
  small?: boolean;
}>`
  ${({ scrollTable, theme }) =>
    scrollTable &&
    `
    flex: 1 1 auto;
    margin-bottom: ${theme.sizeUnit * 4}px;
    overflow: auto;
  `}
  color: ${({ theme }) => theme.colorText};

  .table-row {
    ${({ theme, small }) => !small && `height: ${theme.sizeUnit * 11 - 1}px;`}

    .table-cell {
      ${({ theme, small }) =>
        small &&
        `
        padding-top: ${theme.sizeUnit + 1}px;
        padding-bottom: ${theme.sizeUnit + 1}px;
        line-height: 1.45;
      `}
    }
  }

  th[role='columnheader'] {
    z-index: 1;
    border-bottom: ${({ theme }) =>
      `${theme.sizeUnit - 2}px solid ${theme.colorSplit}`};
    ${({ small }) => small && `padding-bottom: 0;`}
  }
`;

const PaginationStyles = styled.div<{
  isPaginationSticky?: boolean;
}>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.colorBgElevated};

  ${({ isPaginationSticky }) =>
    isPaginationSticky &&
    `
        position: sticky;
        bottom: 0;
        left: 0;
    `};

  .row-count-container {
    margin-top: ${({ theme }) => theme.sizeUnit * 2}px;
    color: ${({ theme }) => theme.colorText};
  }
`;

const RawTableView = ({
  columns,
  data,
  pageSize: initialPageSize,
  totalCount = data.length,
  initialPageIndex,
  initialSortBy = [],
  loading = false,
  withPagination = true,
  emptyWrapperType = EmptyWrapperType.Default,
  noDataText,
  showRowCount = true,
  serverPagination = false,
  columnsForWrapText,
  onServerPagination = () => {},
  scrollTopOnPagination = false,
  size = TableSize.Middle,
  ...props
}: TableViewProps) => {
  const initialState = {
    pageSize: initialPageSize ?? DEFAULT_PAGE_SIZE,
    pageIndex: initialPageIndex ?? 0,
    sortBy: initialSortBy,
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    rows,
    prepareRow,
    pageCount,
    gotoPage,
    setSortBy,
    state: { pageIndex, pageSize, sortBy },
  } = useTable(
    {
      columns,
      data,
      initialState,
      manualPagination: serverPagination,
      manualSortBy: serverPagination,
      pageCount: Math.ceil(totalCount / initialState.pageSize),
    },
    useFilters,
    useSortBy,
    usePagination,
  );

  const content = withPagination ? page : rows;

  let EmptyWrapperComponent;
  switch (emptyWrapperType) {
    case EmptyWrapperType.Small:
      EmptyWrapperComponent = ({ children }: any) => <>{children}</>;
      break;
    case EmptyWrapperType.Default:
    default:
      EmptyWrapperComponent = ({ children }: any) => (
        <EmptyWrapper>{children}</EmptyWrapper>
      );
  }

  const isEmpty = !loading && content.length === 0;
  const hasPagination = pageCount > 1 && withPagination;
  const tableRef = useRef<HTMLTableElement>(null);
  const handleGotoPage = (p: number) => {
    if (scrollTopOnPagination) {
      tableRef?.current?.scroll(0, 0);
    }
    gotoPage(p);
  };

  useEffect(() => {
    if (serverPagination && pageIndex !== initialState.pageIndex) {
      onServerPagination({
        pageIndex,
      });
    }
  }, [pageIndex]);

  useEffect(() => {
    if (serverPagination && !isEqual(sortBy, initialState.sortBy)) {
      onServerPagination({
        pageIndex: 0,
        sortBy,
      });
    }
  }, [sortBy]);

  return (
    <>
      <TableViewStyles {...props} ref={tableRef}>
        <TableCollection
          getTableProps={getTableProps}
          getTableBodyProps={getTableBodyProps}
          prepareRow={prepareRow}
          headerGroups={headerGroups}
          rows={content}
          columns={columns}
          loading={loading}
          setSortBy={setSortBy}
          size={size}
          columnsForWrapText={columnsForWrapText}
        />
        {isEmpty && (
          <EmptyWrapperComponent>
            {noDataText ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={noDataText}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </EmptyWrapperComponent>
        )}
      </TableViewStyles>
      {hasPagination && (
        <PaginationStyles
          className="pagination-container"
          isPaginationSticky={props.isPaginationSticky}
        >
          <Pagination
            totalPages={pageCount || 0}
            currentPage={pageCount ? pageIndex + 1 : 0}
            onChange={(p: number) => handleGotoPage(p - 1)}
            hideFirstAndLastPageLinks
          />
          {showRowCount && (
            <div className="row-count-container">
              {!loading &&
                t(
                  '%s-%s of %s',
                  pageSize * pageIndex + (page.length && 1),
                  pageSize * pageIndex + page.length,
                  totalCount,
                )}
            </div>
          )}
        </PaginationStyles>
      )}
    </>
  );
};

export const TableView = memo(RawTableView);
