using ModelCodeManagement.Api.Data;
using ModelCodeManagement.Api.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 健康检查服务实现
    /// </summary>
    public class HealthCheckService : IHealthCheckService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<HealthCheckService> _logger;
        private readonly IWebHostEnvironment _environment;
        private static readonly DateTime _startTime = DateTime.UtcNow;

        public HealthCheckService(
            ApplicationDbContext context,
            ILogger<HealthCheckService> logger,
            IWebHostEnvironment environment)
        {
            _context = context;
            _logger = logger;
            _environment = environment;
        }

        public async Task<HealthCheckResult> CheckHealthAsync()
        {
            var result = new HealthCheckResult
            {
                Details = new Dictionary<string, object>()
            };

            try
            {
                // 检查数据库连接
                var dbHealthy = await CheckDatabaseConnectionAsync();
                result.Details["Database"] = dbHealthy ? "Healthy" : "Unhealthy";

                // 检查内存使用情况
                var process = Process.GetCurrentProcess();
                var memoryUsage = process.WorkingSet64 / 1024 / 1024; // MB
                result.Details["MemoryUsage"] = $"{memoryUsage} MB";

                // 检查系统运行时间
                var uptime = DateTime.UtcNow - _startTime;
                result.Details["Uptime"] = uptime.ToString(@"dd\.hh\:mm\:ss");

                // 检查环境信息
                result.Details["Environment"] = _environment.EnvironmentName;
                result.Details["MachineName"] = Environment.MachineName;
                result.Details["ProcessorCount"] = Environment.ProcessorCount;

                // 综合判断健康状态
                result.IsHealthy = dbHealthy && memoryUsage < 1000; // 内存使用超过1GB认为不健康
                result.Status = result.IsHealthy ? "Healthy" : "Unhealthy";

                _logger.LogInformation("健康检查完成 - Status: {Status}, Details: {@Details}", 
                    result.Status, result.Details);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "健康检查失败");
                result.IsHealthy = false;
                result.Status = "Unhealthy";
                result.Details["Error"] = ex.Message;
            }

            return result;
        }

        public async Task<bool> CheckDatabaseConnectionAsync()
        {
            try
            {
                // 尝试执行一个简单的数据库查询
                await _context.Database.ExecuteSqlRawAsync("SELECT 1");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "数据库连接检查失败");
                return false;
            }
        }

        public SystemInfoDto GetSystemInfo()
        {
            var process = Process.GetCurrentProcess();
            var uptime = DateTime.UtcNow - _startTime;

            return new SystemInfoDto
            {
                Version = "1.0.0",
                Environment = _environment.EnvironmentName,
                StartTime = _startTime,
                Uptime = uptime,
                MemoryUsage = process.WorkingSet64 / 1024 / 1024, // MB
                ActiveConnections = 0 // 可以根据需要实现具体的连接数统计
            };
        }
    }
}