using API.Data.Models;
using API.Fido2;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<FidoStoredCredential> FidoStoredCredential => Set<FidoStoredCredential>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<FidoStoredCredential>().HasKey(m => m.Id);
        builder.Entity<FidoStoredCredential>().Property(b => b.Id).ValueGeneratedOnAdd();

        base.OnModelCreating(builder);
    }
}