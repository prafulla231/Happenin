import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import emailjs from "@emailjs/browser";

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss']
})
export class Contact implements OnInit {
  contactForm: FormGroup;
  isSubmitting: boolean = false;
  showSuccessMessage: boolean = false;
  showErrorMessage: boolean = false;



  // EmailJS configuration - Replace these with your actual EmailJS credentials
  private readonly EMAIL_JS_SERVICE_ID = 'service_50vt25n';
  private readonly EMAIL_JS_TEMPLATE_ID = 'template_1ggkgea';
  private readonly EMAIL_JS_PUBLIC_KEY = '-oay8RuWXR7nzb07B';

  // You might want to inject a service to get user data
  userData: any = {};


  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.contactForm = this.createForm();
  }

  ngOnInit(): void {
    // Initialize EmailJS
    // emailjs.init(this.EMAIL_JS_PUBLIC_KEY);

    this.loadUserData();
    this.populateUserDetails();
  }



  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      category: ['', [Validators.required]],
      subject: ['', [Validators.required]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['medium']
    });
  }

 private loadUserData(): void {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    this.userData = {
      id: parsedUser.userId || 'guest',
      name: parsedUser.name,
      email: parsedUser.email
    };
    // console.log('Parsed User Data:', this.userData);
  } else {
    this.userData = { id: 'guest', name: '', email: '' };
  }
}

  private populateUserDetails(): void {
    if (this.userData) {
      this.contactForm.patchValue({
        name: this.userData.name || `${this.userData.firstName} ${this.userData.lastName || ''}`,
        email: this.userData.email || ''
      });
    }
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      this.showErrorMessage = false;

      const formData = {
        ...this.contactForm.value,
        timestamp: new Date().toISOString(),
        userId: this.userData.id || 'guest'

      };

      this.sendEmailViaEmailJS(formData);
    } else {
      this.markFormGroupTouched();
    }
  }

  private sendEmailViaEmailJS(formData: any): void {
  // Prepare template parameters for EmailJS
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    this.userData = {
      id: parsedUser.userId || 'guest',
      name: parsedUser.name,
      email: parsedUser.email
    };
  }

  const templateParams = {
    to_email: 'happenin.events.app@gmail.com',
    userName: this.userData.name,        // Changed from 'from_name'
    userEmail: this.userData.email,      // Changed from 'from_email'
    phone: formData.phone || 'Not provided',
    category: formData.category,
    priority: formData.priority,
    subject: formData.subject,
    message: formData.message,
    timestamp: new Date(formData.timestamp).toLocaleString(),
    user_id: formData.userId,

    // Additional fields for a more detailed email
    inquiry_type: formData.category,
    contact_subject: `Contact Form: ${formData.category} - ${formData.subject}`,
  };

  emailjs.send(
    this.EMAIL_JS_SERVICE_ID,
    this.EMAIL_JS_TEMPLATE_ID,
    templateParams,
    this.EMAIL_JS_PUBLIC_KEY
  )
  .then(
    (response) => {
      console.log('Email sent successfully!', response.status, response.text);
      this.handleSubmissionSuccess();
    },
    (error) => {
      console.error('Failed to send email:', error);
      this.handleSubmissionError();
    }
  );
}
  private handleSubmissionSuccess(): void {
    this.isSubmitting = false;
    this.showSuccessMessage = true;
    this.contactForm.reset();
    this.populateUserDetails(); // Repopulate user details after reset

    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 5000);
  }

  private handleSubmissionError(): void {
    this.isSubmitting = false;
    this.showErrorMessage = true;

    // Auto-hide error message after 5 seconds
    setTimeout(() => {
      this.showErrorMessage = false;
    }, 5000);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  resetForm(): void {
    this.contactForm.reset();
    this.populateUserDetails();
    this.contactForm.patchValue({ priority: 'medium' });
    this.showSuccessMessage = false;
    this.showErrorMessage = false;
  }

  goBack(): void {
    this.router.navigate(['/user-dashboard']);
  }

  dismissMessage(): void {
    this.showSuccessMessage = false;
    this.showErrorMessage = false;
  }
}
