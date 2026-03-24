using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.EntityFrameworkCore;
using RL.Backend.Models;
using RL.Data;
using RL.Data.DataModels;

namespace RL.Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class PlanProcedureController : ControllerBase
{
    private readonly ILogger<PlanProcedureController> _logger;
    private readonly RLContext _context;

    public PlanProcedureController(ILogger<PlanProcedureController> logger, RLContext context)
    {
        _logger = logger;
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    [HttpGet]
    [EnableQuery]
    public IQueryable<PlanProcedure> Get()
    {
        return _context.PlanProcedures
            .Include(pp => pp.Procedure)
            .Include(pp => pp.AssignedUsers)
            .ThenInclude(ppu => ppu.User);
    }

    [HttpPost("AssignUser")]
    public async Task<ActionResult<PlanProcedureUser>> AssignUser([FromBody] AssignUserToPlanProcedureRequest request, CancellationToken token)
    {
        if (request.PlanId < 1 || request.ProcedureId < 1 || request.UserId < 1)
        {
            return BadRequest("PlanId, ProcedureId and UserId must be greater than zero.");
        }

        var planProcedure = await _context.PlanProcedures
            .Include(pp => pp.AssignedUsers)
            .ThenInclude(ppu => ppu.User)
            .FirstOrDefaultAsync(pp => pp.PlanId == request.PlanId && pp.ProcedureId == request.ProcedureId, token);

        if (planProcedure is null)
        {
            return NotFound($"PlanProcedure ({request.PlanId}, {request.ProcedureId}) was not found.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.UserId, token);
        if (user is null)
        {
            return NotFound($"UserId {request.UserId} was not found.");
        }

        var existingAssignment = planProcedure.AssignedUsers.FirstOrDefault(ppu => ppu.UserId == request.UserId);
        if (existingAssignment is not null)
        {
            return Ok(existingAssignment);
        }

        var assignment = new PlanProcedureUser
        {
            PlanId = request.PlanId,
            ProcedureId = request.ProcedureId,
            UserId = request.UserId,
            User = user
        };

        _context.PlanProcedureUsers.Add(assignment);
        await _context.SaveChangesAsync(token);

        return Ok(assignment);
    }

    [HttpDelete("RemoveUser")]
    public async Task<IActionResult> RemoveUser([FromQuery] AssignUserToPlanProcedureRequest request, CancellationToken token)
    {
        if (request.PlanId < 1 || request.ProcedureId < 1 || request.UserId < 1)
        {
            return BadRequest("PlanId, ProcedureId and UserId must be greater than zero.");
        }

        var assignment = await _context.PlanProcedureUsers.FirstOrDefaultAsync(
            ppu => ppu.PlanId == request.PlanId && ppu.ProcedureId == request.ProcedureId && ppu.UserId == request.UserId,
            token);

        if (assignment != null)
        {
            _context.PlanProcedureUsers.Remove(assignment);
            await _context.SaveChangesAsync(token);
        }

        return NoContent();
    }

    [HttpDelete("RemoveAllUsers")]
    public async Task<IActionResult> RemoveAllUsers([FromQuery] PlanProcedureUsersRequest request, CancellationToken token)
    {
        if (request.PlanId < 1 || request.ProcedureId < 1)
        {
            return BadRequest("PlanId and ProcedureId must be greater than zero.");
        }

        var assignments = await _context.PlanProcedureUsers
            .Where(ppu => ppu.PlanId == request.PlanId && ppu.ProcedureId == request.ProcedureId)
            .ToListAsync(token);

        if (!assignments.Any())
        {
            return NoContent();
        }

        _context.PlanProcedureUsers.RemoveRange(assignments);
        await _context.SaveChangesAsync(token);

        return NoContent();
    }
}
