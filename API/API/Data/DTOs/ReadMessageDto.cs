namespace API.Data.DTOs;

public class ReadMessageDto
{
    public string Message { get; set; }
    public DateTime Timestamp { get; set; }
    public string Sender { get; set; }
}