using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using RL.Data.DataModels.Common;

namespace RL.Data.DataModels;

public class User : IChangeTrackable
{
    public User() => AssignedPlanProcedures = new List<PlanProcedureUser>();

    [Key]
    public int UserId { get; set; }
    public string Name { get; set; }
    [JsonIgnore]
    public virtual ICollection<PlanProcedureUser> AssignedPlanProcedures { get; set; }
    public DateTime CreateDate { get; set; }
    public DateTime UpdateDate { get; set; }
}
