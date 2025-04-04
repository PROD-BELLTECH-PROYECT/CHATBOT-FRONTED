import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../enviroment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class loginService {
  constructor(private http:HttpClient) { }
 
login(email: string, password: string): Observable<boolean> {
    return this.http.get<any[]>(environment.apiUrl+"/usuarios").pipe(
      map(usuarios => { 
        const usuario = usuarios.find(u => u.email === email && u.password === password);
        if (usuario) {
          localStorage.setItem('usuario', JSON.stringify(usuario)); // Guardar usuario en localStorage
          return true;
        } else {
          return false;
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('usuario');
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('usuario') !== null;
  }
}