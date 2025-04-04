import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
    },
    {
        path:'chat',
        loadComponent: () => import('./pages/chat/chat.component').then(m => m.ChatComponent)
    },
    {
        path:'**',
        redirectTo: 'login'
    }
];
