// Pagination.tsx - 分页组件
import React from 'react';
import { Button } from './Button';

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  current,
  total,
  pageSize,
  onChange,
  showSizeChanger = false,
  showQuickJumper = false,
  showTotal = true,
  className = ''
}) => {
  const totalPages = Math.ceil(total / pageSize);
  
  if (totalPages <= 1) {
    return null;
  }

  const getVisiblePages = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = Math.max(2, current - delta);
         i <= Math.min(totalPages - 1, current + delta);
         i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== current) {
      onChange(page);
    }
  };

  const visiblePages = getVisiblePages();
  const startItem = (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, total);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {showTotal && (
        <div className="text-sm text-gray-700">
          显示 {startItem} 到 {endItem} 条，共 {total} 条
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        {/* 上一页 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
          className="px-2"
        >
          <span className="i-carbon-chevron-left"></span>
        </Button>

        {/* 页码 */}
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 py-1 text-gray-500">...</span>
            ) : (
              <Button
                variant={current === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page as number)}
                className="px-3 min-w-[32px]"
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}

        {/* 下一页 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(current + 1)}
          disabled={current === totalPages}
          className="px-2"
        >
          <span className="i-carbon-chevron-right"></span>
        </Button>

        {/* 快速跳转 */}
        {showQuickJumper && (
          <div className="flex items-center space-x-2 ml-4">
            <span className="text-sm text-gray-700">跳至</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              className="w-16 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = parseInt((e.target as HTMLInputElement).value);
                  if (value >= 1 && value <= totalPages) {
                    handlePageChange(value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <span className="text-sm text-gray-700">页</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;