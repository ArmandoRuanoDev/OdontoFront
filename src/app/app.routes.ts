import { Routes } from '@angular/router';
import { MainPage } from './components/home/main-page/main-page';
import { Register } from './components/auth/register/register';

export const routes: Routes = [
    { path: '', pathMatch: 'full', component: MainPage },
    { path: 'registrarme', component: Register }
];
