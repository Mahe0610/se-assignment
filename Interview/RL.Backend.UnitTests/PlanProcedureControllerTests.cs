using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using RL.Backend.Controllers;
using RL.Backend.Models;
using RL.Data;
using RL.Data.DataModels;

namespace RL.Backend.UnitTests;

[TestClass]
public class PlanProcedureControllerTests
{
    [TestMethod]
    public async Task AssignUser_PersistsAssignmentAndReturnsUser()
    {
        var context = DbContextHelper.CreateContext();
        await SeedPlanProcedureAsync(context, planId: 1, procedureId: 2, userIds: Array.Empty<int>());
        if (!await context.Users.AnyAsync(u => u.UserId == 3))
        {
            context.Users.Add(new User
            {
                UserId = 3,
                Name = "Tony Bidner"
            });
            await context.SaveChangesAsync();
        }
        var sut = CreateSut(context);

        var result = await sut.AssignUser(new AssignUserToPlanProcedureRequest
        {
            PlanId = 1,
            ProcedureId = 2,
            UserId = 3
        }, CancellationToken.None);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var assignment = okResult.Value.Should().BeOfType<PlanProcedureUser>().Subject;

        assignment.UserId.Should().Be(3);

        var dbAssignment = await context.PlanProcedureUsers.FirstOrDefaultAsync(ppu =>
            ppu.PlanId == 1 && ppu.ProcedureId == 2 && ppu.UserId == 3);
        dbAssignment.Should().NotBeNull();
    }

    [TestMethod]
    public async Task RemoveUser_RemovesSingleAssignment()
    {
        var context = DbContextHelper.CreateContext();
        await SeedPlanProcedureAsync(context, planId: 4, procedureId: 5, userIds: new[] { 1, 2 });
        var sut = CreateSut(context);

        var result = await sut.RemoveUser(new AssignUserToPlanProcedureRequest
        {
            PlanId = 4,
            ProcedureId = 5,
            UserId = 1
        }, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        (await context.PlanProcedureUsers.AnyAsync(ppu => ppu.PlanId == 4 && ppu.ProcedureId == 5 && ppu.UserId == 1))
            .Should().BeFalse();
        (await context.PlanProcedureUsers.AnyAsync(ppu => ppu.PlanId == 4 && ppu.ProcedureId == 5 && ppu.UserId == 2))
            .Should().BeTrue();
    }

    [TestMethod]
    public async Task RemoveAllUsers_RemovesAllAssignmentsForProcedure()
    {
        var context = DbContextHelper.CreateContext();
        await SeedPlanProcedureAsync(context, planId: 7, procedureId: 8, userIds: new[] { 1, 2, 3 });
        var sut = CreateSut(context);

        var result = await sut.RemoveAllUsers(new PlanProcedureUsersRequest
        {
            PlanId = 7,
            ProcedureId = 8
        }, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        (await context.PlanProcedureUsers.AnyAsync(ppu => ppu.PlanId == 7 && ppu.ProcedureId == 8))
            .Should().BeFalse();
    }

    [TestMethod]
    public async Task Get_ReturnsPlanProcedureAssignmentsIncludingUserDetails()
    {
        var context = DbContextHelper.CreateContext();
        await SeedPlanProcedureAsync(context, planId: 11, procedureId: 12, userIds: new[] { 2, 4 });
        var sut = CreateSut(context);

        var result = await sut.Get().FirstAsync(pp => pp.PlanId == 11 && pp.ProcedureId == 12);

        result.AssignedUsers.Should().HaveCount(2);
        result.AssignedUsers.Select(ppu => ppu.User.Name).Should().BeEquivalentTo(new[] { "Scott Cassidy", "Patryk Skwarko" });
    }

    private static PlanProcedureController CreateSut(RLContext context)
    {
        return new PlanProcedureController(new NullLogger<PlanProcedureController>(), context);
    }

    private static async Task SeedPlanProcedureAsync(RLContext context, int planId, int procedureId, IEnumerable<int> userIds)
    {
        context.Plans.Add(new Plan
        {
            PlanId = planId
        });
        context.Procedures.Add(new Procedure
        {
            ProcedureId = procedureId,
            ProcedureTitle = $"Procedure {procedureId}"
        });

        foreach (var userId in userIds.Distinct())
        {
            if (!await context.Users.AnyAsync(u => u.UserId == userId))
            {
                context.Users.Add(new User
                {
                    UserId = userId,
                    Name = userId switch
                    {
                        1 => "Nick Morrison",
                        2 => "Scott Cassidy",
                        3 => "Tony Bidner",
                        4 => "Patryk Skwarko",
                        _ => $"User {userId}"
                    }
                });
            }
        }

        context.PlanProcedures.Add(new PlanProcedure
        {
            PlanId = planId,
            ProcedureId = procedureId
        });

        await context.SaveChangesAsync();

        foreach (var userId in userIds.Distinct())
        {
            context.PlanProcedureUsers.Add(new PlanProcedureUser
            {
                PlanId = planId,
                ProcedureId = procedureId,
                UserId = userId
            });
        }

        await context.SaveChangesAsync();
    }
}
