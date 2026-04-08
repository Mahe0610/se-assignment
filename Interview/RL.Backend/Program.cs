using System.Text.Json;
using Microsoft.AspNetCore.OData;
using RL.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RL.Backend.Seed;

var builder = WebApplication.CreateBuilder(args);
// Add services to the container.
builder.Services.AddMediatR(typeof(Program));
builder.Services.AddSqlite<RLContext>("Data Source=Database.db");

builder.Services.AddControllers()
    .AddOData(options => options.Select().Filter().Expand().OrderBy())
    .AddJsonOptions(options => options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var corsPolicy = "AllowAll";

builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicy, policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "RL API");
    c.RoutePrefix = string.Empty;
});

app.UseHttpsRedirection();

app.UseCors(corsPolicy);

app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RLContext>();
    //db.Database.EnsureDeleted();
    db.Database.Migrate();
    DatabaseSeeder.Seed(db);
}

app.Run();