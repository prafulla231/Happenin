import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';  // <-- import HttpClient

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  apiUrl = 'http://localhost:5000/api/users/login';  // API endpoint

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient  // <-- inject HttpClient
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const data = this.loginForm.value;
      console.log('Login', data);

      this.http.post(this.apiUrl, data).subscribe({
        next: (response: any) => {
          console.log('Login successful', response);
          // TODO: Save token or user data if returned by API
          this.router.navigate(['/']);  // navigate to home on success
        },
        error: (error) => {
          console.error('Login failed', error);
          alert('Login failed. Please check your credentials and try again.');
        }
      });
    }
  }
}
