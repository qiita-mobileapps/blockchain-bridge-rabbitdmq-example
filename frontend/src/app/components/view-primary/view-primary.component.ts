import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { ethers } from 'ethers';
import { primaryNetworkToken } from '../../models/primary-network-token/primary-network-token.module';

@Component({
  selector: 'app-view-primary',
  templateUrl: './view-primary.component.html',
  styleUrls: ['./view-primary.component.scss'],
})
export class ViewPrimaryComponent  implements OnInit {

  @Input() walletBalance?: string;

  @Output() connectToWallet = new EventEmitter();
  
  pryNetworkTicker: string = environment.BB_PRIMARY_TOKEN_TICKER;
  fstAddress: string = environment.BB_PRIMARY_TOKEN_ADDRESS;
  pryDecimals: string = environment.BB_PRIMARY_DECIMALS;
  sndNetworkName: string = environment.BB_SECONDARY_NETWORK_NAME;
  sndNetworkTicker: string = environment.BB_SECONDARY_TOKEN_TICKER;
  bridgeWallet = environment.BB_BRIDGE_WALLET;

  amount: string = "";
  trxInProgress: boolean = false;
  isBridged: boolean = false;

  constructor(
    private loadingController: LoadingController
  ) { }

  ngOnInit() {}

  async doBridge(){
    
    const ethlib = (window as any).ethereum
    const amountFormatted = ethers.utils.parseUnits(this.amount, this.pryDecimals)

    const provider = new ethers.providers.Web3Provider(ethlib)
    const signer = provider.getSigner()
    let contract = new ethers.Contract(
      this.fstAddress,
      primaryNetworkToken.abi,
      signer
    )

    if (ethlib !== 'undefined') {

      var loading :any;
      try {
        loading = await this.loadingController.create({
          message: 'In progress...',
          translucent: true,
          backdropDismiss: false,
        });
  
        this.trxInProgress = true
        await loading.present();

        const transaction = await contract['transfer'](
          this.bridgeWallet,
          amountFormatted.toString()
        )

        console.log('transaction :>> ', transaction)
        await transaction.wait()
        this.isBridged = true
        this.amount = ''
        this.trxInProgress = false
      } catch (error) {
        console.error(error)
        this.trxInProgress = false
      } finally {
        setTimeout(() => {
          loading.dismiss();
        }, 10000);
      }
      this.connectToWallet.emit();


    }




  }
  
}
