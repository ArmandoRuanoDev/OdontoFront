import { Routes } from '@angular/router';
import { MainPage } from './components/home/main-page/main-page';
import { Register } from './components/auth/register/register';
import { VerifyEmail } from './components/auth/verify-email/verify-email';

export const routes: Routes = [
    { path: '', pathMatch: 'full', component: MainPage },
    { path: 'registrarme', component: Register },
    { path: 'verificar-correo', component: VerifyEmail }
];
