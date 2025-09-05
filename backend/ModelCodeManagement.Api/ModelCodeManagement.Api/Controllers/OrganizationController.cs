using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Filters;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 组织架构控制器
    /// </summary>
    [ApiController]
    [Route("api/v1/organization")]
    [Authorize]
    public class OrganizationController : ControllerBase
    {
        private readonly IOrganizationService _organizationService;

        public OrganizationController(IOrganizationService organizationService)
        {
            _organizationService = organizationService;
        }

        /// <summary>
        /// 分页获取组织架构列表
        /// </summary>
        [HttpGet]
        [Authorize(Policy = "OrganizationView")] // RBAC权限控制：需要组织架构查看权限
        public async Task<IActionResult> GetPaged([FromQuery] OrganizationQueryDto query)
        {
            var result = await _organizationService.GetPagedAsync(query);
            return Ok(result);
        }

        /// <summary>
        /// 根据ID获取组织架构
        /// </summary>
        [HttpGet("{id:int}")]
        [Authorize(Policy = "OrganizationView")] // RBAC权限控制：需要组织架构查看权限
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _organizationService.GetByIdAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 获取组织架构树
        /// </summary>
        [HttpGet("tree")]
        public async Task<IActionResult> GetTree()
        {
            var result = await _organizationService.GetTreeAsync();
            return Ok(result);
        }

        /// <summary>
        /// 根据父级ID获取子级组织列表
        /// </summary>
        [HttpGet("children")]
        public async Task<IActionResult> GetChildren([FromQuery] int? parentId)
        {
            var result = await _organizationService.GetChildrenAsync(parentId);
            return Ok(result);
        }

        /// <summary>
        /// 创建组织架构
        /// </summary>
        [HttpPost]
        [Authorize(Policy = "OrganizationManage")] // RBAC权限控制：需要组织架构管理权限
        [AuditLog("CreateOrganization", "Organization")]
        public async Task<IActionResult> Create([FromBody] CreateOrganizationDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int id) ? id : (int?)null;

            var result = await _organizationService.CreateAsync(dto, userId);
            
            if (result.Success)
                return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 更新组织架构
        /// </summary>
        [HttpPut("{id:int}")]
        [Authorize(Policy = "OrganizationManage")] // RBAC权限控制：需要组织架构管理权限
        [AuditLog("UpdateOrganization", "Organization")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateOrganizationDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : (int?)null;

            var result = await _organizationService.UpdateAsync(id, dto, userId);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 删除组织架构
        /// </summary>
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "OrganizationManage")] // RBAC权限控制：需要组织架构管理权限
        [AuditLog("DeleteOrganization", "Organization")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _organizationService.DeleteAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 移动组织架构
        /// </summary>
        [HttpPatch("{id:int}/move")]
        [Authorize(Policy = "OrganizationManage")] // RBAC权限控制：需要组织架构管理权限
        public async Task<IActionResult> Move(int id, [FromBody] MoveOrganizationDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : (int?)null;

            var result = await _organizationService.MoveAsync(id, dto, userId);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取组织的上级路径
        /// </summary>
        [HttpGet("{id:int}/ancestors")]
        public async Task<IActionResult> GetAncestors(int id)
        {
            var result = await _organizationService.GetAncestorsAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// 获取组织的下级路径
        /// </summary>
        [HttpGet("{id:int}/descendants")]
        public async Task<IActionResult> GetDescendants(int id)
        {
            var result = await _organizationService.GetDescendantsAsync(id);
            return Ok(result);
        }
    }
}