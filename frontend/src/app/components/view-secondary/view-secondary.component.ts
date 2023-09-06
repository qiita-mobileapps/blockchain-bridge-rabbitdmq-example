import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { ethers } from 'ethers';
import { secondaryNetworkToken } from '../../models/secondary-network-token/secondary-network-token.module';

@Component({
  selector: 'app-view-secondary',
  templateUrl: './view-secondary.component.html',
  styleUrls: ['./view-secondary.component.scss'],
})
export class ViewSecondaryComponent  implements OnInit {
  
  @Input() walletBalance?: string;

  @Output() connectToWallet = new EventEmitter();
  
  pryNetworkName: string = environment.BB_PRIMARY_NETWORK_NAME;
  pryNetworkTicker: string = environment.BB_PRIMARY_TOKEN_TICKER;
  fstAddress: string = environment.BB_PRIMARY_TOKEN_ADDRESS;
  sndNetworkName: string = environment.BB_SECONDARY_NETWORK_NAME;
  sndNetworkTicker: string = environment.BB_SECONDARY_TOKEN_TICKER;
  sndAddress: string = environment.BB_SECONDARY_TOKEN_ADDRESS;
  sndDecimal: string = environment.BB_SECONDARY_DECIMALS;
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
    const amountFormatted = ethers.utils.parseUnits(this.amount, this.sndDecimal)

    const provider = new ethers.providers.Web3Provider(ethlib)
    const signer = provider.getSigner()

    let contract = new ethers.Contract(
      this.sndAddress,
      secondaryNetworkToken.abi,
      signer
    )

    if (ethlib !== 'undefined') {

      var loading: any;

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
        }, 29000);
      }
      this.connectToWallet.emit();
    }
  }

}
