using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace RL.Data;

public class RLContextFactory : IDesignTimeDbContextFactory<RLContext>
{
    public RLContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<RLContext>();

        optionsBuilder.UseSqlite("Data Source=Database.db");

        return new RLContext(optionsBuilder.Options);
    }
}
