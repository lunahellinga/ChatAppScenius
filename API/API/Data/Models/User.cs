namespace API.Data.Models;

public class User
{
    public int Id { get; set; }
    public string UserName { get; set; }
    public string? DisplayName { get; set; }
    
    public ICollection<ChatMessage>? Messages { get; set; }

    public User(string userName)
    {
        UserName = userName;
        DisplayName = userName;
    }
}