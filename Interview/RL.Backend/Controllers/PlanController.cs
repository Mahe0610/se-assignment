using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using RL.Backend.Commands;
using RL.Backend.Commands.Handlers.Plans;
using RL.Backend.Models;
using RL.Data;
using RL.Data.DataModels;

namespace RL.Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class PlanController : ControllerBase
{
    private readonly ILogger<PlanController> _logger;
    private readonly RLContext _context;
    private readonly IMediator _mediator;

    public PlanController(ILogger<PlanController> logger, RLContext context, IMediator mediator)
    {
        _logger = logger;
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    [HttpGet]
    [EnableQuery]
    public IEnumerable<Plan> Get()
    {
        return _context.Plans;
    }

    [HttpPost]
    public async Task<IActionResult> PostPlan(CreatePlanCommand command, CancellationToken token)
    {
        var response = await _mediator.Send(command, token);

        return response.ToActionResult();
    }

    [HttpPost("AddProcedureToPlan")]
    public async Task<IActionResult> AddProcedureToPlan(AddProcedureToPlanCommand command, CancellationToken token)
    {
        var response = await _mediator.Send(command, token);

        return response.ToActionResult();
    }

    [HttpDelete("RemoveProcedureFromPlan")]
    public async Task<IActionResult> RemoveProcedure(int planId, int procedureId)
    {
        var entity = await _context.PlanProcedures
            .FindAsync(planId, procedureId);

        if (entity != null)
        {
            _context.PlanProcedures.Remove(entity);
            await _context.SaveChangesAsync();
        }

        return NoContent();
    }
}
