using API.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public interface IChatRepository
{
    public Task<ICollection<ChatMessage>> getMessages();
    public Task<bool> StoreMessages(ICollection<ChatMessage> messages);
    public Task<bool> StoreMessage(ChatMessage chatMessage);
}

public class ChatRepository : IChatRepository
{
    ApplicationDbContext _context;

    public ChatRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ICollection<ChatMessage>> getMessages()
    {
        return await _context.ChatMessages.ToListAsync();
    }

    public async Task<bool> StoreMessage(ChatMessage message)
    {
        await _context.ChatMessages.AddAsync(message);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }


    public async Task<bool> StoreMessages(ICollection<ChatMessage> messages)
    {
        await _context.ChatMessages.AddRangeAsync(messages);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }
}