import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
// import { environment } from '../../../../environment.prod'
import { environment } from '../../../../environment';
import { AuthService } from '../../../services/auth';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  isLogin = true;

  loginForm: FormGroup;
  registerForm: FormGroup;

  loginUrl = environment.apiBaseUrl + environment.apis.loginUser;
  registerUrl = environment.apiBaseUrl + environment.apis.registerUser;



  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private authService : AuthService

  ) {
    // Login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    // Register form
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['user']
    });
  }

  toggleForm(isLoginForm: boolean): void {
    this.isLogin = isLoginForm;
  }

  onLoginSubmit(): void {
    if (this.loginForm.valid) {
      const data = this.loginForm.value;

      //this.authService.loginUser(data)

      this.authService.loginUser(data).subscribe({
        next: (response: any) => {
          const userRole = response.data.user?.role;

          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
          if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }

          if (userRole === 'organizer') {
            this.router.navigate(['/organizer-dashboard']);
          } else if (userRole === 'admin') {
            this.router.navigate(['/admin-dashboard']);
          } else {
            this.router.navigate(['/user-dashboard']);
          }
        },
        error: (error) => {
          console.error('Login failed', error);
          alert('Login failed. Please check your credentials and try again.');
        }
      });
    }
  }

  onRegisterSubmit(): void {
    if (this.registerForm.valid) {
      const data = this.registerForm.value;

      this.http.post(this.registerUrl, data).subscribe({
        next: () => {
          alert('Registration successful! You can now log in.');
          this.toggleForm(true); // switch to login after successful registration
        },
        error: (error) => {
          console.error('Registration failed', error);
          alert('Registration failed. Please try again.');
        }
      });
    }
  }
}
