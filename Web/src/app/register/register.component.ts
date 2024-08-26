import {Component} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
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
  registerForm = new FormGroup({
    name : new FormControl('', [Validators.required, Validators.min(4), Validators.max(50)]),
    displayName : new FormControl('', [Validators.min(4), Validators.max(50)])
  })


  async register() {
    if (this.registerForm.valid) {
      const val = this.registerForm.value
      try {
        await this.accountService.handleRegisterSubmit(val.name!, val.displayName! ?? val.name!)
      } catch (e) {

      }
    }
  }
}
