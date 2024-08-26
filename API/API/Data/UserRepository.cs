using System.Data;
using API.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public interface IUserRepository
{
    Task<User?> GetUserByUsername(string username);
    Task<User> CreateOrFind(string username);
}

public class UserRepository : IUserRepository
{
    ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetUserByUsername(string username)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.UserName == username);
    }

    public async Task<User> CreateOrFind(string username)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == username);
        if (user != null) return user;
        user = new User(username);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }
}