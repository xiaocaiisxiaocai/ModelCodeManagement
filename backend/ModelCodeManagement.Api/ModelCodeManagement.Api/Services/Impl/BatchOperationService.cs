using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 批量操作服务实现（基础版本）
    /// </summary>
    public class BatchOperationService : IBatchOperationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BatchOperationService> _logger;
        private readonly IAuditLogService _auditLogService;

        public BatchOperationService(
            ApplicationDbContext context, 
            ILogger<BatchOperationService> logger,
            IAuditLogService auditLogService)
        {
            _context = context;
            _logger = logger;
            _auditLogService = auditLogService;
        }

        public async Task<ApiResponse<BatchOperationResultDto>> BatchCreateProductTypesAsync(BatchCreateProductTypesDto dto)
        {
            try
            {
                var result = new BatchOperationResultDto
                {
                    TotalRecords = dto.ProductTypes.Count,
                    SuccessCount = 0,
                    FailedCount = 0,
                    FailedRecords = new List<BatchOperationFailedRecordDto>()
                };

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    foreach (var productTypeDto in dto.ProductTypes)
                    {
                        try
                        {
                            // 检查代码是否已存在
                            var exists = await _context.ProductTypes
                                .AnyAsync(p => p.Code == productTypeDto.Code);

                            if (exists)
                            {
                                result.FailedCount++;
                                result.FailedRecords.Add(new BatchOperationFailedRecordDto
                                {
                                    Data = productTypeDto,
                                    ErrorMessage = $"产品类型代码 {productTypeDto.Code} 已存在"
                                });
                                continue;
                            }

                            var entity = new ProductType
                            {
                                Code = productTypeDto.Code,
                                CreatedAt = DateTime.Now
                                // UpdatedAt字段在ProductType实体中不存在
                            };

                            _context.ProductTypes.Add(entity);
                            result.SuccessCount++;
                        }
                        catch (Exception ex)
                        {
                            result.FailedCount++;
                            result.FailedRecords.Add(new BatchOperationFailedRecordDto
                            {
                                Data = productTypeDto,
                                ErrorMessage = ex.Message
                            });
                        }
                    }

                    if (result.SuccessCount > 0)
                    {
                        await _context.SaveChangesAsync();
                        await _auditLogService.LogActionAsync("BatchCreateProductTypes", 
                            $"批量创建产品类型：成功{result.SuccessCount}条，失败{result.FailedCount}条");
                    }

                    await transaction.CommitAsync();
                    
                    // IsSuccess是计算属性，不需要手动赋值
                    result.Message = $"批量创建完成：成功{result.SuccessCount}条，失败{result.FailedCount}条";
                    
                    _logger.LogInformation("批量创建产品类型完成 - 成功: {Success}, 失败: {Failed}", 
                        result.SuccessCount, result.FailedCount);
                    
                    return ApiResponse<BatchOperationResultDto>.SuccessResult(result);
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "批量创建产品类型失败");
                return ApiResponse<BatchOperationResultDto>.ErrorResult($"批量创建产品类型失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<BatchOperationResultDto>> BatchCreateModelClassificationsAsync(BatchCreateModelClassificationsDto dto)
        {
            await Task.CompletedTask;
            return ApiResponse<BatchOperationResultDto>.ErrorResult("批量创建机型分类功能待实现");
        }

        public async Task<ApiResponse<BatchOperationResultDto>> BatchCreateCodeClassificationsAsync(BatchCreateCodeClassificationsDto dto)
        {
            await Task.CompletedTask;
            return ApiResponse<BatchOperationResultDto>.ErrorResult("批量创建代码分类功能待实现");
        }

        public async Task<ApiResponse<BatchOperationResultDto>> BatchImportCodeUsageAsync(BatchImportCodeUsageDto dto)
        {
            await Task.CompletedTask;
            return ApiResponse<BatchOperationResultDto>.ErrorResult("批量导入编码使用记录功能待实现");
        }

        public async Task<ApiResponse<BatchOperationResultDto>> BatchUpdateOccupancyTypesAsync(BatchUpdateOccupancyTypesDto dto)
        {
            await Task.CompletedTask;
            return ApiResponse<BatchOperationResultDto>.ErrorResult("批量更新占用类型功能待实现");
        }

        public async Task<ApiResponse<BatchOperationResultDto>> BatchSoftDeleteCodesAsync(BatchSoftDeleteCodesDto dto)
        {
            try
            {
                var result = new BatchOperationResultDto
                {
                    TotalRecords = dto.CodeIds.Count,
                    SuccessCount = 0,
                    FailedCount = 0,
                    FailedRecords = new List<BatchOperationFailedRecordDto>()
                };

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    foreach (var codeId in dto.CodeIds)
                    {
                        try
                        {
                            var entity = await _context.CodeUsageEntries
                                .FirstOrDefaultAsync(c => c.Id == codeId && !c.IsDeleted);

                            if (entity == null)
                            {
                                result.FailedCount++;
                                result.FailedRecords.Add(new BatchOperationFailedRecordDto
                                {
                                    Data = codeId,
                                    ErrorMessage = $"未找到ID为{codeId}的编码记录或已被删除"
                                });
                                continue;
                            }

                            entity.IsDeleted = true;
                            entity.DeletedReason = dto.Reason;
                            entity.UpdatedAt = DateTime.Now;

                            result.SuccessCount++;
                        }
                        catch (Exception ex)
                        {
                            result.FailedCount++;
                            result.FailedRecords.Add(new BatchOperationFailedRecordDto
                            {
                                Data = codeId,
                                ErrorMessage = ex.Message
                            });
                        }
                    }

                    if (result.SuccessCount > 0)
                    {
                        await _context.SaveChangesAsync();
                        await _auditLogService.LogActionAsync("BatchSoftDeleteCodes", 
                            $"批量软删除编码：成功{result.SuccessCount}条，失败{result.FailedCount}条，原因：{dto.Reason}");
                    }

                    await transaction.CommitAsync();
                    
                    // IsSuccess是计算属性，不需要手动赋值
                    result.Message = $"批量删除完成：成功{result.SuccessCount}条，失败{result.FailedCount}条";
                    
                    _logger.LogInformation("批量软删除编码完成 - 成功: {Success}, 失败: {Failed}, 原因: {Reason}", 
                        result.SuccessCount, result.FailedCount, dto.Reason);
                    
                    return ApiResponse<BatchOperationResultDto>.SuccessResult(result);
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "批量软删除编码失败");
                return ApiResponse<BatchOperationResultDto>.ErrorResult($"批量软删除编码失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<BatchOperationResultDto>> BatchRestoreCodesAsync(BatchRestoreCodesDto dto)
        {
            try
            {
                var result = new BatchOperationResultDto
                {
                    TotalRecords = dto.CodeIds.Count,
                    SuccessCount = 0,
                    FailedCount = 0,
                    FailedRecords = new List<BatchOperationFailedRecordDto>()
                };

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    foreach (var codeId in dto.CodeIds)
                    {
                        try
                        {
                            var entity = await _context.CodeUsageEntries
                                .FirstOrDefaultAsync(c => c.Id == codeId && c.IsDeleted);

                            if (entity == null)
                            {
                                result.FailedCount++;
                                result.FailedRecords.Add(new BatchOperationFailedRecordDto
                                {
                                    Data = codeId,
                                    ErrorMessage = $"未找到ID为{codeId}的已删除编码记录"
                                });
                                continue;
                            }

                            entity.IsDeleted = false;
                            entity.DeletedReason = null;
                            entity.UpdatedAt = DateTime.Now;

                            result.SuccessCount++;
                        }
                        catch (Exception ex)
                        {
                            result.FailedCount++;
                            result.FailedRecords.Add(new BatchOperationFailedRecordDto
                            {
                                Data = codeId,
                                ErrorMessage = ex.Message
                            });
                        }
                    }

                    if (result.SuccessCount > 0)
                    {
                        await _context.SaveChangesAsync();
                        await _auditLogService.LogActionAsync("BatchRestoreCodes", 
                            $"批量恢复编码：成功{result.SuccessCount}条，失败{result.FailedCount}条");
                    }

                    await transaction.CommitAsync();
                    
                    // IsSuccess是计算属性，不需要手动赋值
                    result.Message = $"批量恢复完成：成功{result.SuccessCount}条，失败{result.FailedCount}条";
                    
                    _logger.LogInformation("批量恢复编码完成 - 成功: {Success}, 失败: {Failed}", 
                        result.SuccessCount, result.FailedCount);
                    
                    return ApiResponse<BatchOperationResultDto>.SuccessResult(result);
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "批量恢复编码失败");
                return ApiResponse<BatchOperationResultDto>.ErrorResult($"批量恢复编码失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<ExportFileDto>> ExportCodeUsageToExcelAsync(CodeUsageExportQueryDto query)
        {
            await Task.CompletedTask;
            return ApiResponse<ExportFileDto>.ErrorResult("导出编码使用记录功能待实现");
        }

        public async Task<ApiResponse<ExportFileDto>> ExportModelClassificationsToExcelAsync(ExportQueryDto query)
        {
            await Task.CompletedTask;
            return ApiResponse<ExportFileDto>.ErrorResult("导出机型分类功能待实现");
        }

        public async Task<ApiResponse<PagedResult<BatchOperationHistoryDto>>> GetBatchOperationHistoryAsync(QueryDto query)
        {
            await Task.CompletedTask;
            var result = new PagedResult<BatchOperationHistoryDto>
            {
                Items = new List<BatchOperationHistoryDto>(),
                TotalCount = 0,
                PageIndex = query.PageIndex,
                PageSize = query.PageSize
            };

            return ApiResponse<PagedResult<BatchOperationHistoryDto>>.SuccessResult(result, "暂无批量操作历史记录");
        }

        public async Task<ApiResponse<BatchImportValidationResultDto>> ValidateBatchImportAsync(ValidateBatchImportDto dto)
        {
            await Task.CompletedTask;
            var result = new BatchImportValidationResultDto
            {
                TotalRecords = 0,
                ValidRecords = 0,
                InvalidRecords = 0,
                DuplicateRecordCount = 0,
                IsValid = true,
                Summary = "批量导入验证功能待实现"
            };

            return ApiResponse<BatchImportValidationResultDto>.SuccessResult(result);
        }

        public async Task<ApiResponse<ExportFileDto>> GenerateImportTemplateAsync(string templateType)
        {
            await Task.CompletedTask;
            return ApiResponse<ExportFileDto>.ErrorResult("生成导入模板功能待实现");
        }
    }
}