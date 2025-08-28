/**
 * 组织架构工具函数
 */

export interface OrganizationLike {
  level: number;
  name: string;
  sortOrder?: number;
}

/**
 * 格式化组织架构名称，添加层级缩进
 * @param organization 组织对象
 * @param indentChar 缩进字符，默认为全角空格
 * @param indentSize 每层缩进的字符数量，默认为2
 * @returns 格式化后的名称
 */
export function formatOrganizationName(
  organization: OrganizationLike,
  indentChar: string = '　',
  indentSize: number = 2
): string {
  const indentLevel = Math.max(0, organization.level - 1);
  const indent = indentChar.repeat(indentLevel * indentSize);
  return `${indent}${organization.name}`;
}

/**
 * 将组织架构数组转换为下拉选项格式
 * @param organizations 组织数组
 * @param valueField 作为value的字段名，默认为'id'
 * @param includeEmpty 是否包含空选项，默认为true
 * @param emptyLabel 空选项的标签，默认为'请选择部门'
 * @returns 下拉选项数组
 */
export function formatOrganizationOptions<T extends OrganizationLike & Record<string, any>>(
  organizations: T[],
  valueField: keyof T = 'id' as keyof T,
  includeEmpty: boolean = true,
  emptyLabel: string = '请选择部门'
): { value: string; label: string }[] {
  // 按层级和排序字段排序
  const sortedOrganizations = [...organizations].sort((a, b) => {
    // 先按层级排序
    if (a.level !== b.level) {
      return a.level - b.level;
    }
    // 层级相同时按sortOrder排序
    if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
      return a.sortOrder - b.sortOrder;
    }
    // 最后按名称排序
    return a.name.localeCompare(b.name);
  });

  const options = sortedOrganizations.map(org => ({
    value: String(org[valueField]),
    label: formatOrganizationName(org)
  }));

  if (includeEmpty) {
    options.unshift({ value: '', label: emptyLabel });
  }

  return options;
}

/**
 * 根据路径查找组织的完整层级路径名称
 * @param organizations 组织数组
 * @param path 路径字符串，如'/1/2/3/'
 * @returns 层级路径名称，如'集团公司 > 技术部 > 开发组'
 */
export function getOrganizationPathNames<T extends OrganizationLike & { id: number; path: string }>(
  organizations: T[],
  path: string,
  separator: string = ' > '
): string {
  if (!path || path === '/') return '';

  // 从路径中提取ID数组
  const ids = path.split('/').filter(id => id && id !== '').map(Number);
  
  // 查找对应的组织名称
  const names: string[] = [];
  for (const id of ids) {
    const org = organizations.find(o => o.id === id);
    if (org) {
      names.push(org.name);
    }
  }

  return names.join(separator);
}

/**
 * 构建组织树形结构
 * @param organizations 扁平的组织数组
 * @returns 树形结构
 */
export function buildOrganizationTree<T extends OrganizationLike & { id: number; parentId?: number }>(
  organizations: T[]
): (T & { children: T[] })[] {
  const orgMap = new Map<number, T & { children: T[] }>();
  const roots: (T & { children: T[] })[] = [];

  // 初始化所有节点
  organizations.forEach(org => {
    orgMap.set(org.id, { ...org, children: [] });
  });

  // 构建树形结构
  organizations.forEach(org => {
    const node = orgMap.get(org.id)!;
    if (org.parentId && orgMap.has(org.parentId)) {
      orgMap.get(org.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}