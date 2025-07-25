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
import { GenericDataType } from '@superset-ui/core';
import Tabs from '@superset-ui/core/components/Tabs';
import {
  SHARED_COLUMN_CONFIG_PROPS,
  SharedColumnConfigProp,
} from './constants';
import {
  ColumnConfig,
  ColumnConfigFormItem,
  ColumnConfigFormLayout,
  ColumnConfigInfo,
  ControlFormItemDefaultSpec,
  isTabLayoutItem,
  TabLayoutItem,
} from './types';
import ControlForm, { ControlFormItem, ControlFormRow } from './ControlForm';

export type ColumnConfigPopoverProps = {
  column: ColumnConfigInfo;
  configFormLayout: ColumnConfigFormLayout;
  onChange: (value: ColumnConfig) => void;
  width?: number | string;
  height?: number | string;
};

export default function ColumnConfigPopover({
  column,
  configFormLayout,
  onChange,
}: ColumnConfigPopoverProps) {
  const renderRow = (row: ColumnConfigFormItem[], i: number) => (
    <ControlFormRow key={i}>
      {row.map(meta => {
        const key = typeof meta === 'string' ? meta : meta.name;
        const override =
          typeof meta === 'string'
            ? {}
            : 'override' in meta
              ? meta.override
              : meta.config;
        const props = {
          ...(key in SHARED_COLUMN_CONFIG_PROPS
            ? SHARED_COLUMN_CONFIG_PROPS[key as SharedColumnConfigProp]
            : undefined),
          ...override,
        } as ControlFormItemDefaultSpec;
        return <ControlFormItem key={key} name={key} {...props} />;
      })}
    </ControlFormRow>
  );

  const layout =
    configFormLayout[
      column.type === undefined ? GenericDataType.String : column.type
    ];

  if (isTabLayoutItem(layout[0])) {
    const tabItems = (layout as TabLayoutItem[])
      .filter(isTabLayoutItem)
      .map((item: TabLayoutItem, i: number) => ({
        key: i.toString(),
        label: item.tab,
        children: (
          <ControlForm onChange={onChange} value={column.config}>
            {item.children.map(
              (row: ColumnConfigFormItem[], rowIndex: number) =>
                renderRow(row, rowIndex),
            )}
          </ControlForm>
        ),
      }));

    return <Tabs items={tabItems} />;
  }
  return (
    <ControlForm onChange={onChange} value={column.config}>
      {(layout as ColumnConfigFormItem[][]).map(
        (row: ColumnConfigFormItem[], i: number) => renderRow(row, i),
      )}
    </ControlForm>
  );
}
