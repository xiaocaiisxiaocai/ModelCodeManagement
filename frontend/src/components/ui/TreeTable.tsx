// TreeTable.tsx - 树形表格组件
import React, { useState } from 'react';
import { Button, Badge } from './index';

export interface TreeTableColumn {
  key: string;
  title: string;
  width?: string;
  render?: (value: any, record: any, index: number) => React.ReactNode;
}

export interface TreeTableNode {
  id: string;
  [key: string]: any;
  children?: TreeTableNode[];
}

export interface TreeTableProps {
  columns: TreeTableColumn[];
  data: TreeTableNode[];
  loading?: boolean;
  emptyMessage?: string;
  defaultExpandAll?: boolean;
  indentSize?: number;
  expandAll?: boolean;
}

// 提取getAllNodeIds函数到组件外部
function getAllNodeIds(nodes: TreeTableNode[]): string[] {
  const ids: string[] = [];
  const traverse = (nodes: TreeTableNode[]) => {
    nodes.forEach(node => {
      ids.push(node.id);
      if (node.children) {
        traverse(node.children);
      }
    });
  };
  traverse(nodes);
  return ids;
}

const TreeTable: React.FC<TreeTableProps> = ({
  columns,
  data,
  loading = false,
  emptyMessage = '暂无数据',
  defaultExpandAll = false,
  indentSize = 24,
  expandAll
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    // 优先使用传入的expandAll属性，否则使用defaultExpandAll
    const shouldExpandAll = expandAll !== undefined ? expandAll : defaultExpandAll;
    return shouldExpandAll ? new Set(getAllNodeIds(data)) : new Set();
  });

  // 当expandAll状态变化时，更新展开状态
  React.useEffect(() => {
    if (expandAll !== undefined) {
      const allIds = getAllNodeIds(data);
      setExpandedKeys(expandAll ? new Set(allIds) : new Set());
    }
  }, [expandAll, data]);


  const toggleExpand = (id: string) => {
    const newExpandedKeys = new Set(expandedKeys);
    if (newExpandedKeys.has(id)) {
      newExpandedKeys.delete(id);
    } else {
      newExpandedKeys.add(id);
    }
    setExpandedKeys(newExpandedKeys);
  };

  const renderTreeRows = (nodes: TreeTableNode[], level = 0): React.ReactNode[] => {
    const rows: React.ReactNode[] = [];

    nodes.forEach((node, index) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedKeys.has(node.id);

      rows.push(
        <tr key={node.id} className="border-b border-gray-200 hover:bg-gray-50">
          {columns.map((column, colIndex) => {
            let cellContent: React.ReactNode;

            if (column.render) {
              cellContent = column.render(node[column.key], node, index);
            } else {
              cellContent = node[column.key];
            }

            // 第一列显示树形结构
            if (colIndex === 0) {
              cellContent = (
                <div className="flex items-center" style={{ paddingLeft: `${level * 20}px` }}>
                  {hasChildren ? (
                    <button
                      onClick={() => toggleExpand(node.id)}
                      className="mr-2 w-4 h-4 flex items-center justify-center text-gray-600 hover:text-gray-800"
                      title={isExpanded ? '折叠' : '展开'}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  ) : level > 0 ? (
                    <div className="mr-2 w-4 h-4 flex items-center justify-center">
                      <span className="text-gray-400">•</span>
                    </div>
                  ) : null}
                  <span className={level === 0 ? 'font-semibold' : ''}>{cellContent}</span>
                </div>
              );
            }

            return (
              <td
                key={column.key}
                className="px-4 py-3 text-sm"
                style={column.width ? { width: column.width } : undefined}
              >
                {cellContent}
              </td>
            );
          })}
        </tr>
      );

      // 如果节点展开且有子节点，递归渲染子节点
      if (hasChildren && isExpanded) {
        rows.push(...renderTreeRows(node.children!, level + 1));
      }
    });

    return rows;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }


  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={column.width ? { width: column.width } : undefined}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {renderTreeRows(data)}
        </tbody>
      </table>
    </div>
  );
};

export default TreeTable;