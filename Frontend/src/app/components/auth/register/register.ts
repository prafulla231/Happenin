import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';  // <-- import HttpClient

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  apiUrl = 'http://localhost:5000/api/users/register';  // API endpoint

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient  // <-- inject HttpClient
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['user']
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const data = this.registerForm.value;
      console.log('Register', data);

      // Send POST request to the API
      this.http.post(this.apiUrl, data).subscribe({
        next: (response) => {
          console.log('Registration successful', response);
          // Navigate to login page after successful registration
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Registration failed', error);
          alert('Registration failed. Please try again.');
        }
      });
    }
  }
}
