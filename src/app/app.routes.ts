import { Routes } from '@angular/router';
import { MainPage } from './components/home/main-page/main-page';
import { Register } from './components/auth/register/register';
import { VerifyEmail } from './components/auth/verify-email/verify-email';
import { ChoosePlan } from './components/auth/choose-plan/choose-plan';
import { HomeUser } from './components/home/home-user/home-user';
import { Login } from './components/auth/login/login';
import { ConfigurePanel } from './components/config/configure-panel/configure-panel';
import { ResetPassword } from './components/auth/reset-password/reset-password';

export const routes: Routes = [
    { path: '', pathMatch: 'full', component: MainPage },
    { path: 'iniciar-sesion', component: Login},
    { path: 'registrarme', component: Register },
    { path: 'recuperar-contrasena', component: ResetPassword },
    { path: 'verificar-correo', component: VerifyEmail },
    { path: 'elegir-plan', component: ChoosePlan },
    { path: 'configurar-panel', component: ConfigurePanel },
    { path: 'inicio', component: HomeUser },
];
