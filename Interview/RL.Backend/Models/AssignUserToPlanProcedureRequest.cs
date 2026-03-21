namespace RL.Backend.Models;

public class AssignUserToPlanProcedureRequest
{
    public int PlanId { get; set; }
    public int ProcedureId { get; set; }
    public int UserId { get; set; }
}
