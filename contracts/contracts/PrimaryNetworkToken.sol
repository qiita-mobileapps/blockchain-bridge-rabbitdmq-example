// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import the necessary functionality from OpenZeppelin
import "hardhat/console.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// This contract defines the PrimaryNetworkToken, an ERC20 token with a specified initial supply.
contract PrimaryNetworkToken is ERC20 {
    
    // Constructor to create the token with the specified name, symbol, and initial supply
    constructor(
        string memory _name,        // The human-readable name of the token (e.g., "My Token")
        string memory _symbol,      // The token's symbol or ticker (e.g., "MTK")
        uint256 _initialSupply      // The initial supply of tokens
    ) ERC20(_name, _symbol) {      // Initialize the ERC20 token with the given name and symbol
        // Mint the initial supply of tokens and send them to the deployer's wallet
        // _mint is a function provided by the ERC20 contract
        _mint(msg.sender, _initialSupply * (10**uint256(18)));  // Multiplying by 10^18 to convert to token decimals
    }
}
