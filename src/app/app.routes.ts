import { Routes } from '@angular/router';
import { Home } from './Layouts/home/home';
import { Admin } from './Layouts/admin/admin';
import { AdminLogin } from './Layouts/admin-login/admin-login';
import { adminGuard } from './guards/admin.guard';
import { Privacy } from './Layouts/privacy/privacy';

export const routes: Routes = [
	{ path: '', component: Home },
	{ path: 'privacy', component: Privacy },
	{ path: 'admin/login', component: AdminLogin },
	{ path: 'admin', component: Admin, canActivate: [adminGuard] },
	{ path: '**', redirectTo: '' },
];
