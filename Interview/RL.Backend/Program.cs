using System.Text.Json;
using Microsoft.AspNetCore.OData;
using Microsoft.EntityFrameworkCore;
using RL.Data;
using MediatR;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddMediatR(typeof(Program));
builder.Services.AddSqlite<RLContext>("Data Source=Database.db");
builder.Services.AddControllers()
    .AddOData(options => options.Select().Filter().Expand().OrderBy())
    .AddJsonOptions(options => options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase);
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.OperationFilter<EnableQueryFiler>();
});
var corsPolicy = "allowLocal";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: corsPolicy,
    policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001").AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<RLContext>();
    context.Database.EnsureCreated();
    context.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS PlanProcedureUsers (
            PlanId INTEGER NOT NULL,
            ProcedureId INTEGER NOT NULL,
            UserId INTEGER NOT NULL,
            CreateDate TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UpdateDate TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT PK_PlanProcedureUsers PRIMARY KEY (PlanId, ProcedureId, UserId),
            CONSTRAINT FK_PlanProcedureUsers_PlanProcedures FOREIGN KEY (PlanId, ProcedureId) REFERENCES PlanProcedures (PlanId, ProcedureId) ON DELETE CASCADE,
            CONSTRAINT FK_PlanProcedureUsers_Users_UserId FOREIGN KEY (UserId) REFERENCES Users (UserId) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS IX_PlanProcedureUsers_UserId ON PlanProcedureUsers (UserId);
    ");
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "RL v1");
    c.RoutePrefix = string.Empty;
});

//app.UseHttpsRedirection();

app.UseCors(corsPolicy);

app.UseAuthorization();

app.MapControllers();

app.Run();
