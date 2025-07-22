// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PumpFunToken is ERC20, Ownable {
    string public description;
    string public image;

    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public constant MARKETING_RESERVE = 50_000_000 * 10**18; 

    address public constant MARKETING_WALLET = 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B; // Placeholder
    
    uint256 public constant TRADE_FEE_BPS = 100; // 1%
    address public treasury;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _image,
        address _creator
    ) ERC20(_name, _symbol) Ownable(_creator) {
        description = _description;
        image = _image;
        treasury = _creator;
        _mint(address(this), INITIAL_SUPPLY);
        _mint(MARKETING_WALLET, MARKETING_RESERVE);
    }

    function getBuyPrice(uint256 amount) public view returns (uint256) {
        uint256 ethBalance = address(this).balance;
        uint256 tokenBalance = balanceOf(address(this));
        return (amount * ethBalance) / tokenBalance;
    }

    function getSellPrice(uint256 amount) public view returns (uint256) {
        uint256 ethBalance = address(this).balance;
        uint256 tokenBalance = balanceOf(address(this));
        return (amount * ethBalance) / tokenBalance;
    }

    function buy(uint256 minTokens) public payable {
        uint256 ethBalance = address(this).balance - msg.value;
        uint256 tokenBalance = balanceOf(address(this));
        uint256 tokensToReceive = (msg.value * tokenBalance) / ethBalance;

        require(tokensToReceive >= minTokens, "Slippage limit exceeded");

        uint256 fee = (msg.value * TRADE_FEE_BPS) / 10000;
        payable(treasury).transfer(fee);

        _transfer(address(this), msg.sender, tokensToReceive);
    }

    function sell(uint256 amount) public {
        uint256 ethBalance = address(this).balance;
        uint256 tokenBalance = balanceOf(address(this));
        uint256 ethToReceive = (amount * ethBalance) / tokenBalance;

        uint256 fee = (ethToReceive * TRADE_FEE_BPS) / 10000;
        payable(treasury).transfer(fee);

        _transfer(msg.sender, address(this), amount);
        payable(msg.sender).transfer(ethToReceive - fee);
    }
}