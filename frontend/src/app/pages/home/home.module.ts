import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomePageRoutingModule } from './home-routing.module';

import { HomePage } from './home.page';
import { ViewPrimaryComponent } from '../../components/view-primary/view-primary.component';
import { ViewSecondaryComponent } from '../../components/view-secondary/view-secondary.component';
import { ViewWalletComponent } from '../../components/view-wallet/view-wallet.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule
  ],
  declarations: [
    HomePage,
    ViewPrimaryComponent,
    ViewSecondaryComponent,
    ViewWalletComponent,
  ],
})
export class HomePageModule {}
