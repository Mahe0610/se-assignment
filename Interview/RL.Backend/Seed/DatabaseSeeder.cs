using RL.Data;
using RL.Data.DataModels;

namespace RL.Backend.Seed;

public static class DatabaseSeeder
{
    public static void Seed(RLContext context)
    {
        if (context.Procedures.Any()) return;

        var filePath = Path.Combine(AppContext.BaseDirectory, "ProcedureSeedData.csv");
        Console.WriteLine($"File path: {filePath}");

        if (!File.Exists(filePath))
        {
            Console.WriteLine("CSV file NOT found");
            return;
        }

        Console.WriteLine("CSV file found");

        var lines = File.ReadAllLines(filePath);

        var procedures = lines.Select((line, index) => new Procedure
        {
            ProcedureId = index + 1,
            ProcedureTitle = line
        }).ToList();

        context.Procedures.AddRange(procedures);
        context.SaveChanges();
    }
}