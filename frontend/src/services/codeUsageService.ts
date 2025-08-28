import { mockData } from '../mock/mockData';
import type { CodeUsageEntry } from '../mock/interfaces';

// 生成唯一ID的辅助函数
const generateId = () => Math.random().toString(36).substring(2, 9);

// 获取当前日期，格式为 YYYY/MM/DD
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

/**
 * 代码使用清单服务
 */
export const CodeUsageService = {
  /**
   * 获取所有代码使用清单
   * @param includeDeleted 是否包含已删除的记录
   * @returns 代码使用清单数组
   */
  getAllCodeUsages(includeDeleted: boolean = false): CodeUsageEntry[] {
    return mockData.codeUsageList.filter(entry => includeDeleted || !entry.isDeleted);
  },

  /**
   * 根据机型和代码编号筛选代码使用清单
   * @param modelType 机型前缀
   * @param codeNumber 代码编号
   * @param includeDeleted 是否包含已删除的记录
   * @returns 筛选后的代码使用清单数组
   */
  getCodeUsagesByModelAndCode(
    modelType: string, 
    codeNumber: string,
    includeDeleted: boolean = false
  ): CodeUsageEntry[] {
    return mockData.codeUsageList.filter(entry => {
      // 检查机型前缀和代码编号是否匹配
      // 例如：modelType="SLU-", codeNumber="2" 应该匹配 model="SLU-102" 的记录
      const modelPrefix = modelType.endsWith('-') ? modelType : `${modelType}-`;
      return entry.model.startsWith(modelPrefix) && 
             entry.codeNumber === codeNumber && 
             (includeDeleted || !entry.isDeleted);
    });
  },

  /**
   * 根据ID获取单个代码使用记录
   * @param id 记录ID
   * @returns 代码使用记录或undefined
   */
  getCodeUsageById(id: string): CodeUsageEntry | undefined {
    return mockData.codeUsageList.find(entry => entry.id === id);
  },

  /**
   * 添加新的代码使用记录
   * @param codeUsage 代码使用记录数据（不包含ID）
   * @returns 添加后的代码使用记录
   */
  addCodeUsage(codeUsage: Omit<CodeUsageEntry, 'id' | 'creationDate'>): CodeUsageEntry {
    const newCodeUsage: CodeUsageEntry = {
      ...codeUsage,
      id: generateId(),
      creationDate: getCurrentDate(),
      isDeleted: false
    };
    mockData.codeUsageList.push(newCodeUsage);
    return newCodeUsage;
  },

  /**
   * 更新代码使用记录
   * @param id 记录ID
   * @param codeUsage 更新的数据
   * @returns 更新后的代码使用记录或undefined
   */
  updateCodeUsage(id: string, codeUsage: Partial<CodeUsageEntry>): CodeUsageEntry | undefined {
    const index = mockData.codeUsageList.findIndex(entry => entry.id === id);
    if (index === -1) return undefined;

    // 更新记录
    const updatedCodeUsage = {
      ...mockData.codeUsageList[index],
      ...codeUsage
    };
    mockData.codeUsageList[index] = updatedCodeUsage;
    return updatedCodeUsage;
  },

  /**
   * 软删除代码使用记录（标记为已删除）
   * @param id 记录ID
   * @returns 是否删除成功
   */
  softDeleteCodeUsage(id: string): boolean {
    const entry = mockData.codeUsageList.find(entry => entry.id === id);
    if (!entry) return false;
    
    entry.isDeleted = true;
    // 添加删除日期
    entry.deletedDate = getCurrentDate();
    return true;
  },

  /**
   * 永久删除代码使用记录
   * @param id 记录ID
   * @returns 是否删除成功
   */
  hardDeleteCodeUsage(id: string): boolean {
    const initialLength = mockData.codeUsageList.length;
    mockData.codeUsageList = mockData.codeUsageList.filter(entry => entry.id !== id);
    return initialLength > mockData.codeUsageList.length;
  },
  
  /**
   * 恢复已删除的代码使用记录
   * @param id 记录ID
   * @returns 是否恢复成功
   */
  restoreCodeUsage(id: string): boolean {
    const entry = mockData.codeUsageList.find(entry => entry.id === id);
    if (!entry) return false;
    
    entry.isDeleted = false;
    return true;
  },

  /**
   * 根据机型和代码编号获取代码分类名称
   * @param modelType 机型前缀
   * @param codeNumber 代码编号
   * @returns 代码分类名称
   */
  getCodeClassificationName(modelType: string, codeNumber: string): string | null {
    const codeClassification = mockData.codeClassifications.find(
      code => code.modelType === modelType && code.code === codeNumber
    );
    
    return codeClassification ? codeClassification.name || null : null;
  }
};

export default CodeUsageService; 