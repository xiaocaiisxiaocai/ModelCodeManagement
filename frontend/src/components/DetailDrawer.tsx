import { useState } from 'react';
import type { CodeUsageEntry } from '../types/domain';
// 由于我们已经创建了 EditModal 组件，直接修改导入方式
import EditModal from './EditModal.js';

interface DetailDrawerProps {
  entry: CodeUsageEntry;
  onClose: () => void;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ entry, onClose }) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      ></div>
      
      {/* 抽屉 */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg z-50 flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-200 p-6 pb-4">
          <h2 className="text-xl font-bold">{entry.model} 详细信息</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-6">
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">基本信息</h3>
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div className="text-gray-500">机型:</div>
              <div>{entry.model}</div>
              
              <div className="text-gray-500">延伸:</div>
              <div>{entry.extension || '-'}</div>
              
              <div className="text-gray-500">品名:</div>
              <div>{entry.productName}</div>
              
              <div className="text-gray-500">占用类型:</div>
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  entry.occupancyType === '规划' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {entry.occupancyType}
                </span>
              </div>
              
              <div className="text-gray-500">建立时间:</div>
              <div>{entry.creationDate}</div>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">人员信息</h3>
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div className="text-gray-500">建檔人:</div>
              <div>{entry.builder}</div>
              
              <div className="text-gray-500">需求人:</div>
              <div>{entry.requester}</div>
            </div>
          </div>
          
          {/* 历史记录功能已移除，因为新的CodeUsageEntry类型不包含history属性 */}
          
          </div>
        </div>

        {/* 按钮区域 - 固定在抽屉底部 */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleEdit}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              编辑
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              删除
            </button>
          </div>
        </div>
      </div>
      
      {/* 编辑模态框 */}
      {showEditModal && (
        <EditModal entry={entry} onClose={handleCloseEditModal} />
      )}
    </>
  );
};

export default DetailDrawer; 