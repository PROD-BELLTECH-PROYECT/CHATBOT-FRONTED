import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import { loginService } from '../../service/login.service';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
@Component({
  selector: 'app-login',
  imports: [CommonModule,HttpClientModule,FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  providers:[loginService]
})
export class LoginComponent {
  constructor(private loginService: loginService, private router: Router) { }

errorMessage: any;
email: any;
password: any;
onLogin() {
  if (this.email === 'supervisor@belltech.la' && this.password === 'supervisor') {
    this.router.navigate(['/chat']); // Redirigir si es exitoso

    // Generar un token aleatorio para identificar chat
    const token = Math.random().toString(36).substring(2);
    sessionStorage.setItem('token', token);
  } else {
    this.errorMessage = 'Usuario o contraseña incorrectos';
  }
}

}
