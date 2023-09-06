import { Component, OnInit, HostListener } from '@angular/core';
import { environment } from '../../../environments/environment';
import { primaryNetworkToken } from '../../models/primary-network-token/primary-network-token.module';
import { secondaryNetworkToken } from '../../models/secondary-network-token/secondary-network-token.module';
import { ethers } from 'ethers';
import { UserStrageService } from '../../providers/user-strage.service'

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})

export class HomePage implements OnInit {

  // Get the app title from environment settings
  appTitle: string = environment.BB;

  // Retrieve primary network information from environment settings
  pryNetworkName: string = environment.BB_PRIMARY_NETWORK_NAME;
  pryNetworkTicker: string = environment.BB_PRIMARY_TOKEN_TICKER;
  pryNetworkId = environment.BB_PRIMARY_NETWORK_ID;
  pryTokenAddress = environment.BB_PRIMARY_TOKEN_ADDRESS;
  pryRpcUrl = environment.BB_PRIMARY_NETWORK_RPC;
  pryDecimals = environment.BB_PRIMARY_DECIMALS;
  pryBlockExplorer = environment.BB_PRIMARY_NETWORK_BLOCKEXPLORER;

  // Retrieve secondary network information from environment settings
  sndNetworkName: string = environment.BB_SECONDARY_NETWORK_NAME;
  sndNetworkTicker: string = environment.BB_SECONDARY_TOKEN_TICKER;
  sndNetworkId = environment.BB_SECONDARY_NETWORK_ID;
  sndTokenAddress = environment.BB_SECONDARY_TOKEN_ADDRESS;
  sndRpcUrl = environment.BB_SECONDARY_NETWORK_RPC;
  sndDecimal = environment.BB_SECONDARY_DECIMALS;

  // Get ABI and Bytecode information for networks
  primaryAbi = primaryNetworkToken.abi;
  primaryBytecode = primaryNetworkToken.bytecode;
  secondaryAbi = secondaryNetworkToken.abi;
  secondaryBytecode = secondaryNetworkToken.bytecode;

  // Variables to hold current chain information
  currentChainId: any = environment.BB_PRIMARY_NETWORK_ID;
  currentNetworkName: any = environment.BB_PRIMARY_NETWORK_NAME;
  currentTokenAddress: any = environment.BB_PRIMARY_TOKEN_ADDRESS;
  currentDecimal: any = environment.BB_PRIMARY_DECIMALS;
  currentAbi = this.primaryAbi;
  currentBytecode = this.primaryBytecode;
  currentContract: any;

  // Check if the window width is small
  isWindowWidthSmall = false;

  // Track whether the primary or secondary network is selected
  isPrimary = true;

  // Track the selected segment
  selectedSegment = "primary";

  // Variables for wallet-related information
  isEthereumReady?: boolean;
  isMetaMask?: boolean;
  accounts?: any[];
  currentAccount?: string | undefined;
  currentNetwork?: string | undefined;
  walletText: string | undefined = "Connect to Wallet"
  walletButtonColor = 'danger';
  isConnected: boolean = false;
  isSwitched = "";

  // Variable to hold wallet balance
  walletBalance: any;

  // Primary contract information
  primaryContract: any;

  // Store window width
  windowWidth: number = 750;

  constructor(
    private userStrageService: UserStrageService
  ) { 
    this.getScreenWidth(); 
  }

  ngOnInit() {
    console.log("Window reloaded.");
  }

  // Method to check balance
  async checkBalance() {
    try {
      let balance = await this.currentContract.balanceOf(this.currentAccount)
      balance = ethers.utils.formatUnits(balance, this.currentDecimal)
      this.walletBalance = balance
    } catch (error) {
      console.error('Balance Failure.', error)
    }
  }

  // Method when segment is clicked
  async segmentClicked() {
    if (this.selectedSegment === 'primary') {
      this.currentChainId = this.pryNetworkId;
      this.currentNetworkName = this.pryNetworkName;
      this.currentTokenAddress = this.pryTokenAddress;
      this.currentAbi = this.primaryAbi;
      this.currentBytecode = this.primaryBytecode;
      this.currentDecimal = this.pryDecimals;
      if (!(this.isPrimary)){
        await this.connectToWallet();
      }
      this.isPrimary = true;
    } else {
      this.currentChainId = this.sndNetworkId;
      this.currentNetworkName = this.sndNetworkName;
      this.currentTokenAddress = this.sndTokenAddress;
      this.currentAbi = this.secondaryAbi;
      this.currentBytecode = this.secondaryBytecode;
      this.currentDecimal = this.sndDecimal;
      if (this.isPrimary){
        await this.connectToWallet();
      }
      this.isPrimary = false;
    }
  }

  // Method to set contract
  async setContract(){
    const provider = new ethers.providers.Web3Provider((window as any).ethereum)
    const signer = provider.getSigner()
    this.currentContract = new ethers.Contract(
      this.currentTokenAddress,
      this.currentAbi,
      signer
    )
  }

  // Event listener for window resize
  @HostListener('window:resize', ['$event'])
  getScreenWidth() {
    var size = window.innerWidth;
    if (size < this.windowWidth ) {
      this.isWindowWidthSmall = true;
    } else {
      this.isWindowWidthSmall = false;
    }
  }
 
  // Method to connect to wallet
  async connectToWallet(): Promise<void> {
    this.isConnected = false;
    const ethlib = (window as any).ethereum
    this.isEthereumReady = typeof ethlib === undefined;
    if (this.isEthereumReady) {
      return;
    }
    this.isMetaMask = ethlib.isMetaMask;
    if (!this.isMetaMask) {
      return;
    }

    try {
      this.isSwitched = await ethlib.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.currentChainId }],
      });
    } catch (error) {
      return;
    }

    try {
      this.accounts = await ethlib.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      return;
    }
    if (this.accounts === undefined || this.accounts.length === 0) {
      return;
    }
    try {
      this.currentAccount = ethlib.selectedAddress;
    } catch (error) {
      return;
    }
    this.isConnected = true;
    this.walletText = this.currentAccount?.substr( 0, 8 ) + '...';
    this.walletButtonColor = 'success';

    await this.userStrageService.setNetworkId(this.currentNetwork);
    await this.setContract();
    await this.checkBalance();

    this.currentNetwork = ethlib.networkVersion;
    
  }
}
