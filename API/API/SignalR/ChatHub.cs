using API.Data;
using API.Data.DTOs;
using API.Data.Models;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

public class ChatHub : Hub
{
    IChatRepository _chatRepository;
    IUserRepository _userRepository;

    public ChatHub(IChatRepository chatRepository, IUserRepository userRepository)
    {
        _chatRepository = chatRepository;
        _userRepository = userRepository;
    }


    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        if (httpContext == null) throw new HubException("Connecting to the chat hub requires an http request.");

        var otherUser = httpContext.Request.Query["user"].ToString();

        var messages
            = await _chatRepository.getMessages();

        await Clients.Caller.SendAsync("ReceiveChats", messages);
    }


    public async Task SendMessage(SendMessageDto sendMessageDto)
    {
        Console.WriteLine(Context.User);
        var username = Context.User?.Identity?.Name;
        // Should notify user
        if (username == null) return;

        var sender = await _userRepository.GetUserByUsername(username);
        // Should notify user
        if (sender == null) return;

        var message = new ChatMessage()
        {
            Sender = sender,
            Message = sendMessageDto.Message,
            Timestamp = DateTime.Now,
        };

        ;

        if (!await _chatRepository.StoreMessage(message)) throw new HubException("Failed to send message");
        await Clients.All.SendAsync("NewMessage",
            new ReadMessageDto
            {
                Message = message.Message, Timestamp = message.Timestamp,
                SenderDisplayName = sender.DisplayName ?? sender.UserName
            });
    }
}