import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-view-wallet',
  templateUrl: './view-wallet.component.html',
  styleUrls: ['./view-wallet.component.scss'],
})
export class ViewWalletComponent  implements OnInit {

  @Input() currentAccount?: string;
  @Input() currentNetwork?: string;
  @Input() currentNetworkName?: string;
  @Input() walletText?: string;
  @Input() walletButtonColor?: string;
  @Input() isConnected?: boolean;

  @Output() connectToWallet = new EventEmitter();

  constructor() { }

  ngOnInit() {}

  onConnectToMetaMask(): void {
    this.connectToWallet.emit();

    // TODO add to chain params for Metamask
    
  }


}
