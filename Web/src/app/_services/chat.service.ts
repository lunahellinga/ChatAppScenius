import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Message} from "../_models/message";
import {HubConnection, HubConnectionBuilder} from "@microsoft/signalr";
import {User} from "../_models/user";
import {BehaviorSubject} from "rxjs";
import {take} from "rxjs/operators";
import {environment} from "../../environment";

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  hubUrl = environment.hubUrl;
  private hubConnection: HubConnection | undefined;
  private messageThreadSource = new BehaviorSubject<Message[]>([]);
  messageThread$ = this.messageThreadSource.asObservable();

  constructor(private http: HttpClient) {
  }

  createHubConnection(user: User) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl + 'chat', {
        accessTokenFactory: () => user.token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .catch(error => console.log(error))

    this.hubConnection.on('ReceiveChats', messages => {
      this.messageThreadSource.next(messages);
    })

    this.hubConnection.on("NewMessage", message => {
      this.messageThread$.pipe(take(1)).subscribe(messages => {
        this.messageThreadSource.next([...messages, message])
      })
    })
  }

  stopHubConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.messageThreadSource.next([]);
    }
  }

  async sendMessage(username: string, content: string) {
    if (this.hubConnection) {
      return this.hubConnection.invoke("SendMessage", {recipientUsername: username, content})
        .catch(error => console.log(error))
    }
    else {
      console.log("Hub not connected");
    }
  }

}
