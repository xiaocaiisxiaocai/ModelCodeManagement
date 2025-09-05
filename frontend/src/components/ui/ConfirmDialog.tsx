// ConfirmDialog.tsx - 自定义确认对话框组件
import React from 'react';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  /** 是否显示对话框 */
  isOpen: boolean;
  /** 关闭对话框回调 */
  onClose: () => void;
  /** 确认操作回调 */
  onConfirm: () => void;
  /** 对话框标题 */
  title?: string;
  /** 确认消息内容 */
  message: string;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮类型 */
  confirmType?: 'primary' | 'danger' | 'warning';
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 操作的用户信息（显示详细信息） */
  userInfo?: {
    name?: string;
    employeeId?: string;
    role?: string;
  };
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  message,
  confirmText = '确定',
  cancelText = '取消',
  confirmType = 'primary',
  loading = false,
  userInfo
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        {/* 警告图标和消息 */}
        <div className="flex items-start space-x-3">
          {confirmType === 'danger' && (
            <div className="flex-shrink-0">
              <span className="i-carbon-warning-filled text-2xl text-red-600"></span>
            </div>
          )}
          {confirmType === 'warning' && (
            <div className="flex-shrink-0">
              <span className="i-carbon-warning text-2xl text-orange-600"></span>
            </div>
          )}
          {confirmType === 'primary' && (
            <div className="flex-shrink-0">
              <span className="i-carbon-information text-2xl text-blue-600"></span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 leading-5">
              {message}
            </p>
            
            {/* 用户详细信息 */}
            {userInfo && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-1">
                  {userInfo.name && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-12">姓名:</span>
                      <span className="text-gray-900 font-medium">{userInfo.name}</span>
                    </div>
                  )}
                  {userInfo.employeeId && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-12">工号:</span>
                      <code className="text-gray-900 text-xs bg-white px-2 py-1 rounded font-mono border">
                        {userInfo.employeeId}
                      </code>
                    </div>
                  )}
                  {userInfo.role && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-12">角色:</span>
                      <span className="text-gray-700">{userInfo.role}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          size="sm"
        >
          {cancelText}
        </Button>
        <Button
          variant={confirmType}
          onClick={handleConfirm}
          loading={loading}
          size="sm"
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ConfirmDialog;