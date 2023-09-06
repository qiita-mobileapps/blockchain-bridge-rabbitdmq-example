// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import necessary functionality from OpenZeppelin
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

// This contract defines the SecondaryNetworkToken, an ERC20 token with additional burnable functionality.
contract SecondaryNetworkToken is ERC20, ERC20Burnable {
    // Address of the bridge contract that interacts with external networks.
    address public bridgeAddress;

    // Constructor to initialize the token with a name "SecondaryNetworkToken" and symbol "SNDY".
    constructor(address _bridge) ERC20("SecondaryNetworkToken", "ST") {
        bridgeAddress = _bridge;
    }

    // Modifier to ensure that only the bridge contract can trigger specific methods.
    modifier onlyBridge() {
        require(bridgeAddress == msg.sender, "Only the bridge.");
        _;
    }

    // Mint new tokens and assign them to the specified recipient.
    function mint(address _recipient, uint256 _amount) public virtual onlyBridge {
        // Mint the specified amount of tokens and assign them to the recipient.
        _mint(_recipient, _amount);
    }

    // Burn a certain amount of tokens from a specific account using the bridge's authority.
    function burnFrom(address _account, uint256 _amount) public virtual override(ERC20Burnable) onlyBridge {
        // Burn the specified amount of tokens from the specified account.
        super.burnFrom(_account, _amount);
    }
}
