namespace API.Data.Models;

public class ChatMessage
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User Sender { get; set; }
    public string Message { get; set; }
    public DateTime Timestamp { get; set; }
}