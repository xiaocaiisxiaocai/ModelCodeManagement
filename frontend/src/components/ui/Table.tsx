// Table.tsx - 修复版Table组件，支持新旧两种接口
import React from 'react';

// 新的表格接口（基于列配置）
interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface NewTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (record: T, index: number) => void;
  className?: string;
}

// 旧的表格接口（基于headers和二维数组）
interface LegacyTableProps {
  headers: string[];
  data: React.ReactNode[][];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

// 联合类型
type TableProps<T> = NewTableProps<T> | LegacyTableProps;

// 类型守卫函数
function isLegacyTableProps<T>(props: TableProps<T>): props is LegacyTableProps {
  return 'headers' in props && Array.isArray((props as LegacyTableProps).headers);
}

export function Table<T extends Record<string, any>>(props: TableProps<T>) {
  const getValue = (record: T, key: keyof T | string): any => {
    if (typeof key === 'string' && key.includes('.')) {
      return key.split('.').reduce((obj, k) => obj?.[k], record);
    }
    return record[key as keyof T];
  };

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  // 处理旧版本接口
  if (isLegacyTableProps(props)) {
    const { headers, data, loading = false, emptyMessage = '暂无数据', className = '' } = props;

    if (loading) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8 text-center">
            <span className="i-carbon-loading animate-spin text-2xl text-gray-400"></span>
            <p className="mt-2 text-gray-500">加载中...</p>
          </div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8 text-center">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`bg-white border border-gray-200 overflow-hidden ${className}`}>
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-50 transition-colors"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-6 py-4 text-sm text-gray-900"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 处理新版本接口
  const { 
    columns, 
    data, 
    loading = false, 
    emptyText = '暂无数据', 
    onRowClick, 
    className = '' 
  } = props as NewTableProps<T>;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <span className="i-carbon-loading animate-spin text-2xl text-gray-400"></span>
          <p className="mt-2 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <p className="text-gray-500">{emptyText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 overflow-hidden ${className}`}>
      <table className="w-full table-fixed">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${getAlignClass(column.align)}`}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((record, rowIndex) => (
            <tr
              key={rowIndex}
              className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(record, rowIndex)}
            >
              {columns.map((column, colIndex) => {
                const value = getValue(record, column.key);
                const content = column.render ? column.render(value, record, rowIndex) : value;
                
                return (
                  <td
                    key={colIndex}
                    className={`px-6 py-4 text-sm text-gray-900 ${getAlignClass(column.align)}`}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}