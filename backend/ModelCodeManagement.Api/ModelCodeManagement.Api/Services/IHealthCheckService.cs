using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 健康检查服务接口
    /// </summary>
    public interface IHealthCheckService
    {
        /// <summary>
        /// 执行健康检查
        /// </summary>
        /// <returns>健康检查结果</returns>
        Task<HealthCheckResult> CheckHealthAsync();

        /// <summary>
        /// 检查数据库连接
        /// </summary>
        /// <returns>数据库连接状态</returns>
        Task<bool> CheckDatabaseConnectionAsync();

        /// <summary>
        /// 获取系统信息
        /// </summary>
        /// <returns>系统信息</returns>
        SystemInfoDto GetSystemInfo();
    }

    /// <summary>
    /// 健康检查结果
    /// </summary>
    public class HealthCheckResult
    {
        public bool IsHealthy { get; set; }
        public string Status { get; set; } = string.Empty;
        public Dictionary<string, object> Details { get; set; } = new();
        public DateTime CheckTime { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// 系统信息DTO
    /// </summary>
    public class SystemInfoDto
    {
        public string Version { get; set; } = "1.0.0";
        public string Environment { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public TimeSpan Uptime { get; set; }
        public long MemoryUsage { get; set; }
        public int ActiveConnections { get; set; }
    }
}