import {Component} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {AccountService} from "../_services/account.service";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})

export class RegisterComponent {

  constructor(private accountService: AccountService) {
  }

  name = new FormControl('', [Validators.required, Validators.min(4), Validators.max(50)]);
  displayName = new FormControl('', [Validators.min(4), Validators.max(50)]);

  async register() {
    if (this.name.valid && this.displayName.valid) {
      try {
        await this.accountService.handleRegisterSubmit(this.name.value!, this.displayName.value! ?? this.name.value!)
      } catch (e) {

      }
    }
  }
}
